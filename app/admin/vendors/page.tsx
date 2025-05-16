"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, X, AlertTriangle, Search, Filter, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getAllVendors, approveVendor, rejectVendor } from "@/lib/firebase/admin"
import { formatDate } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import type { Vendor } from "@/types"

export default function AdminVendorsPage() {
  return (
    <AuthGuard requiredRole="admin" redirectTo="/admin/login">
      <VendorApprovalContent />
    </AuthGuard>
  )
}

function VendorApprovalContent() {
  const { toast } = useToast()
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("pending")

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const vendorData = await getAllVendors()
        setVendors(vendorData)
        setFilteredVendors(vendorData.filter((v) => !v.isApproved))
      } catch (error) {
        console.error("Error fetching vendors:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vendors",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [toast])

  useEffect(() => {
    // Apply filters
    let results = [...vendors]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(query) ||
          vendor.category.toLowerCase().includes(query) ||
          vendor.city.toLowerCase().includes(query),
      )
    }

    if (categoryFilter !== "all") {
      results = results.filter((vendor) => vendor.category === categoryFilter)
    }

    if (statusFilter === "approved") {
      results = results.filter((vendor) => vendor.isApproved)
    } else if (statusFilter === "pending") {
      results = results.filter((vendor) => !vendor.isApproved)
    }

    setFilteredVendors(results)
  }, [vendors, searchQuery, categoryFilter, statusFilter])

  const handleApproveVendor = async (vendorId: string) => {
    try {
      await approveVendor(vendorId)

      // Update local state
      setVendors(vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, isApproved: true } : vendor)))

      toast({
        title: "Vendor approved",
        description: "Vendor has been approved successfully",
      })
    } catch (error) {
      console.error("Error approving vendor:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve vendor",
      })
    }
  }

  const handleRejectVendor = async (vendorId: string) => {
    try {
      await rejectVendor(vendorId)

      // Update local state
      setVendors(vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, isApproved: false } : vendor)))

      toast({
        title: "Vendor rejected",
        description: "Vendor has been rejected",
      })
    } catch (error) {
      console.error("Error rejecting vendor:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject vendor",
      })
    }
  }

  // Get unique categories for filter
  const categories = ["all", ...new Set(vendors.map((vendor) => vendor.category))]

  // Count stats
  const pendingVendors = vendors.filter((vendor) => !vendor.isApproved).length
  const approvedVendors = vendors.filter((vendor) => vendor.isApproved).length

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendor Approval</h1>
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card className={pendingVendors > 0 ? "border-amber-500" : ""}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-2xl font-bold">{pendingVendors}</h3>
              <p className="text-muted-foreground">Pending Approval</p>
            </div>
            {pendingVendors > 0 && <AlertTriangle className="h-12 w-12 text-amber-500" />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-2xl font-bold">{approvedVendors}</h3>
              <p className="text-muted-foreground">Approved Vendors</p>
            </div>
            <Check className="h-12 w-12 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <VendorsList
            vendors={vendors.filter((v) => !v.isApproved)}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="approved">
          <VendorsList
            vendors={vendors.filter((v) => v.isApproved)}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="all">
          <VendorsList
            vendors={filteredVendors}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface VendorsListProps {
  vendors: Vendor[]
  onApprove: (vendorId: string) => void
  onReject: (vendorId: string) => void
  loading: boolean
}

function VendorsList({ vendors, onApprove, onReject, loading }: VendorsListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-muted"></div>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted"></div>
                <div className="h-4 w-1/2 rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No vendors found</h3>
        <p className="mt-2 text-muted-foreground">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className={!vendor.isApproved ? "border-amber-200" : ""}>
          <div className="relative h-40 w-full overflow-hidden">
            <Image
              src={vendor.coverImage || "/placeholder.svg?height=300&width=450"}
              alt={vendor.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-lg font-semibold text-white">{vendor.name}</h3>
              <p className="text-sm text-white/80">{vendor.category}</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <Badge
                variant="outline"
                className={vendor.isApproved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
              >
                {vendor.isApproved ? "Approved" : "Pending Approval"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {vendor.createdAt ? formatDate(vendor.createdAt.toDate()) : "Recent"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="text-sm">{vendor.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Price Range:</span>
                <span className="text-sm">
                  ₹{vendor.priceRange.min.toLocaleString()} - ₹{vendor.priceRange.max.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contact:</span>
                <span className="text-sm">{vendor.phoneNumber}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 border-t p-6">
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href={`/vendors/${vendor.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
            {!vendor.isApproved ? (
              <Button size="sm" className="flex-1" onClick={() => onApprove(vendor.id)}>
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            ) : (
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onReject(vendor.id)}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
