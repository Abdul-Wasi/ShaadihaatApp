"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { formatDate, getInitials } from "@/lib/utils"
import { getVendorReviews } from "@/lib/firebase/reviews"
import type { Review } from "@/types"

interface ReviewListProps {
  vendorId: string
}

export function ReviewList({ vendorId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const reviewData = await getVendorReviews(vendorId)
        setReviews(reviewData)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [vendorId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="h-4 w-32 rounded bg-muted"></div>
            </div>
            <div className="h-4 w-20 rounded bg-muted"></div>
            <div className="h-16 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <div key={review.id}>
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={review.userPhotoURL || "/placeholder.svg"} alt={review.userDisplayName || "User"} />
              <AvatarFallback>{getInitials(review.userDisplayName || "User")}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold">{review.userDisplayName || "Anonymous"}</h4>
                <span className="text-sm text-muted-foreground">
                  {review.createdAt ? formatDate(review.createdAt.toDate()) : "Recent"}
                </span>
              </div>
              <div className="mt-1 flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < (review.rating || 0) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{review.text || "No comment"}</p>
            </div>
          </div>
          {index < reviews.length - 1 && <Separator className="my-6" />}
        </div>
      ))}
    </div>
  )
}
