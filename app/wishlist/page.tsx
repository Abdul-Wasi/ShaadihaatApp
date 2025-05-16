"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorCard } from "@/components/vendor-card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getWishlist, removeFromWishlist } from "@/lib/firebase/wishlist"
import type { Vendor } from "@/types"

export default function WishlistPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return

      setLoading(true)
      try {
        const wishlistVendors = await getWishlist(user.uid)
        setVendors(wishlistVendors)
      } catch (error) {
        console.error("Error fetching wishlist:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your wishlist",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [user, toast])

  const handleRemoveFromWishlist = async (vendorId: string) => {
    if (!user) return

    try {
      await removeFromWishlist(user.uid, vendorId)
      setVendors(vendors.filter((vendor) => vendor.id !== vendorId))
      toast({
        title: "Removed from wishlist",
        description: "Vendor has been removed from your wishlist",
      })
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove vendor from wishlist",
      })
    }
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view your wishlist.</p>
        <Button className="mt-4" asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">My Wishlist</h1>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              showWishlistButton
              isWishlisted
              onWishlistToggle={handleRemoveFromWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Your wishlist is empty</h3>
          <p className="mt-2 text-muted-foreground">
            Save your favorite vendors to your wishlist for easy access later
          </p>
          <Button className="mt-4" asChild>
            <Link href="/vendors">Browse Vendors</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
