"use client"

import Link from "next/link"
import {
  Package2,
  Home,
  BookOpen,
  PlusCircle,
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useDisconnectWallet } from "@mysten/dapp-kit"

interface NavigationMenuProps {
  address: string | null
  onClose?: () => void
}

export function NavigationMenu({ address, onClose }: NavigationMenuProps) {
  const { mutate: disconnect } = useDisconnectWallet()

  const handleNavigation = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full py-6">
      <div className="flex items-center gap-2 font-semibold mb-6">
        <Package2 className="h-6 w-6 text-primary" />
        <span>P2P Exchange</span>
      </div>

      <nav className="space-y-1">
        {!address ? (
          <>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/">
                <Home className="h-5 w-5 mr-2" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/listings">
                <BookOpen className="h-5 w-5 mr-2" />
                Order Book
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/dashboard">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/listings">
                <BookOpen className="h-5 w-5 mr-2" />
                Order Book
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/merchant/orders">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Manage Orders
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/listings/new">
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Listing
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/notifications">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </Link>
            </Button>

            <Separator className="my-4" />

            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/dashboard?tab=listings">
                <BookOpen className="h-5 w-5 mr-2" />
                My Listings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/dashboard?tab=trades">
                <BookOpen className="h-5 w-5 mr-2" />
                My Trades
              </Link>
            </Button>

            <Separator className="my-4" />

            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/settings">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start" onClick={handleNavigation}>
              <Link href="/help">
                <HelpCircle className="h-5 w-5 mr-2" />
                Help & Support
              </Link>
            </Button>
          </>
        )}
      </nav>

      {address && (
        <div className="mt-auto">
          <Separator className="my-4" />
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              disconnect()
              if (onClose) onClose()
            }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Disconnect Wallet
          </Button>
        </div>
      )}
    </div>
  )
}
