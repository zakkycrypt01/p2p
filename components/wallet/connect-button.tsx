"use client"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function ConnectButton() {
  const { connect, disconnect, address, isConnecting } = useWallet()
  const { toast } = useToast()

  if (!address) {
    return (
      <Button onClick={connect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address copied",
      description: "Your wallet address has been copied to clipboard",
      duration: 2000,
    })
  }

  const viewOnExplorer = () => {
    window.open(`https://explorer.sui.io/address/${address}`, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {truncatedAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

