import { collection, query, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Vendor } from "@/types"

// Get all vendors for admin - simplified to avoid index issues
export async function getAllVendors(): Promise<Vendor[]> {
  try {
    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef)

    const querySnapshot = await getDocs(q)
    const vendors: Vendor[] = []

    querySnapshot.forEach((doc) => {
      vendors.push({
        id: doc.id,
        ...doc.data(),
      } as Vendor)
    })

    // Sort by createdAt client-side
    return vendors.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error("Error getting all vendors:", error)
    return []
  }
}

// Approve a vendor
export async function approveVendor(vendorId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      isApproved: true,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error approving vendor:", error)
    throw error
  }
}

// Reject a vendor
export async function rejectVendor(vendorId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      isApproved: false,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error rejecting vendor:", error)
    throw error
  }
}

// Set vendor as featured or not
export async function setVendorFeatured(vendorId: string, isFeatured: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, "vendors", vendorId), {
      isFeatured,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating vendor featured status:", error)
    throw error
  }
}

// Get vendor by user ID - simplified to avoid potential index issues
export async function getVendorByUserId(userId: string): Promise<Vendor | null> {
  try {
    const vendorsRef = collection(db, "vendors")
    const q = query(vendorsRef)

    const querySnapshot = await getDocs(q)
    let vendor: Vendor | null = null

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.userId === userId) {
        vendor = {
          id: doc.id,
          ...data,
        } as Vendor
      }
    })

    return vendor
  } catch (error) {
    console.error("Error getting vendor by user ID:", error)
    return null
  }
}
