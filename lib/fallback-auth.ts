// This is a fallback authentication system for when Firebase isn't working properly
// It's only for development/testing purposes

// Store users in memory (this will reset on page refresh)
interface FallbackUser {
  email: string
  password: string
  displayName: string
  role: "user" | "vendor" | "admin"
}

// Pre-defined users
const predefinedUsers: FallbackUser[] = [
  {
    email: "mominzahoor11@gmail.com",
    password: "qwertyuiop", // Lowercase as specified
    displayName: "Admin User",
    role: "admin",
  },
  {
    email: "test@example.com",
    password: "password123",
    displayName: "Test User",
    role: "user",
  },
]

// In-memory user storage
const fallbackUsers: FallbackUser[] = [...predefinedUsers]

// Add a user to the fallback system
export function addFallbackUser(user: FallbackUser): void {
  // Check if user already exists
  const existingUserIndex = fallbackUsers.findIndex((u) => u.email === user.email)
  if (existingUserIndex >= 0) {
    // Update existing user
    fallbackUsers[existingUserIndex] = user
  } else {
    // Add new user
    fallbackUsers.push(user)
  }
  console.log("Fallback user added:", user.email)
}

// Authenticate a user with the fallback system
export function authenticateFallbackUser(email: string, password: string): FallbackUser | null {
  const user = fallbackUsers.find((u) => u.email === email && u.password === password)
  if (user) {
    console.log("Fallback authentication successful for:", email)
    return user
  }
  console.log("Fallback authentication failed for:", email)
  return null
}

// Get all fallback users (for debugging)
export function getAllFallbackUsers(): FallbackUser[] {
  return [...fallbackUsers]
}

// Initialize the fallback system with the admin user from environment variables
export function initializeFallbackAuth(): void {
  const adminEmail = process.env.ADMIN_EMAIL || "mominzahoor11@gmail.com"

  // Add the admin user from environment variables
  addFallbackUser({
    email: adminEmail,
    password: "qwertyuiop", // Lowercase as specified
    displayName: "Admin",
    role: "admin",
  })

  console.log("Fallback authentication system initialized with admin:", adminEmail)
}

// Initialize the fallback system
initializeFallbackAuth()
