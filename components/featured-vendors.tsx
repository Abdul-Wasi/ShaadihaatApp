"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getFeaturedVendors } from "@/lib/firebase/vendors"
import type { Vendor } from "@/types"

export function FeaturedVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const featuredVendors = await getFeaturedVendors()
        setVendors(featuredVendors)
        setError(null)
      } catch (error) {
        console.error("Error loading featured vendors:", error)
        setError("Failed to load featured vendors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadVendors()
  }, [])

  // Function to get the best available image for a vendor
  const getImageUrl = (vendor: Vendor) => {
    // Check for different image sources in order of preference
    if (vendor.coverImage && !vendor.coverImage.includes("placeholder")) {
      return vendor.coverImage
    }

    if (vendor.coverImageData && vendor.coverImageData.startsWith("data:image")) {
      return vendor.coverImageData
    }

    // If we have gallery images, use the first one
    if (vendor.galleryImages && vendor.galleryImages.length > 0 && !vendor.galleryImages[0].includes("placeholder")) {
      return vendor.galleryImages[0]
    }

    if (
      vendor.galleryImagesData &&
      vendor.galleryImagesData.length > 0 &&
      vendor.galleryImagesData[0].startsWith("data:image")
    ) {
      return vendor.galleryImagesData[0]
    }

    // Fallback to placeholder
    return "/placeholder.svg?height=300&width=450"
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-[3/2] w-full animate-pulse bg-muted"></div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No featured vendors available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="overflow-hidden">
          <div className="relative aspect-[3/2] w-full overflow-hidden">
            <Image
              src={getImageUrl(vendor) || "/placeholder.svg"}
              alt={vendor.name || "Vendor"}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardContent className="p-4">
            <Badge className="mb-2">{vendor.category || "Vendor"}</Badge>
            <h3 className="line-clamp-1 text-lg font-semibold">{vendor.name || "Vendor"}</h3>
            <div className="mt-1 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(vendor.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {vendor.description || "No description available"}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button asChild className="w-full">
              <Link href={`/vendors/${vendor.id}`}>View Profile</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
