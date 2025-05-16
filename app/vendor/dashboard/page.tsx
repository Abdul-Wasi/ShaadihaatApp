"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Calendar, Clock, FileText, User, Edit, Plus, Upload, Settings, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorByUserId } from "@/lib/firebase/vendors"
import { getVendorBookings, updateBookingStatus } from "@/lib/firebase/bookings"
import { formatDate } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import type { Vendor, Booking } from "@/types"

export default function VendorDashboardPage() {
  return (
    <AuthGuard requiredRole="vendor">
      <VendorDashboardContent />
    </AuthGuard>
  )
}

function VendorDashboardContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Get vendor profile
        const vendorData = await getVendorByUserId(user.uid)
        setVendor(vendorData)

        if (vendorData) {
          // Get vendor bookings
          const bookingsData = await getVendorBookings(vendorData.id)
          setBookings(bookingsData)
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your vendor dashboard",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [user, toast])

  const handleUpdateBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateBookingStatus(bookingId, status)

      // Update local state
      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)))

      toast({
        title: "Booking updated",
        description: `Booking status has been updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update booking status",
      })
    }
  }

  // Filter bookings by status
  const pendingBookings = bookings.filter((booking) => booking.status === "pending")
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed")
  const completedBookings = bookings.filter((booking) => booking.status === "completed")
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled")

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-8 w-1/4 animate-pulse rounded bg-muted"></div>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
        <div className="mt-8 h-[400px] animate-pulse rounded-lg bg-muted"></div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Vendor Dashboard</h1>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              You need to set up your vendor profile before you can start receiving bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create your vendor profile with details about your services, pricing, and availability.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/vendor/profile/create">Create Vendor Profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Vendor Dashboard</h1>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-blue-100 p-3 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{pendingBookings.length}</h3>
            <p className="text-sm text-muted-foreground">Pending Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-green-100 p-3 text-green-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{confirmedBookings.length}</h3>
            <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-amber-100 p-3 text-amber-600">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{vendor.reviewCount || 0}</h3>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-rose-100 p-3 text-rose-600">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{vendor.rating?.toFixed(1) || "N/A"}</h3>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/vendor/profile/edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vendor/services">
            <Plus className="mr-2 h-4 w-4" />
            Manage Services
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vendor/gallery">
            <Upload className="mr-2 h-4 w-4" />
            Upload Photos
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vendor/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(booking.date.toDate())}</span>
                              <Badge
                                variant="outline"
                                className={
                                  booking.status === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : booking.status === "confirmed"
                                      ? "bg-green-50 text-green-700"
                                      : booking.status === "completed"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-red-50 text-red-700"
                                }
                              >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {booking.timeSlot.start} - {booking.timeSlot.end}
                              </span>
                            </div>
                            {booking.notes && (
                              <div className="mt-1 flex items-start gap-2">
                                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <span className="line-clamp-1 text-sm text-muted-foreground">{booking.notes}</span>
                              </div>
                            )}
                          </div>
                          {booking.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}>
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, "cancelled")}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button size="sm" onClick={() => handleUpdateBookingStatus(booking.id, "completed")}>
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No bookings yet</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("bookings")}>
                    View All Bookings
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                    <Image
                      src={vendor.coverImage || vendor.coverImageData || "/placeholder.svg?height=200&width=200"}
                      alt={vendor.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-center text-xl font-semibold">{vendor.name}</h3>
                  <p className="text-center text-muted-foreground">{vendor.category}</p>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant="outline"
                        className={vendor.isApproved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
                      >
                        {vendor.isApproved ? "Approved" : "Pending Approval"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Featured:</span>
                      <span>{vendor.isFeatured ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{vendor.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Range:</span>
                      <span>
                        ₹{vendor.priceRange.min.toLocaleString()} - ₹{vendor.priceRange.max.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/vendors/${vendor.id}`}>View Public Profile</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsList bookings={bookings} onUpdateStatus={handleUpdateBookingStatus} />
        </TabsContent>

        <TabsContent value="pending">
          <BookingsList
            bookings={pendingBookings}
            onUpdateStatus={handleUpdateBookingStatus}
            emptyMessage="No pending bookings"
          />
        </TabsContent>

        <TabsContent value="confirmed">
          <BookingsList
            bookings={confirmedBookings}
            onUpdateStatus={handleUpdateBookingStatus}
            emptyMessage="No confirmed bookings"
          />
        </TabsContent>

        <TabsContent value="completed">
          <BookingsList
            bookings={completedBookings}
            onUpdateStatus={handleUpdateBookingStatus}
            emptyMessage="No completed bookings"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface BookingsListProps {
  bookings: Booking[]
  onUpdateStatus: (bookingId: string, status: "confirmed" | "cancelled" | "completed") => void
  emptyMessage?: string
}

function BookingsList({ bookings, onUpdateStatus, emptyMessage = "No bookings found" }: BookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">{emptyMessage}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : booking.status === "confirmed"
                          ? "bg-green-50 text-green-700"
                          : booking.status === "completed"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                    }
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">Booking for {formatDate(booking.date.toDate())}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.timeSlot.start} - {booking.timeSlot.end}
                  </span>
                </div>
                {booking.notes && (
                  <div className="mt-2">
                    <p className="font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{booking.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {booking.status === "pending" && (
                  <>
                    <Button onClick={() => onUpdateStatus(booking.id, "confirmed")}>Confirm</Button>
                    <Button variant="outline" onClick={() => onUpdateStatus(booking.id, "cancelled")}>
                      Decline
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button onClick={() => onUpdateStatus(booking.id, "completed")}>Mark Completed</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
