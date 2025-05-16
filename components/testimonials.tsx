import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Priya & Rahul",
    image: "/placeholder.svg?height=100&width=100",
    text: "ShaadiHaat made finding our wedding photographer so easy! We loved being able to browse portfolios and read reviews all in one place.",
    rating: 5,
  },
  {
    id: 2,
    name: "Ananya & Vikram",
    image: "/placeholder.svg?height=100&width=100",
    text: "We found an amazing caterer through ShaadiHaat who created a perfect fusion menu for our multicultural wedding. Our guests are still talking about the food!",
    rating: 5,
  },
  {
    id: 3,
    name: "Meera & Arjun",
    image: "/placeholder.svg?height=100&width=100",
    text: "The mehendi artist we booked through ShaadiHaat was incredibly talented. The booking process was smooth, and we got exactly what we wanted.",
    rating: 4,
  },
]

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((testimonial) => (
        <Card key={testimonial.id}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-semibold">{testimonial.name}</h4>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-muted-foreground">{testimonial.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
