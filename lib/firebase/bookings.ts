import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Booking } from "@/types"

// Create a new booking
export async function createBooking(bookingData: Omit<Booking, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "pending",
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating booking:", error)
    throw error
  }
}

// Get bookings for a user
export async function getUserBookings(userId: string): Promise<Booking[]> {
  try {
    const bookingsRef = collection(db, "bookings")
    // Remove the orderBy clause to avoid requiring a composite index
    const q = query(bookingsRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)
    const bookings: Booking[] = []

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking)
    })

    // Sort the bookings by date client-side instead
    return bookings.sort((a, b) => {
      // Handle potential undefined dates
      if (!a.date || !b.date) return 0

      // Convert to Date objects if they're Firestore timestamps
      const dateA = a.date.toDate ? a.date.toDate() : a.date
      const dateB = b.date.toDate ? b.date.toDate() : b.date

      // Sort in descending order (newest first)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error("Error getting user bookings:", error)
    return []
  }
}

// Get bookings for a vendor - Modified to avoid index requirement
export async function getVendorBookings(vendorId: string): Promise<Booking[]> {
  try {
    const bookingsRef = collection(db, "bookings")
    // Remove the orderBy to avoid requiring a composite index
    const q = query(bookingsRef, where("vendorId", "==", vendorId))

    const querySnapshot = await getDocs(q)
    const bookings: Booking[] = []

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking)
    })

    // Sort the bookings by date client-side instead
    return bookings.sort((a, b) => {
      // Handle potential undefined dates
      if (!a.date || !b.date) return 0

      // Convert to Date objects if they're Firestore timestamps
      const dateA = a.date.toDate ? a.date.toDate() : a.date
      const dateB = b.date.toDate ? b.date.toDate() : b.date

      // Sort in descending order (newest first)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error("Error getting vendor bookings:", error)
    return []
  }
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string,
  status: "pending" | "confirmed" | "cancelled" | "completed",
): Promise<void> {
  try {
    await updateDoc(doc(db, "bookings", bookingId), {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating booking status:", error)
    throw error
  }
}

// Get booking by ID
export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const bookingDoc = await getDoc(doc(db, "bookings", id))

    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data(),
      } as Booking
    }

    return null
  } catch (error) {
    console.error("Error getting booking:", error)
    return null
  }
}
