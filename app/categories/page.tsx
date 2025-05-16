import Link from "next/link"
import Image from "next/image"
import { Camera, Utensils, Music, Palette, Scissors, Gift, Flower, Car, Home, Cake } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    image: "/placeholder.svg?height=300&width=400",
    description: "Professional photographers to capture your special moments",
  },
  {
    id: "catering",
    name: "Catering",
    icon: Utensils,
    image: "/placeholder.svg?height=300&width=400",
    description: "Delicious food and beverage services for your wedding",
  },
  {
    id: "music",
    name: "Music & DJ",
    icon: Music,
    image: "/placeholder.svg?height=300&width=400",
    description: "Entertainment services to keep your guests dancing all night",
  },
  {
    id: "decor",
    name: "Decoration",
    icon: Palette,
    image: "/placeholder.svg?height=300&width=400",
    description: "Beautiful decorations to transform your venue",
  },
  {
    id: "makeup",
    name: "Makeup Artist",
    icon: Scissors,
    image: "/placeholder.svg?height=300&width=400",
    description: "Professional makeup artists for the bride and wedding party",
  },
  {
    id: "gifts",
    name: "Gifts & Favors",
    icon: Gift,
    image: "/placeholder.svg?height=300&width=400",
    description: "Unique gifts and favors for your guests",
  },
  {
    id: "flowers",
    name: "Flowers",
    icon: Flower,
    image: "/placeholder.svg?height=300&width=400",
    description: "Beautiful floral arrangements for your wedding",
  },
  {
    id: "transport",
    name: "Transportation",
    icon: Car,
    image: "/placeholder.svg?height=300&width=400",
    description: "Elegant transportation services for the wedding day",
  },
  {
    id: "venue",
    name: "Venue",
    icon: Home,
    image: "/placeholder.svg?height=300&width=400",
    description: "Beautiful locations to host your wedding ceremony and reception",
  },
  {
    id: "cake",
    name: "Wedding Cake",
    icon: Cake,
    image: "/placeholder.svg?height=300&width=400",
    description: "Delicious and beautiful wedding cakes and desserts",
  },
]

export default function CategoriesPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Wedding Vendor Categories</h1>
      <p className="mb-8 text-muted-foreground">
        Browse through our comprehensive list of wedding vendor categories to find the perfect professionals for your
        special day.
      </p>

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
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
