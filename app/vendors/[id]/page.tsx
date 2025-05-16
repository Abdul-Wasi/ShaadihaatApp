"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Calendar, MapPin, Phone, Mail, Globe, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BookingForm } from "@/components/booking-form"
import { ReviewList } from "@/components/review-list"
import { ReviewForm } from "@/components/review-form"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorById } from "@/lib/firebase/vendors"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/firebase/wishlist"
import type { Vendor } from "@/types"

export default function VendorDetailPage() {
  const { id } = useParams() as { id: string }
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [wishlisted, setWishlisted] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true)
      try {
        const vendorData = await getVendorById(id)
        setVendor(vendorData)

        if (user) {
          const inWishlist = await isInWishlist(user.uid, id)
          setWishlisted(inWishlist)
        }
      } catch (error) {
        console.error("Error fetching vendor:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vendor details",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [id, user, toast])

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add vendors to your wishlist",
        variant: "destructive",
      })
      return
    }

    try {
      if (wishlisted) {
        await removeFromWishlist(user.uid, id)
        setWishlisted(false)
        toast({
          title: "Removed from wishlist",
          description: "Vendor has been removed from your wishlist",
        })
      } else {
        await addToWishlist(user.uid, id)
        setWishlisted(true)
        toast({
          title: "Added to wishlist",
          description: "Vendor has been added to your wishlist",
        })
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update wishlist",
      })
    }
  }

  // Function to get the best available cover image
  const getCoverImageUrl = () => {
    if (!vendor) return "/placeholder.svg?height=600&width=1200"

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
    return "/placeholder.svg?height=600&width=1200"
  }

  // Function to get all gallery images
  const getGalleryImages = () => {
    if (!vendor) return []

    const images: string[] = []

    // Add valid gallery images
    if (vendor.galleryImages && vendor.galleryImages.length > 0) {
      vendor.galleryImages.forEach((img) => {
        if (img && !img.includes("placeholder") && !images.includes(img)) {
          images.push(img)
        }
      })
    }

    // Add valid gallery image data
    if (vendor.galleryImagesData && vendor.galleryImagesData.length > 0) {
      vendor.galleryImagesData.forEach((img) => {
        if (img && img.startsWith("data:image") && !images.includes(img)) {
          images.push(img)
        }
      })
    }

    // If we have a cover image and it's not already included, add it too
    const coverImage = getCoverImageUrl()
    if (coverImage && !coverImage.includes("placeholder") && !images.includes(coverImage)) {
      images.push(coverImage)
    }

    return images
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted"></div>
        <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-muted"></div>
        <div className="mt-4 h-4 w-1/4 animate-pulse rounded bg-muted"></div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="col-span-2 h-[400px] animate-pulse rounded-lg bg-muted"></div>
          <div className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Vendor Not Found</h1>
        <p className="mt-2 text-muted-foreground">The vendor you are looking for does not exist or has been removed.</p>
        <Button className="mt-4" asChild>
          <a href="/vendors">Browse Vendors</a>
        </Button>
      </div>
    )
  }

  const galleryImages = getGalleryImages()

  return (
    <div className="container py-8">
      {/* Cover Image */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
        <Image
          src={getCoverImageUrl() || "/placeholder.svg"}
          alt={vendor.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Vendor Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-2">{vendor.category}</Badge>
          <h1 className="text-3xl font-bold">{vendor.name}</h1>
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(vendor.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
            <span className="ml-4 flex items-center text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              {vendor.city}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {user && userRole === "user" && (
            <Button variant="outline" className="flex items-center gap-1" onClick={handleWishlistToggle}>
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              {wishlisted ? "Wishlisted" : "Add to Wishlist"}
            </Button>
          )}
          {user && userRole === "user" && <Button onClick={() => setShowBookingForm(true)}>Book Now</Button>}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">About {vendor.name}</h2>
              <p className="whitespace-pre-line text-muted-foreground">{vendor.description}</p>
            </TabsContent>
            <TabsContent value="gallery" className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">Gallery</h2>
              {galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No gallery images available</p>
              )}
            </TabsContent>
            <TabsContent value="services" className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">Services & Packages</h2>
              {vendor.services && vendor.services.length > 0 ? (
                <div className="grid gap-4">
                  {vendor.services.map((service, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          </div>
                          <div className="text-right font-semibold">₹{service.price.toLocaleString()}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No services or packages available</p>
              )}
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-semibold">Customer Reviews</h2>
                <ReviewList vendorId={vendor.id} />
                {user && userRole === "user" && (
                  <>
                    <Separator />
                    <h3 className="text-lg font-semibold">Write a Review</h3>
                    <ReviewForm vendorId={vendor.id} />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{vendor.address}</p>
                    <p className="text-sm text-muted-foreground">{vendor.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{vendor.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{vendor.email}</p>
                  </div>
                </div>
                {vendor.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {vendor.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <h2 className="mb-4 text-xl font-semibold">Price Range</h2>
              <p className="text-lg font-medium">
                ₹{vendor.priceRange.min.toLocaleString()} - ₹{vendor.priceRange.max.toLocaleString()}
              </p>

              {vendor.availability && vendor.availability.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Availability</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Check the calendar for available dates</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Dialog */}
      {showBookingForm && vendor && <BookingForm vendor={vendor} onClose={() => setShowBookingForm(false)} />}
    </div>
  )
}
