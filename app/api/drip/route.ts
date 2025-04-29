import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { mnemonicToSeedSync } from 'bip39';
import { toBase64 } from '@mysten/sui/utils';

const DRIP_AMOUNT = 70_000_000; // 0.01 SUI in mist

export async function POST(req: NextRequest) {
  console.log('[drip] Incoming request URL:', req.url);
  let body: any;
  try {
    body = await req.json();
    console.log('[drip] Request body:', body);
  } catch (parseErr) {
    console.error('[drip] Invalid JSON:', parseErr);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const { recipient } = body;
    if (typeof recipient !== 'string') {
      return NextResponse.json({ error: 'Missing recipient address' }, { status: 400 });
    }

    const mnemonic = process.env.GAS_SPONSOR_MNEMONIC;
    if (!mnemonic) {
      console.error('[drip] GAS_SPONSOR_MNEMONIC unset');
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    // skip drip if user already has ≥0.02 SUI
    const userCoins = await client.getCoins({ owner: recipient, coinType: '0x2::sui::SUI' });
    const userTotal = userCoins.data.reduce((sum, c) => sum + BigInt(c.balance), BigInt(0));
    if (userTotal > BigInt(50_000_000)) {
      return NextResponse.json({ message: 'Sufficient balance' }, { status: 200 });
    }

    // derive sponsor keypair
    const seed = mnemonicToSeedSync(mnemonic);
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(seed.slice(0, 32));
    const sponsorAddr = sponsorKeypair.getPublicKey().toSuiAddress();

    // ensure sponsor has coins
    const sponsorCoins = await client.getCoins({ owner: sponsorAddr, coinType: '0x2::sui::SUI' });
    if (sponsorCoins.data.length === 0) {
      console.error('[drip] Sponsor out of gas');
      return NextResponse.json({ error: 'Sponsor has no gas' }, { status: 400 });
    }

    // build & send
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(DRIP_AMOUNT)]);
    tx.transferObjects([coin], tx.pure.address(recipient));
    tx.setSender(sponsorAddr);
    tx.setGasOwner(sponsorAddr);
    tx.setGasPayment([{
      objectId: sponsorCoins.data[0].coinObjectId,
      version: sponsorCoins.data[0].version,
      digest: sponsorCoins.data[0].digest,
    }]);
    tx.setGasBudget(50_000_000);

    // build
    const bytes = await tx.build({ client });

    // new: use signTransactionBlock helper to get { signature, pubKey, scheme }
    const signed = await sponsorKeypair.signTransaction(bytes);
    const resp = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: signed.signature,
      options: { showEffects: true },
    });

    console.log('[drip] executeTransactionBlock resp:', resp);

    if (resp.effects?.status.status === 'success') {
      return NextResponse.json({
        message: 'SUI dripped',
        txDigest: resp.digest,
        amount: DRIP_AMOUNT,
      }, { status: 200 });
    } else {
      console.warn('[drip] Tx failed:', resp.effects?.status);
      return NextResponse.json({
        error: 'Transaction failed',
        details: resp.effects?.status,
      }, { status: 400 });
    }
  } catch (e: any) {
    console.error('[drip] Unexpected error:', e);
    return NextResponse.json(
      { error: e.message || 'Unknown error' },
      { status: 500 }
    );
  }
}