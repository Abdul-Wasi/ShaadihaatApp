"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { UserNav } from "@/components/user-nav"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, userRole, isLoading, isFirebaseAvailable } = useAuth()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  return (
    <>
      {!isFirebaseAvailable && (
        <Alert variant="destructive" className="rounded-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Firebase is not properly configured. Some features may not work correctly. Please check your environment
            variables.
          </AlertDescription>
        </Alert>
      )}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-rose-600">ShaadiHaat</span>
            </Link>
            <nav className="hidden md:flex md:gap-6">
              <Link href="/vendors" className="text-sm font-medium transition-colors hover:text-rose-600">
                Find Vendors
              </Link>
              <Link href="/categories" className="text-sm font-medium transition-colors hover:text-rose-600">
                Categories
              </Link>
              {userRole === "vendor" && (
                <Link href="/vendor/dashboard" className="text-sm font-medium transition-colors hover:text-rose-600">
                  Vendor Dashboard
                </Link>
              )}
              {userRole === "admin" && (
                <Link href="/admin/dashboard" className="text-sm font-medium transition-colors hover:text-rose-600">
                  Admin Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            {!isLoading && !user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            ) : (
              <UserNav />
            )}
          </div>

          <button className="flex items-center justify-center md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="container pb-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              <Link href="/vendors" className="text-sm font-medium transition-colors hover:text-rose-600">
                Find Vendors
              </Link>
              <Link href="/categories" className="text-sm font-medium transition-colors hover:text-rose-600">
                Categories
              </Link>
              {userRole === "vendor" && (
                <Link href="/vendor/dashboard" className="text-sm font-medium transition-colors hover:text-rose-600">
                  Vendor Dashboard
                </Link>
              )}
              {userRole === "admin" && (
                <Link href="/admin/dashboard" className="text-sm font-medium transition-colors hover:text-rose-600">
                  Admin Dashboard
                </Link>
              )}
              {!isLoading && !user ? (
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login">Log In</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700">
                    <Link href="/auth/register">Sign Up</Link>
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <UserNav />
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
