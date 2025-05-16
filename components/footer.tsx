import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold">ShaadiHaat</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Connecting couples with the perfect wedding vendors for their special day.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">For Couples</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vendors" className="text-muted-foreground hover:text-foreground">
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                  Wedding Planning Tips
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vendor/join" className="text-muted-foreground hover:text-foreground">
                  Join as Vendor
                </Link>
              </li>
              <li>
                <Link href="/vendor/pricing" className="text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/vendor/success-stories" className="text-muted-foreground hover:text-foreground">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ShaadiHaat. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
