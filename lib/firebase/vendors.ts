import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  limit,
  type DocumentSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db, getIsFirebaseInitialized } from "@/lib/firebase/config"
import { uploadWithFallback } from "@/lib/upload-utils"
import type { Vendor } from "@/types"

// Check if Firebase is initialized
const checkFirebaseInitialized = () => {
  if (!getIsFirebaseInitialized()) {
    console.error("Firebase is not initialized")
    throw new Error("Firebase is not initialized")
  }
  return true
}

// Get featured vendors - modified to avoid composite index requirement
export async function getFeaturedVendors(limitCount = 8): Promise<Vendor[]> {
  try {
    if (!getIsFirebaseInitialized()) {
      console.warn("Firebase not initialized, returning empty vendors list")
      return []
    }

    // First, get approved vendors
    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef, where("isApproved", "==", true))

    const querySnapshot = await getDocs(q)
    let vendors: Vendor[] = []

    querySnapshot.forEach((doc) => {
      vendors.push({
        id: doc.id,
        ...doc.data(),
      } as Vendor)
    })

    // Then filter for featured vendors and sort by rating client-side
    vendors = vendors
      .filter((vendor) => vendor.isFeatured)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limitCount)

    return vendors
  } catch (error) {
    console.error("Error getting featured vendors:", error)
    return []
  }
}

// Get vendors by category - modified to avoid index issues
export async function getVendorsByCategory(
  category: string,
  limitCount = 12,
  lastDoc?: DocumentSnapshot,
): Promise<{ vendors: Vendor[]; lastDoc: DocumentSnapshot | null }> {
  try {
    if (!getIsFirebaseInitialized()) {
      return { vendors: [], lastDoc: null }
    }

    // Get all vendors first (not efficient but avoids index issues)
    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef, where("isApproved", "==", true))

    const querySnapshot = await getDocs(q)
    const vendors: Vendor[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as Vendor
      if (data.category === category) {
        vendors.push({
          id: doc.id,
          ...data,
        } as Vendor)
      }
    })

    // Sort by createdAt manually
    vendors.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    // Handle pagination manually
    let startIndex = 0
    if (lastDoc) {
      const lastDocId = lastDoc.id
      const lastDocIndex = vendors.findIndex((v) => v.id === lastDocId)
      if (lastDocIndex !== -1) {
        startIndex = lastDocIndex + 1
      }
    }

    const paginatedVendors = vendors.slice(startIndex, startIndex + limitCount)
    const newLastDoc =
      paginatedVendors.length > 0 ? doc(db, "vendors", paginatedVendors[paginatedVendors.length - 1].id) : null

    return {
      vendors: paginatedVendors,
      lastDoc: newLastDoc,
    }
  } catch (error) {
    console.error("Error getting vendors by category:", error)
    return { vendors: [], lastDoc: null }
  }
}

// Get vendor by ID
export async function getVendorById(id: string): Promise<Vendor | null> {
  try {
    if (!getIsFirebaseInitialized()) {
      return null
    }

    const vendorDoc = await getDoc(doc(db, "vendors", id))

    if (vendorDoc.exists()) {
      return {
        id: vendorDoc.id,
        ...vendorDoc.data(),
      } as Vendor
    }

    return null
  } catch (error) {
    console.error("Error getting vendor:", error)
    return null
  }
}

// Get vendor by user ID
export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  try {
    if (!getIsFirebaseInitialized()) {
      return null
    }

    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef, where("userId", "==", userId), limit(1))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const vendorDoc = querySnapshot.docs[0]
    return {
      id: vendorDoc.id,
      ...vendorDoc.data(),
    } as Vendor
  } catch (error) {
    console.error("Error getting vendor by user ID:", error)
    return null
  }
}

// Create vendor profile - fixed to handle undefined values
export async function createVendorProfile(vendorData: Omit<Vendor, "id">): Promise<string> {
  try {
    checkFirebaseInitialized()

    // Create a clean object without undefined values
    const cleanData: Record<string, any> = {}

    // Copy all properties except undefined values
    Object.entries(vendorData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value
      }
    })

    // Add required fields with default values
    const vendorToSave = {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isApproved: false,
      isFeatured: false,
      rating: 0,
      reviewCount: 0,
      galleryImages: [], // Initialize with empty array
    }

    const docRef = await addDoc(collection(db, "vendors"), vendorToSave)
    return docRef.id
  } catch (error) {
    console.error("Error creating vendor profile:", error)
    throw error
  }
}

// Update vendor profile - fixed to handle undefined values
export async function updateVendorProfile(id: string, vendorData: Partial<Vendor>): Promise<void> {
  try {
    checkFirebaseInitialized()

    // Create a clean object without undefined values
    const cleanData: Record<string, any> = {}

    // Copy all properties except undefined values
    Object.entries(vendorData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value
      }
    })

    await updateDoc(doc(db, "vendors", id), {
      ...cleanData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating vendor profile:", error)
    throw error
  }
}

