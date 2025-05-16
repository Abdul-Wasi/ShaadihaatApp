// Add error handling for Firebase initialization issues

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { FeaturedVendors } from "@/components/featured-vendors"
import { VendorCategories } from "@/components/vendor-categories"
import { Testimonials } from "@/components/testimonials"

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden">
        <Image
          src="/placeholder.svg?height=1200&width=2000"
          alt="Wedding celebration"
          fill
          className="object-cover brightness-[0.7]"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Find the Perfect Vendors for Your Dream Wedding
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90">
            Connect with trusted photographers, makeup artists, caterers, and more to make your special day
            unforgettable
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-700">
              <Link href="/vendors">Browse Vendors</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/auth/register">Join as Vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Find Vendors by Category</h2>
          <p className="mt-2 text-muted-foreground">Browse through our curated list of wedding service providers</p>
        </div>
        <VendorCategories />
      </section>

      {/* Featured Vendors Section */}
      <section className="container">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Top Wedding Vendors</h2>
          <p className="mt-2 text-muted-foreground">Discover our most highly rated and popular wedding professionals</p>
        </div>
        <FeaturedVendors />
      </section>

      {/* How It Works Section */}
      <section className="bg-rose-50 py-16">
        <div className="container">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">How ShaadiHaat Works</h2>
            <p className="mt-2 text-muted-foreground">
              Simple steps to find and book the perfect vendors for your wedding
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-600">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Browse Vendors</h3>
              <p className="text-muted-foreground">
                Search through our extensive list of verified wedding vendors by category and location
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-600">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Compare Options</h3>
              <p className="text-muted-foreground">
                View profiles, portfolios, pricing, and reviews to find your perfect match
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-600">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Book & Celebrate</h3>
              <p className="text-muted-foreground">
                Easily book your chosen vendors and focus on enjoying your special day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">What Couples Say</h2>
          <p className="mt-2 text-muted-foreground">
            Read testimonials from couples who found their perfect wedding vendors through ShaadiHaat
          </p>
        </div>
        <Testimonials />
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-500 to-rose-600 py-16 text-white">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Plan Your Dream Wedding?</h2>
          <p className="mb-8 text-lg">
            Join thousands of couples who found their perfect wedding vendors with ShaadiHaat
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
