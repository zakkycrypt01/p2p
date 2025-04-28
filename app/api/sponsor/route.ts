import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { mnemonicToSeedSync } from "bip39";
import { toBase64 } from "@mysten/sui/utils";
import { type NextRequest, NextResponse } from "next/server";

// Fixed gas budget (tune as needed)
const GAS_BUDGET = 5000000;

// Serverless handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gaslessTx, sender } = body || {};

    if (typeof gaslessTx !== "string" || typeof sender !== "string") {
      return NextResponse.json(
        { error: "Missing gaslessTx or sender" },
        { status: 400 }
      );
    }

    // Load sponsor mnemonic from env instead of raw private key
    const mnemonic = process.env.SPONSOR_MNEMONIC;
    if (!mnemonic) {
      console.error("Sponsor mnemonic not configured");
      return NextResponse.json(
        { error: "SPONSOR_MNEMONIC environment variable is not set" },
        { status: 500 }
      );
    }

    // Derive a 32‑byte seed from the mnemonic
    const seed = mnemonicToSeedSync(mnemonic);
    // Ed25519 keypair from the first 32 bytes of the seed
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(seed.slice(0, 32));

    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log("🪙 Sponsor address (Devnet):", sponsorAddress);
    // now go to https://faucet.devnet.sui.io/ and paste that address to mint some SUI

    // Initialize Sui JSON-RPC client (e.g. Devnet)
    const client = new SuiClient({ url: getFullnodeUrl("devnet") });

    // Reconstruct the gasless transaction from base64
    const kindBytes = Uint8Array.from(Buffer.from(gaslessTx, "base64"));
    const sponsoredTx = Transaction.fromKind(kindBytes);
    sponsoredTx.setSender(sender);
    sponsoredTx.setGasOwner(sponsorAddress);

    // Fetch the sponsor's SUI coin objects for gas payment
    const paginated = await client.getCoins({
      owner: sponsorAddress,
      coinType: "0x2::sui::SUI",
    });
    const coins = paginated.data;
    if (coins.length === 0) {
      console.error("Sponsor has no SUI coins for gas");
      return NextResponse.json(
        { error: "Sponsor has insufficient gas" },
        { status: 400 }
      );
    }

    // Use the first coin for gas
    const coin = coins[0];
    sponsoredTx.setGasPayment([
      {
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
      },
    ]);
    sponsoredTx.setGasBudget(GAS_BUDGET);

    // 5) Build the full transaction bytes (BCS‐encoded)
    const fullBytes = await sponsoredTx.build({ client });
    const txBytes = toBase64(fullBytes);

    // 6) Sponsor signs the raw transaction bytes (Uint8Array)
    const rawSig = await sponsorKeypair.sign(fullBytes);

    // Convert signature to base64 for JSON transport
    const sponsorSignature = toBase64(rawSig);

    // Return base64 tx bytes and sponsor signature (base64)
    return NextResponse.json({ txBytes, sponsorSignature });

  } catch (e) {
    console.error("Sponsor function error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
