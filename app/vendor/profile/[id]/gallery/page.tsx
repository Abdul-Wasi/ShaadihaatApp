"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Upload, X, ArrowRight, Loader2, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorById } from "@/lib/firebase/vendors"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Import the new local storage functions
import { uploadCoverImageToFirestore, uploadGalleryImagesToFirestore } from "@/lib/local-image-storage"

export default function VendorGalleryPage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<File[]>([])
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setIsLoading(true)
        const vendorData = await getVendorById(id)

        if (vendorData) {
          setVendor(vendorData)
          setExistingImages(vendorData.galleryImages || [])
          setExistingCoverImage(vendorData.coverImage || null)
        } else {
          toast({
            variant: "destructive",
            title: "Vendor not found",
            description: "Could not find vendor data",
          })
        }
      } catch (error) {
        console.error("Error loading vendor data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load existing images",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchVendorData()
    }
  }, [id, toast])

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Cover image must be less than 2MB",
        })
        return
      }

      setCoverImage(file)
      setCoverImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) => {
        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File too large",
            description: `${file.name} exceeds 2MB size limit and will be skipped`,
          })
          return false
        }
        return true
      })

      if (files.length === 0) return

      setGalleryImages((prev) => [...prev, ...files])

      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setGalleryImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const handleRemoveCoverImage = () => {
    setCoverImage(null)
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview)
      setCoverImagePreview(null)
    }
  }

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index))
    setGalleryImagePreviews((prev) => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  // Replace the handleUpload function with this new implementation
  const handleUpload = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to upload images",
      })
      return
    }

    if (!coverImage && galleryImages.length === 0) {
      toast({
        variant: "destructive",
        title: "No images selected",
        description: "Please select at least one image to upload",
      })
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let successCount = 0
      const totalUploads = (coverImage ? 1 : 0) + galleryImages.length

      // Upload cover image if selected
      if (coverImage) {
        try {
          console.log("Starting cover image upload using Firestore...")

          // Use the new Firestore method instead of Firebase Storage
          await uploadCoverImageToFirestore(id, coverImage, (progress) => {
            // If we have gallery images too, scale the progress accordingly
            const scaledProgress = galleryImages.length > 0 ? progress * (1 / totalUploads) : progress
            setUploadProgress(Math.round(scaledProgress))
          })

          console.log("Cover image uploaded successfully to Firestore")
          successCount++

          if (galleryImages.length === 0) {
            setUploadProgress(100)
          }
        } catch (error: any) {
          console.error("Error uploading cover image:", error)
          setError(`Cover image upload failed: ${error.message}`)
        }
      }

      // Upload gallery images if selected
      if (galleryImages.length > 0) {
        try {
          console.log("Starting gallery images upload using Firestore...")

          // Use the new Firestore method instead of Firebase Storage
          await uploadGalleryImagesToFirestore(id, galleryImages, (progress) => {
            // Scale progress based on whether we uploaded a cover image
            const baseProgress = coverImage ? (1 / totalUploads) * 100 : 0
            const scaledProgress = baseProgress + progress * ((totalUploads - 1) / totalUploads)
            setUploadProgress(Math.round(scaledProgress))
          })

          console.log(`Successfully uploaded gallery images to Firestore`)
          successCount += galleryImages.length
          setUploadProgress(100)
        } catch (error: any) {
          console.error("Error uploading gallery images:", error)

          if (successCount === 0) {
            // Only throw if nothing was uploaded successfully
            throw error
          } else {
            setError(`Some gallery images failed to upload: ${error.message}`)
          }
        }
      }

      // Show appropriate toast based on success/partial success
      if (successCount === totalUploads) {
        toast({
          title: "Upload successful",
          description: "All images were uploaded successfully",
        })
      } else if (successCount > 0) {
        toast({
          title: "Partial upload success",
          description: `${successCount} out of ${totalUploads} images were uploaded successfully`,
        })
      } else {
        throw new Error("No images were uploaded successfully")
      }

      // Navigate to vendor dashboard
      router.push("/vendor/dashboard")
    } catch (error: any) {
      console.error("Error uploading images:", error)
      setError(`Upload failed: ${error.message}`)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "There was an error uploading your images. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Images for {vendor?.name || "Your Profile"}</CardTitle>
          <CardDescription>
            Upload a cover image and gallery images for your vendor profile. These images will be displayed to potential
            customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Also update the file size limit warnings */}
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Images must be less than 1MB in size for direct storage. Please compress your images before uploading.
            </AlertDescription>
          </Alert>

          {/* Cover Image Upload */}
          <div>
            <h3 className="mb-2 text-lg font-medium">Cover Image</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              This will be the main image displayed on your profile. Choose a high-quality image that represents your
              business.
            </p>

            {coverImagePreview ? (
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
                <Image
                  src={coverImagePreview || "/placeholder.svg"}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={handleRemoveCoverImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : existingCoverImage ? (
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
                <Image
                  src={existingCoverImage || "/placeholder.svg"}
                  alt="Current cover image"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center text-sm text-white">
                  Current cover image
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2 bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div
                className="flex aspect-[2/1] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-muted-foreground/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload cover image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max 2MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
              onChange={handleCoverImageChange}
            />
          </div>

          {/* Gallery Images Upload */}
          <div>
            <h3 className="mb-2 text-lg font-medium">Gallery Images</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload additional images to showcase your work. You can upload up to 10 images at once.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {/* New images to upload */}
              {galleryImagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={`Gallery preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => handleRemoveGalleryImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Existing gallery images */}
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Existing gallery image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center text-xs text-white">
                    Existing
                  </div>
                </div>
              ))}

              {/* Add more images button */}
              {galleryImagePreviews.length + existingImages.length < 20 && (
                <div
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-muted-foreground/50"
                  onClick={() => document.getElementById("gallery-upload")?.click()}
                >
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-center font-medium">Add Image</p>
                  <input
                    id="gallery-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    onChange={handleGalleryImagesChange}
                    multiple
                  />
                </div>
              )}
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 w-full" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/vendor/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || (galleryImages.length === 0 && !coverImage)}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Upload Images
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
