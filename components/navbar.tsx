"use client"

import Link from "next/link"
import { useState } from "react"
import { Package2, Menu, ShoppingCart, User } from "lucide-react"
import { ConnectButton } from "@/components/wallet/connect-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavigationMenu } from "@/components/navigation-menu"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BalanceDisplay } from "@/components/wallet/balance-display"

export function Navbar() {
  const currentAccount = useCurrentAccount()
  const address = currentAccount?.address
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <Link href={address ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="SuiXchange Logo" className="h-6 w-6" />
            <span className="hidden sm:inline">SuiXchange</span>
            </Link>

          {/* Desktop Navigation */}
          {address && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/listings"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/listings" ? "text-primary" : "text-foreground/60"}`}
              >
                Order Book
              </Link>
              <Link
                href="/merchant/order"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/merchant/order" ? "text-primary" : "text-foreground/60"}`}
              >
                Manage Orders
              </Link>
                <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/dashboard" ? "text-primary" : "text-foreground/60"}`}
                >
                Dashboard
                </Link>
                <Link
                href="/bridge"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/bridge" ? "text-primary" : "text-foreground/60"}`}
                >
                Bridge
                </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <NavigationMenu address={address ?? null} onClose={() => setShowMobileMenu(false)} />
              </SheetContent>
            </Sheet>
          </div>

          {address && (
            <>
              <div className="hidden md:block">
                <BalanceDisplay />
              </div>

              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/merchant/order">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Manage Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <ConnectButton />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!address && <ConnectButton />}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
