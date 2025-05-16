// This file contains admin configuration and security settings

// Define a single admin email that is allowed to register as admin
// Get the admin email from environment variables, with a fallback
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mominzahoor11@gmail.com"

// Function to check if an email is authorized to be an admin
export function isAuthorizedAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// Admin routes that should be protected
export const ADMIN_ROUTES = ["/admin", "/admin/dashboard", "/admin/vendors", "/admin/users", "/admin/settings"]

// Function to check if a path is an admin route
export function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some((route) => path.startsWith(route))
}
