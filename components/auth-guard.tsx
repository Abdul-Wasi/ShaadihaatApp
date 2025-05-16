"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "user" | "vendor" | "admin" | null
  redirectTo?: string
}

export function AuthGuard({ children, requiredRole, redirectTo = "/auth/login" }: AuthGuardProps) {
  const { user, userRole, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // If no authentication is required, or user is authenticated
      if (!requiredRole || (user && (!requiredRole || userRole === requiredRole))) {
        setIsAuthorized(true)
      } else {
        // Redirect if not authenticated or doesn't have required role
        router.push(redirectTo)
      }
      setIsCheckingAuth(false)
    }
  }, [user, userRole, isLoading, requiredRole, redirectTo, router])

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}
