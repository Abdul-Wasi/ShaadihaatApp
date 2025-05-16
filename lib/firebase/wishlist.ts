import { getDoc, doc, setDoc, arrayUnion, arrayRemove, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { getVendorById } from "@/lib/firebase/vendors"
import type { Vendor } from "@/types"

// Add vendor to wishlist
export async function addToWishlist(userId: string, vendorId: string): Promise<void> {
  try {
    const wishlistRef = doc(db, "wishlists", userId)
    const wishlistDoc = await getDoc(wishlistRef)

    if (wishlistDoc.exists()) {
      // Update existing wishlist
      await updateDoc(wishlistRef, {
        vendorIds: arrayUnion(vendorId),
      })
    } else {
      // Create new wishlist
      await setDoc(wishlistRef, {
        userId,
        vendorIds: [vendorId],
      })
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    throw error
  }
}

// Remove vendor from wishlist
export async function removeFromWishlist(userId: string, vendorId: string): Promise<void> {
  try {
    const wishlistRef = doc(db, "wishlists", userId)

    await updateDoc(wishlistRef, {
      vendorIds: arrayRemove(vendorId),
    })
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    throw error
  }
}

// Check if vendor is in wishlist
export async function isInWishlist(userId: string, vendorId: string): Promise<boolean> {
  try {
    const wishlistRef = doc(db, "wishlists", userId)
    const wishlistDoc = await getDoc(wishlistRef)

    if (wishlistDoc.exists()) {
      const data = wishlistDoc.data()
      return data.vendorIds.includes(vendorId)
    }

    return false
  } catch (error) {
    console.error("Error checking wishlist:", error)
    return false
  }
}

// Get user's wishlist
export async function getWishlist(userId: string): Promise<Vendor[]> {
  try {
    const wishlistRef = doc(db, "wishlists", userId)
    const wishlistDoc = await getDoc(wishlistRef)

    if (wishlistDoc.exists()) {
      const data = wishlistDoc.data()
      const vendorIds = data.vendorIds || []

      // Get vendor details for each ID
      const vendors: Vendor[] = []

      for (const vendorId of vendorIds) {
        const vendor = await getVendorById(vendorId)
        if (vendor) {
          vendors.push(vendor)
        }
      }

      return vendors
    }

    return []
  } catch (error) {
    console.error("Error getting wishlist:", error)
    return []
  }
}
