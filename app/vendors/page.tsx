"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VendorCard } from "@/components/vendor-card"
import { searchVendors } from "@/lib/firebase/vendors"
import type { Vendor } from "@/types"

const categories = [
  { id: "all", name: "All Categories" },
  { id: "photography", name: "Photography" },
  { id: "catering", name: "Catering" },
  { id: "music", name: "Music & DJ" },
  { id: "decor", name: "Decoration" },
  { id: "makeup", name: "Makeup Artist" },
  { id: "gifts", name: "Gifts & Favors" },
  { id: "flowers", name: "Flowers" },
  { id: "transport", name: "Transportation" },
]

const locations = [
  { id: "all", name: "All Locations" },
  { id: "delhi", name: "Delhi" },
  { id: "mumbai", name: "Mumbai" },
  { id: "bangalore", name: "Bangalore" },
  { id: "chennai", name: "Chennai" },
  { id: "kolkata", name: "Kolkata" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "pune", name: "Pune" },
]

export default function VendorsPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "all"
  const initialLocation = searchParams.get("location") || "all"
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [location, setLocation] = useState(initialLocation)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const results = await searchVendors(
          searchQuery,
          category !== "all" ? category : undefined,
          location !== "all" ? location : undefined,
        )
        setVendors(results)
      } catch (error) {
        console.error("Error searching vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [searchQuery, category, location])

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Find Wedding Vendors</h1>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No vendors found</h3>
          <p className="mt-2 text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
