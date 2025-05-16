// This is a temporary solution to bypass Firebase Storage issues
// It stores image data in Firestore directly (not recommended for production)

import { doc, updateDoc, getDoc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Convert file to base64 string
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Upload cover image by storing base64 data directly in Firestore
export async function uploadCoverImageToFirestore(
  vendorId: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // Check file size - strict 1MB limit for Firestore
    if (file.size > 1 * 1024 * 1024) {
      throw new Error("File too large. Maximum size for direct storage is 1MB")
    }

    // Start progress
    if (onProgress) onProgress(10)

    // Convert to base64
    const base64Data = await fileToBase64(file)
    if (onProgress) onProgress(50)

    // Get vendor document
    const vendorRef = doc(db, "vendors", vendorId)
    const vendorDoc = await getDoc(vendorRef)

    if (!vendorDoc.exists()) {
      throw new Error("Vendor not found")
    }

    // Update vendor with base64 image data
    await updateDoc(vendorRef, {
      coverImageData: base64Data,
      // Don't use placeholder URL, use the actual base64 data for coverImage too
      coverImage: base64Data,
      updatedAt: serverTimestamp(),
    })

    if (onProgress) onProgress(100)

    // Return the base64 data as the URL
    return base64Data
  } catch (error) {
    console.error("Error uploading cover image to Firestore:", error)
    throw error
  }
}

// Upload gallery images by storing base64 data directly in Firestore
export async function uploadGalleryImagesToFirestore(
  vendorId: string,
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  try {
    // Check file sizes - strict 1MB limit for Firestore
    const validFiles = files.filter((file) => {
      if (file.size > 1 * 1024 * 1024) {
        console.warn(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      throw new Error("No valid files to upload. All files exceed the 1MB size limit.")
    }

    // Start progress
    if (onProgress) onProgress(5)

    // Get vendor document
    const vendorRef = doc(db, "vendors", vendorId)
    const vendorDoc = await getDoc(vendorRef)

    if (!vendorDoc.exists()) {
      throw new Error("Vendor not found")
    }

    // Convert all files to base64
    const imageDataArray: string[] = []
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const base64Data = await fileToBase64(file)
      imageDataArray.push(base64Data)

      // Update progress
      if (onProgress) {
        const progress = 5 + Math.round(((i + 1) / validFiles.length) * 85)
        onProgress(progress)
      }
    }

    // Update vendor with gallery images data
    await updateDoc(vendorRef, {
      galleryImagesData: arrayUnion(...imageDataArray),
      // Use the actual base64 data for galleryImages too
      galleryImages: arrayUnion(...imageDataArray),
      updatedAt: serverTimestamp(),
    })

    if (onProgress) onProgress(100)

    // Return the base64 data as URLs
    return imageDataArray
  } catch (error) {
    console.error("Error uploading gallery images to Firestore:", error)
    throw error
  }
}
