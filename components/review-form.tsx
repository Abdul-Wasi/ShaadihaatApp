"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createReview } from "@/lib/firebase/reviews"

const formSchema = z.object({
  rating: z.number().min(1, { message: "Please select a rating" }).max(5),
  text: z.string().min(10, { message: "Review must be at least 10 characters" }),
})

interface ReviewFormProps {
  vendorId: string
}

export function ReviewForm({ vendorId }: ReviewFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      text: "",
    },
  })

  const watchRating = form.watch("rating")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to submit a review",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createReview({
        userId: user.uid,
        vendorId,
        rating: values.rating,
        text: values.text,
        userDisplayName: user.displayName || "Anonymous",
        userPhotoURL: user.photoURL || "",
      })

      toast({
        title: "Review submitted",
        description: "Thank you for sharing your experience!",
      })

      form.reset({
        rating: 0,
        text: "",
      })
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your review. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoveredStar || field.value)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience with this vendor..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </Form>
  )
}