// COMPLETELY REVISED: Upload vendor image with fallback mechanism
export async function uploadVendorImage(
  vendorId: string,
  file: File,
  type: "cover" | "gallery",
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    checkFirebaseInitialized()

    // Validate file
    if (!file) {
      throw new Error("No file provided")
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds 2MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`)
    }

    // Generate a unique path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_").substring(0, 30) // Sanitize filename

    const path =
      type === "cover"
        ? `vendors/${vendorId}/cover_${timestamp}_${randomId}_${fileName}`
        : `vendors/${vendorId}/gallery/${timestamp}_${randomId}_${fileName}`

    console.log(`Uploading ${type} image to path: ${path}`)

    // Use our multi-strategy upload function
    const downloadURL = await uploadWithFallback(path, file, onProgress)
    console.log(`Upload successful. Download URL: ${downloadURL}`)

    // Update vendor document based on image type
    if (type === "cover") {
      await updateDoc(doc(db, "vendors", vendorId), {
        coverImage: downloadURL,
        updatedAt: serverTimestamp(),
      })
      console.log("Vendor document updated with cover image URL")
    } else {
      // For gallery images, append to the existing array
      const vendor = await getVendorById(vendorId)
      const currentGalleryImages = vendor?.galleryImages || []

      await updateDoc(doc(db, "vendors", vendorId), {
        galleryImages: [...currentGalleryImages, downloadURL],
        updatedAt: serverTimestamp(),
      })
      console.log("Vendor document updated with new gallery image URL")
    }

    return downloadURL
  } catch (error) {
    console.error("Error in uploadVendorImage:", error)
    throw error
  }
}

// COMPLETELY REVISED: Batch upload gallery images with fallback mechanism
export async function batchUploadGalleryImages(
  vendorId: string,
  files: File[],
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  try {
    checkFirebaseInitialized()

    if (!files || files.length === 0) {
      console.warn("No files provided for batch upload")
      return []
    }

    console.log(`Starting batch upload of ${files.length} images for vendor ${vendorId}`)

    // Validate all files first
    const validFiles: File[] = []
    const maxSize = 2 * 1024 * 1024 // 2MB

    for (const file of files) {
      if (file.size > maxSize) {
        console.warn(`Skipping file ${file.name}: exceeds 2MB size limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        continue
      }

      if (!file.type.startsWith("image/")) {
        console.warn(`Skipping file ${file.name}: not an image (${file.type})`)
        continue
      }

      validFiles.push(file)
    }

    console.log(`${validFiles.length} valid files to upload`)

    if (validFiles.length === 0) {
      return []
    }

    // Get current gallery images
    const vendor = await getVendorById(vendorId)
    const currentGalleryImages = vendor?.galleryImages || []

    // Upload files sequentially to avoid overwhelming Firebase
    const uploadedUrls: string[] = []
    let completedUploads = 0

    for (const file of validFiles) {
      try {
        // Generate a unique path
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 10)
        const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_").substring(0, 30) // Sanitize filename
        const path = `vendors/${vendorId}/gallery/${timestamp}_${randomId}_${fileName}`

        console.log(`Uploading file ${file.name} to ${path}`)

        // Use our multi-strategy upload function with individual file progress
        const fileProgressHandler = (fileProgress: number) => {
          if (onProgress) {
            // Calculate overall progress
            const overallProgress = ((completedUploads + fileProgress / 100) / validFiles.length) * 100
            onProgress(Math.min(Math.round(overallProgress), 99))
          }
        }

        const downloadURL = await uploadWithFallback(path, file, fileProgressHandler)
        uploadedUrls.push(downloadURL)
        console.log(`Successfully uploaded ${file.name}, URL: ${downloadURL}`)

        completedUploads++
        if (onProgress) {
          onProgress(Math.round((completedUploads / validFiles.length) * 100))
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        // Continue with next file even if this one fails
        completedUploads++
        if (onProgress) {
          onProgress(Math.round((completedUploads / validFiles.length) * 100))
        }
      }
    }

    // Update vendor document with all successful uploads
    if (uploadedUrls.length > 0) {
      try {
        await updateDoc(doc(db, "vendors", vendorId), {
          galleryImages: [...currentGalleryImages, ...uploadedUrls],
          updatedAt: serverTimestamp(),
        })
        console.log(`Updated vendor document with ${uploadedUrls.length} new gallery images`)
      } catch (error) {
        console.error("Error updating vendor document with gallery images:", error)
        // Still return the uploaded URLs even if document update fails
      }
    }

    return uploadedUrls
  } catch (error) {
    console.error("Error in batchUploadGalleryImages:", error)
    throw error
  }
}

// For backward compatibility
export async function uploadMultipleImages(vendorId: string, files: File[]): Promise<string[]> {
  return batchUploadGalleryImages(vendorId, files)
}

// Search vendors - fixed to avoid query is not a function error
export async function searchVendors(
  searchQuery: string,
  category?: string,
  location?: string,
  limitCount = 12,
): Promise<Vendor[]> {
  try {
    if (!getIsFirebaseInitialized()) {
      return []
    }

    // This is a simplified search implementation
    // For production, consider using Algolia or Firebase Extensions for search
    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef, where("isApproved", "==", true))

    const querySnapshot = await getDocs(q)
    let vendors: Vendor[] = []

    querySnapshot.forEach((doc) => {
      vendors.push({
        id: doc.id,
        ...doc.data(),
      } as Vendor)
    })

    // Client-side filtering (not efficient for large datasets)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      vendors = vendors.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(searchLower) ||
          false ||
          vendor.description?.toLowerCase().includes(searchLower) ||
          false,
      )
    }

    if (category) {
      vendors = vendors.filter((vendor) => vendor.category === category)
    }

    if (location) {
      vendors = vendors.filter((vendor) => vendor.city === location)
    }

    return vendors.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching vendors:", error)
    return []
  }
}
