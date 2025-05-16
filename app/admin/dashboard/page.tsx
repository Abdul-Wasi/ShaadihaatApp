"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Filter, CheckCircle, Users, Clock, Award, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getAllVendors, approveVendor, rejectVendor, setVendorFeatured } from "@/lib/firebase/admin"
import { formatDate } from "@/lib/utils"
import type { Vendor } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AdminDashboardPage() {
  const { user, userRole, isLoading } = useAuth()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Log the current user role for debugging
    console.log("Current user role:", userRole)

    const fetchVendors = async () => {
      if (isLoading) return

      if (!user) {
        console.log("No user logged in")
        return
      }

      if (userRole !== "admin") {
        console.log("User is not an admin")
        return
      }

      setLoading(true)
      try {
        const vendorData = await getAllVendors()
        setVendors(vendorData)
        setFilteredVendors(vendorData)
      } catch (error: any) {
        console.error("Error fetching vendors:", error)
        setError(`Failed to load vendors: ${error.message}`)
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
  }, [user, userRole, isLoading, toast])

  useEffect(() => {
    // Apply filters
    let results = [...vendors]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(query) ||
          false ||
          vendor.description?.toLowerCase().includes(query) ||
          false,
      )
    }

    if (categoryFilter !== "all") {
      results = results.filter((vendor) => vendor.category === categoryFilter)
    }

    if (statusFilter === "approved") {
      results = results.filter((vendor) => vendor.isApproved)
    } else if (statusFilter === "pending") {
      results = results.filter((vendor) => !vendor.isApproved)
    } else if (statusFilter === "featured") {
      results = results.filter((vendor) => vendor.isFeatured)
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

  const handleToggleFeatured = async (vendorId: string, isFeatured: boolean) => {
    try {
      await setVendorFeatured(vendorId, isFeatured)

      // Update local state
      setVendors(vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, isFeatured } : vendor)))

      toast({
        title: isFeatured ? "Vendor featured" : "Vendor unfeatured",
        description: isFeatured
          ? "Vendor has been added to featured list"
          : "Vendor has been removed from featured list",
      })
    } catch (error) {
      console.error("Error updating featured status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update featured status",
      })
    }
  }

  // Get unique categories for filter
  const categories = ["all", ...new Set(vendors.map((vendor) => vendor.category))]

  // Count stats
  const totalVendors = vendors.length
  const approvedVendors = vendors.filter((vendor) => vendor.isApproved).length
  const pendingVendors = vendors.filter((vendor) => !vendor.isApproved).length
  const featuredVendors = vendors.filter((vendor) => vendor.isFeatured).length

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4">Loading authentication status...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to access the admin dashboard.</p>
        <Button className="mt-4" asChild>
          <Link href="/admin/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (userRole !== "admin") {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You need admin privileges to access this page.</p>
        <p className="text-sm text-muted-foreground mt-1">Current role: {userRole || "none"}</p>
        <Button className="mt-4" asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/admin/vendors">
            <CheckCircle className="mr-2 h-4 w-4" />
            Vendor Approval
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-blue-100 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{totalVendors}</h3>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{approvedVendors}</h3>
            <p className="text-sm text-muted-foreground">Approved Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-amber-100 p-3 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{pendingVendors}</h3>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mb-2 rounded-full bg-rose-100 p-3 text-rose-600">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">{featuredVendors}</h3>
            <p className="text-sm text-muted-foreground">Featured Vendors</p>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Vendors</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <VendorsTable
            vendors={filteredVendors}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            onToggleFeatured={handleToggleFeatured}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="pending">
          <VendorsTable
            vendors={vendors.filter((vendor) => !vendor.isApproved)}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            onToggleFeatured={handleToggleFeatured}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="featured">
          <VendorsTable
            vendors={vendors.filter((vendor) => vendor.isFeatured)}
            onApprove={handleApproveVendor}
            onReject={handleRejectVendor}
            onToggleFeatured={handleToggleFeatured}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface VendorsTableProps {
  vendors: Vendor[]
  onApprove: (vendorId: string) => void
  onReject: (vendorId: string) => void
  onToggleFeatured: (vendorId: string, isFeatured: boolean) => void
  loading: boolean
}

function VendorsTable({ vendors, onApprove, onReject, onToggleFeatured, loading }: VendorsTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted"></div>
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium">{vendor.name}</TableCell>
              <TableCell>{vendor.category}</TableCell>
              <TableCell>{vendor.city}</TableCell>
              <TableCell>{vendor.createdAt ? formatDate(vendor.createdAt.toDate()) : "N/A"}</TableCell>
              <TableCell>
                {vendor.isApproved ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {vendor.isFeatured ? (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700">
                    Featured
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/vendors/${vendor.id}`}>View</Link>
                  </Button>
                  {!vendor.isApproved ? (
                    <Button size="sm" variant="default" onClick={() => onApprove(vendor.id)}>
                      Approve
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => onReject(vendor.id)}>
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={vendor.isFeatured ? "outline" : "secondary"}
                    onClick={() => onToggleFeatured(vendor.id, !vendor.isFeatured)}
                  >
                    {vendor.isFeatured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
