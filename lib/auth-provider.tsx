"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db, getIsFirebaseInitialized } from "@/lib/firebase/config"
import { authenticateFallbackUser, addFallbackUser } from "@/lib/fallback-auth"

type UserRole = "user" | "vendor" | "admin" | null

// Create a mock User type for fallback authentication
interface MockUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

type AuthContextType = {
  user: User | MockUser | null
  userRole: UserRole
  isLoading: boolean
  isFirebaseAvailable: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: "user" | "vendor") => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(getIsFirebaseInitialized())
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    // Check if Firebase is initialized
    if (!getIsFirebaseInitialized()) {
      console.warn("Firebase Auth is not initialized. Using fallback authentication.")
      setIsFirebaseAvailable(false)
      setUsingFallback(true)
      setIsLoading(false)
      return () => {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "User logged out")
      setUser(user)

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const role = userDoc.data().role as UserRole
            console.log("User role from Firestore:", role)
            setUserRole(role)
          } else {
            console.log("User document doesn't exist, defaulting to 'user' role")
            setUserRole("user") // Default role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          setUserRole("user") // Default to user role on error
        }
      } else {
        setUserRole(null)
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log("Sign in attempt for:", email)

    // Try Firebase authentication first if available
    if (getIsFirebaseInitialized()) {
      try {
        console.log("Attempting Firebase authentication")
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log("Firebase authentication successful for:", email)

        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const role = userDoc.data().role as UserRole
            console.log("User role from Firestore:", role)
            setUserRole(role)
          } else {
            console.log("User document doesn't exist in Firestore, creating one with default role")
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || email.split("@")[0],
              role: "user", // Default role
              createdAt: new Date(),
              phoneNumber: "",
              city: "",
              profileComplete: false,
            })
            setUserRole("user")
          }
        } catch (firestoreError) {
          console.error("Error fetching/creating user role:", firestoreError)
          setUserRole("user")
        }

        return
      } catch (error: any) {
        console.error("Firebase authentication failed:", error)
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)

        // If Firebase auth fails, try fallback authentication
        console.log("Trying fallback authentication")
      }
    } else {
      console.log("Firebase not initialized, using fallback authentication")
    }

    // Fallback authentication
    const fallbackUser = authenticateFallbackUser(email, password)
    if (fallbackUser) {
      console.log("Fallback authentication successful")

      // Create a mock user
      const mockUser: MockUser = {
        uid: `fallback-${Date.now()}`,
        email: fallbackUser.email,
        displayName: fallbackUser.displayName,
        photoURL: null,
      }

      setUser(mockUser)
      setUserRole(fallbackUser.role)
      setUsingFallback(true)
      return
    }

    // If both authentication methods fail
    console.error("All authentication methods failed")
    throw new Error("Invalid email or password. Please check your credentials and try again.")
  }

  const signUp = async (email: string, password: string, name: string, role: "user" | "vendor") => {
    if (getIsFirebaseInitialized()) {
      try {
        console.log("Creating user with email:", email, "and role:", role)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log("User created with UID:", user.uid)

        // Update profile with display name
        await updateProfile(user, {
          displayName: name,
        })
        console.log("User profile updated with name:", name)

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: role,
          createdAt: new Date(),
          phoneNumber: "",
          city: "",
          profileComplete: false,
        })
        console.log("User document created in Firestore with role:", role)

        setUserRole(role)
      } catch (error) {
        console.error("Error signing up with Firebase:", error)

        // Try fallback signup
        console.log("Trying fallback signup")
        addFallbackUser({
          email,
          password,
          displayName: name,
          role,
        })

        // Create a mock user
        const mockUser: MockUser = {
          uid: `fallback-${Date.now()}`,
          email,
          displayName: name,
          photoURL: null,
        }

        setUser(mockUser)
        setUserRole(role)
        setUsingFallback(true)
      }
    } else {
      // Fallback signup
      console.log("Firebase not initialized, using fallback signup")
      addFallbackUser({
        email,
        password,
        displayName: name,
        role,
      })

      // Create a mock user
      const mockUser: MockUser = {
        uid: `fallback-${Date.now()}`,
        email,
        displayName: name,
        photoURL: null,
      }

      setUser(mockUser)
      setUserRole(role)
      setUsingFallback(true)
    }
  }

  const signInWithGoogle = async () => {
    if (getIsFirebaseInitialized()) {
      try {
        const provider = new GoogleAuthProvider()
        const userCredential = await signInWithPopup(auth, provider)
        const user = userCredential.user

        // Check if user document exists
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (!userDoc.exists()) {
          // Create new user document if it doesn't exist
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: "user", // Default role for Google sign-in
            createdAt: new Date(),
            phoneNumber: user.phoneNumber || "",
            city: "",
            profileComplete: false,
          })

          setUserRole("user")
        } else {
          setUserRole(userDoc.data().role as UserRole)
        }
      } catch (error) {
        console.error("Error signing in with Google:", error)
        throw new Error("Google sign-in failed. Please try another method.")
      }
    } else {
      // Fallback for Google sign-in
      console.log("Firebase not initialized, using fallback for Google sign-in")

      // Create a mock user for Google sign-in
      const mockUser: MockUser = {
        uid: `fallback-google-${Date.now()}`,
        email: "google-user@example.com",
        displayName: "Google User",
        photoURL: null,
      }

      setUser(mockUser)
      setUserRole("user")
      setUsingFallback(true)
    }
  }

  const signOut = async () => {
    if (getIsFirebaseInitialized() && !usingFallback) {
      try {
        console.log("Signing out user from Firebase")
        await firebaseSignOut(auth)
        setUserRole(null)
        console.log("Firebase sign out successful")
      } catch (error) {
        console.error("Error signing out from Firebase:", error)
        throw error
      }
    } else {
      // Fallback sign out
      console.log("Using fallback sign out")
      setUser(null)
      setUserRole(null)
      setUsingFallback(false)
    }
  }

  const value = {
    user,
    userRole,
    isLoading,
    isFirebaseAvailable: getIsFirebaseInitialized(),
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
