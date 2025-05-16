"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VendorCard } from "@/components/vendor-card"
import { useToast } from "@/components/ui/use-toast"
import { getVendorsByCategory } from "@/lib/firebase/vendors"
import type { Vendor } from "@/types"
import type { DocumentSnapshot } from "firebase/firestore"

const categoryNames: Record<string, string> = {
  photography: "Photography",
  catering: "Catering",
  music: "Music & DJ",
  decor: "Decoration",
  makeup: "Makeup Artist",
  gifts: "Gifts & Favors",
  flowers: "Flowers",
  transport: "Transportation",
  venue: "Venue",
  cake: "Wedding Cake",
  mehendi: "Mehendi Artist",
}

export default function CategoryPage() {
  const { id } = useParams() as { id: string }
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const result = await getVendorsByCategory(id)
        setVendors(result.vendors)
        setLastDoc(result.lastDoc)
        setHasMore(result.vendors.length === 12) // Assuming 12 is the limit per page
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
  }, [id, toast])

  const loadMore = async () => {
    if (!lastDoc) return

    try {
      const result = await getVendorsByCategory(id, 12, lastDoc)
      setVendors([...vendors, ...result.vendors])
      setLastDoc(result.lastDoc)
      setHasMore(result.vendors.length === 12)
    } catch (error) {
      console.error("Error loading more vendors:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load more vendors",
      })
    }
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{categoryNames[id] || id}</h1>
      <p className="mb-8 text-muted-foreground">
        Browse through our selection of {categoryNames[id]?.toLowerCase() || id} vendors for your wedding.
      </p>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[300px] animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button onClick={loadMore} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No vendors found</h3>
          <p className="mt-2 text-muted-foreground">
            We couldn't find any {categoryNames[id]?.toLowerCase() || id} vendors at the moment.
          </p>
        </div>
      )}
    </div>
  )
}
