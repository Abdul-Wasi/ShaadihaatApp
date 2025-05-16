import type { Timestamp } from "firebase/firestore"

export type User = {
  uid: string
  email: string
  displayName: string
  role: "user" | "vendor" | "admin"
  createdAt: Timestamp
  phoneNumber: string
  city: string
  profileComplete: boolean
  photoURL?: string | null
}

export type Vendor = {
  id: string
  userId: string
  name: string
  category: string
  description: string
  city: string
  address: string
  phoneNumber: string
  email: string
  website?: string
  priceRange: {
    min: number
    max: number
  }
  coverImage?: string
  coverImageData?: string
  galleryImages?: string[]
  galleryImagesData?: string[]
  availability?: {
    date: Timestamp
    slots: {
      start: string
      end: string
    }[]
  }[]
  services?: {
    name: string
    description: string
    price: number
  }[]
  rating?: number
  reviewCount?: number
  isApproved: boolean
  isFeatured: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Booking = {
  id: string
  userId: string
  vendorId: string
  date: Timestamp
  timeSlot: {
    start: string
    end: string
  }
  notes: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  transactionId?: string
  amount?: number
  paymentMethod?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Review = {
  id: string
  userId: string
  vendorId: string
  rating: number
  text: string
  createdAt: Timestamp
  userDisplayName: string
  userPhotoURL?: string
}
