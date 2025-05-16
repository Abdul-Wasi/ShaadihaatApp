import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

type UserProfile = {
  uid: string
  email: string
  displayName: string
  phoneNumber: string
  city: string
  role: "user" | "vendor" | "admin"
  profileComplete: boolean
  photoURL?: string | null
  createdAt: any
  updatedAt: any
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }

    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  profileData: Partial<Omit<UserProfile, "uid" | "email" | "role" | "createdAt" | "updatedAt">>,
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...profileData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Create user profile (used during registration)
export async function createUserProfile(
  userId: string,
  userData: {
    email: string
    displayName: string
    role: "user" | "vendor" | "admin"
    photoURL?: string | null
  },
): Promise<void> {
  try {
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      phoneNumber: "",
      city: "",
      photoURL: userData.photoURL || null,
      profileComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}
