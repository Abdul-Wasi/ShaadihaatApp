import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isAdminRoute } from "@/lib/admin-config"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if the path is an admin route
  if (isAdminRoute(path)) {
    // In a real app, you would check for admin authentication here
    // For now, we'll allow access in development mode
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next()
    }

    // In production, check for session
    const session = request.cookies.get("session")
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
