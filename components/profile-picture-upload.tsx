"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Camera, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { fileToBase64 } from "@/lib/local-image-storage"

interface ProfilePictureUploadProps {
  currentPhotoURL: string | null
  onPhotoChange: (photoURL: string | null) => Promise<void>
  size?: "sm" | "md" | "lg"
}

export function ProfilePictureUpload({ currentPhotoURL, onPhotoChange, size = "md" }: ProfilePictureUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewURL, setPreviewURL] = useState<string | null>(null)

  // Determine size classes
  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32",
    lg: "h-40 w-40",
  }[size]

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (1MB limit for base64 storage)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Profile picture must be less than 1MB",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        })
        return
      }

      try {
        setIsUploading(true)

        // Create a preview
        const objectURL = URL.createObjectURL(file)
        setPreviewURL(objectURL)

        // Convert to base64
        const base64Data = await fileToBase64(file)

        // Update the profile picture
        await onPhotoChange(base64Data)

        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })
      } catch (error) {
        console.error("Error uploading profile picture:", error)
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Failed to update profile picture. Please try again.",
        })
        // Reset preview on error
        setPreviewURL(null)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDeletePhoto = async () => {
    try {
      setIsUploading(true)
      await onPhotoChange(null)
      setPreviewURL(null)

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      })
    } catch (error) {
      console.error("Error removing profile picture:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove profile picture",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const imageUrl = previewURL || currentPhotoURL || "/placeholder.svg?height=200&width=200"

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses} overflow-hidden rounded-full`}>
        <Image src={imageUrl || "/placeholder.svg"} alt="Profile" fill className="object-cover" />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={buttonSizeClasses}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Change profile picture</span>
        </Button>

        {(currentPhotoURL || previewURL) && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className={buttonSizeClasses}
            onClick={handleDeletePhoto}
            disabled={isUploading}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove profile picture</span>
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
