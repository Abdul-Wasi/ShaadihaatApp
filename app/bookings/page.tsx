"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, FileText, CheckCircle, XCircle, ClockIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getUserBookings, updateBookingStatus } from "@/lib/firebase/bookings"
import { getVendorById } from "@/lib/firebase/vendors"
import { formatDate } from "@/lib/utils"
import type { Booking, Vendor } from "@/types"

type BookingWithVendor = Booking & { vendor: Vendor }

export default function BookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<BookingWithVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      setLoading(true)
      try {
        const userBookings = await getUserBookings(user.uid)

        // Fetch vendor details for each booking
        const bookingsWithVendors = await Promise.all(
          userBookings.map(async (booking) => {
            const vendor = await getVendorById(booking.vendorId)
            return {
              ...booking,
              vendor: vendor!,
            }
          }),
        )

        setBookings(bookingsWithVendors)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your bookings",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, toast])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "cancelled")

      // Update local state
      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)))

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully",
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel booking",
      })
    }
  }

  const filteredBookings = activeTab === "all" ? bookings : bookings.filter((booking) => booking.status === activeTab)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Confirmed</span>
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Render booking status timeline
  const renderStatusTimeline = (booking: BookingWithVendor) => {
    const statuses = [
      { key: "pending", label: "Pending" },
      { key: "confirmed", label: "Confirmed" },
      { key: "completed", label: "Completed" },
    ]

    // Find the current status index
    let currentStatusIndex = statuses.findIndex((s) => s.key === booking.status)
    if (booking.status === "cancelled") {
      currentStatusIndex = -1 // Special case for cancelled
    }

    return (
      <div className="mt-4 flex items-center justify-between">
        {booking.status === "cancelled" ? (
          <div className="w-full flex items-center justify-center">
            <Badge variant="destructive" className="px-3 py-1">
              Booking Cancelled
            </Badge>
          </div>
        ) : (
          <>
            {statuses.map((status, index) => (
              <div key={status.key} className="flex flex-col items-center">
                <div
                  className={`rounded-full h-6 w-6 flex items-center justify-center ${
                    index <= currentStatusIndex ? "bg-green-500 text-white" : "bg-gray-200"
                  }`}
                >
                  {index <= currentStatusIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-1">{status.label}</span>
                {index < statuses.length - 1 && (
                  <div className={`h-0.5 w-16 mt-3 ${index < currentStatusIndex ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view your bookings.</p>
        <Button className="mt-4" asChild>
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">My Bookings</h1>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted"></CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted"></div>
                      <div className="h-4 w-1/2 rounded bg-muted"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking) => (
                <Card key={booking.id}>
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={booking.vendor.coverImage || "/placeholder.svg?height=300&width=450"}
                      alt={booking.vendor.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-lg font-semibold text-white">{booking.vendor.name}</h3>
                      <p className="text-sm text-white/80">{booking.vendor.category}</p>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4 flex justify-between">
                      {getStatusBadge(booking.status)}
                      <Link
                        href={`/vendors/${booking.vendorId}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View Vendor
                      </Link>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(booking.date.toDate())}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.timeSlot.start} - {booking.timeSlot.end}
                        </span>
                      </div>
                      {booking.notes && (
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2 text-sm text-muted-foreground">{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Timeline */}
                    {renderStatusTimeline(booking)}
                  </CardContent>
                  <CardFooter className="border-t p-6">
                    {booking.status === "pending" && (
                      <Button variant="outline" className="w-full" onClick={() => handleCancelBooking(booking.id)}>
                        Cancel Booking
                      </Button>
                    )}
                    {booking.status === "confirmed" && (
                      <Button variant="outline" className="w-full" onClick={() => handleCancelBooking(booking.id)}>
                        Cancel Booking
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button asChild className="w-full">
                        <Link href={`/vendors/${booking.vendorId}?tab=reviews`}>Write a Review</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No bookings found</h3>
              <p className="mt-2 text-muted-foreground">
                You don't have any {activeTab !== "all" ? activeTab : ""} bookings yet
              </p>
              <Button className="mt-4" asChild>
                <Link href="/vendors">Browse Vendors</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
