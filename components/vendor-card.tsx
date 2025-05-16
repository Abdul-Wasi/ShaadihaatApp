"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, Heart } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Vendor } from "@/types"

interface VendorCardProps {
  vendor: Vendor
  showWishlistButton?: boolean
  isWishlisted?: boolean
  onWishlistToggle?: (vendorId: string) => void
}

export function VendorCard({
  vendor,
  showWishlistButton = false,
  isWishlisted = false,
  onWishlistToggle,
}: VendorCardProps) {
  // Ensure vendor has all required properties with fallbacks
  const safeVendor = {
    ...vendor,
    name: vendor.name || "Vendor",
    category: vendor.category || "Service",
    description: vendor.description || "No description available",
    rating: vendor.rating || 0,
    reviewCount: vendor.reviewCount || 0,
    priceRange: vendor.priceRange || { min: 0, max: 0 },
  }

  // Function to get the best available image
  const getImageUrl = () => {
    // Check for different image sources in order of preference
    if (safeVendor.coverImage && !safeVendor.coverImage.includes("placeholder")) {
      return safeVendor.coverImage
    }

    if (safeVendor.coverImageData && safeVendor.coverImageData.startsWith("data:image")) {
      return safeVendor.coverImageData
    }

    // If we have gallery images, use the first one
    if (
      safeVendor.galleryImages &&
      safeVendor.galleryImages.length > 0 &&
      !safeVendor.galleryImages[0].includes("placeholder")
    ) {
      return safeVendor.galleryImages[0]
    }

    if (
      safeVendor.galleryImagesData &&
      safeVendor.galleryImagesData.length > 0 &&
      safeVendor.galleryImagesData[0].startsWith("data:image")
    ) {
      return safeVendor.galleryImagesData[0]
    }

    // Fallback to placeholder
    return "/placeholder.svg?height=300&width=450"
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={getImageUrl() || "/placeholder.svg"}
          alt={safeVendor.name}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
        {showWishlistButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 rounded-full bg-white/80 hover:bg-white"
            onClick={() => onWishlistToggle?.(safeVendor.id)}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            <span className="sr-only">{isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</span>
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <Badge className="mb-2">{safeVendor.category}</Badge>
        <h3 className="line-clamp-1 text-lg font-semibold">{safeVendor.name}</h3>
        <div className="mt-1 flex items-center">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(safeVendor.rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-muted-foreground">({safeVendor.reviewCount} reviews)</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{safeVendor.description}</p>
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <span>
            ₹{safeVendor.priceRange.min.toLocaleString()} - ₹{safeVendor.priceRange.max.toLocaleString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/vendors/${safeVendor.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
