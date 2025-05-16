import Link from "next/link"
import Image from "next/image"
import { Camera, Utensils, Music, Palette, Scissors, Gift, Flower, Car } from "lucide-react"
import { Card } from "@/components/ui/card"

const categories = [
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "catering",
    name: "Catering",
    icon: Utensils,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "music",
    name: "Music & DJ",
    icon: Music,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "decor",
    name: "Decoration",
    icon: Palette,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "makeup",
    name: "Makeup Artist",
    icon: Scissors,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "gifts",
    name: "Gifts & Favors",
    icon: Gift,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "flowers",
    name: "Flowers",
    icon: Flower,
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "transport",
    name: "Transportation",
    icon: Car,
    image: "/placeholder.svg?height=200&width=300",
  },
]

export function VendorCategories() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link key={category.id} href={`/vendors/category/${category.id}`}>
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <div className="relative aspect-[3/2] w-full overflow-hidden">
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                <category.icon className="mb-2 h-8 w-8" />
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
