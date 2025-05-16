import { collection, query, where, getDocs, doc, orderBy, serverTimestamp, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Review } from "@/types"

// Create a new review
export async function createReview(reviewData: Omit<Review, "id">): Promise<string> {
  try {
    // Use a transaction to update the vendor's rating when a review is added
    const reviewId = await runTransaction(db, async (transaction) => {
      // Add the review
      const reviewRef = doc(collection(db, "reviews"))
      transaction.set(reviewRef, {
        ...reviewData,
        createdAt: serverTimestamp(),
      })

      // Get the vendor document
      const vendorRef = doc(db, "vendors", reviewData.vendorId)
      const vendorDoc = await transaction.get(vendorRef)

      if (!vendorDoc.exists()) {
        throw new Error("Vendor does not exist!")
      }

      // Calculate new rating
      const vendorData = vendorDoc.data()
      const currentRating = vendorData.rating || 0
      const reviewCount = vendorData.reviewCount || 0

      const newReviewCount = reviewCount + 1
      const newRating = (currentRating * reviewCount + reviewData.rating) / newReviewCount

      // Update vendor with new rating
      transaction.update(vendorRef, {
        rating: newRating,
        reviewCount: newReviewCount,
        updatedAt: serverTimestamp(),
      })

      return reviewRef.id
    })

    return reviewId
  } catch (error) {
    console.error("Error creating review:", error)
    throw error
  }
}

// Get reviews for a vendor
export async function getVendorReviews(vendorId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, where("vendorId", "==", vendorId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const reviews: Review[] = []

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      } as Review)
    })

    return reviews
  } catch (error) {
    console.error("Error getting vendor reviews:", error)
    return []
  }
}

// Get reviews by a user
export async function getUserReviews(userId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const reviews: Review[] = []

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data(),
      } as Review)
    })

    return reviews
  } catch (error) {
    console.error("Error getting user reviews:", error)
    return []
  }
}

// Delete a review
export async function deleteReview(reviewId: string, vendorId: string): Promise<void> {
  try {
    // Use a transaction to update the vendor's rating when a review is deleted
    await runTransaction(db, async (transaction) => {
      // Get the review to be deleted
      const reviewRef = doc(db, "reviews", reviewId)
      const reviewDoc = await transaction.get(reviewRef)

      if (!reviewDoc.exists()) {
        throw new Error("Review does not exist!")
      }

      const reviewData = reviewDoc.data()

      // Get the vendor document
      const vendorRef = doc(db, "vendors", vendorId)
      const vendorDoc = await transaction.get(vendorRef)

      if (!vendorDoc.exists()) {
        throw new Error("Vendor does not exist!")
      }

      // Calculate new rating
      const vendorData = vendorDoc.data()
      const currentRating = vendorData.rating || 0
      const reviewCount = vendorData.reviewCount || 0

      if (reviewCount <= 1) {
        // If this is the only review, reset rating to 0
        transaction.update(vendorRef, {
          rating: 0,
          reviewCount: 0,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Calculate new average without this review
        const newReviewCount = reviewCount - 1
        const newRating = (currentRating * reviewCount - reviewData.rating) / newReviewCount

        transaction.update(vendorRef, {
          rating: newRating,
          reviewCount: newReviewCount,
          updatedAt: serverTimestamp(),
        })
      }

      // Delete the review
      transaction.delete(reviewRef)
    })
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}
