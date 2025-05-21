"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InfoIcon, Lock, ShieldCheck, Key } from "lucide-react"

export function ChatInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure Chat Information</DialogTitle>
          <DialogDescription>Understanding the security features of your conversation</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">End-to-End Encryption</h3>
              <p className="text-sm text-muted-foreground">
                Messages are encrypted using AES-256-GCM and can only be read by you and your counterparty. Even if
                intercepted, the content remains private.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Zero-Knowledge Proofs</h3>
              <p className="text-sm text-muted-foreground">
                Each message includes a cryptographic proof that verifies the sender's identity without revealing their
                private keys. This prevents message spoofing and tampering.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Ephemeral Keys</h3>
              <p className="text-sm text-muted-foreground">
                Each chat session uses unique encryption keys that are never stored permanently. This provides perfect
                forward secrecy, protecting past conversations even if keys are later compromised.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md text-xs">
          <p className="font-medium mb-1">Technical Details:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Encryption: AES-256-GCM</li>
            <li>Key Exchange: ECDH P-256</li>
            <li>ZK Proofs: Groth16</li>
            <li>Hash Function: Poseidon</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
