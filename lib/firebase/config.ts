import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type Storage } from "firebase/storage"
import { getFunctions, type Functions } from "firebase/functions"

// Create mock implementations for Firebase services
class MockFirebaseService {
  // This will allow us to check if Firebase is properly initialized
  _isMock = true
}

class MockAuth extends MockFirebaseService implements Partial<Auth> {
  currentUser = null
  onAuthStateChanged = () => () => {}
}

class MockFirestore extends MockFirebaseService implements Partial<Firestore> {}
class MockStorage extends MockFirebaseService implements Partial<Storage> {}
class MockFunctions extends MockFirebaseService implements Partial<Functions> {}

// Initialize with mock implementations by default
let app = null
let auth: Auth | MockAuth = new MockAuth()
let db: Firestore | MockFirestore = new MockFirestore()
let storage: Storage | MockStorage = new MockStorage()
let functions: Functions | MockFunctions = new MockFunctions()

// Flag to track if Firebase is properly initialized
let isFirebaseInitialized = false

// Try to initialize Firebase only if we're in a browser environment
if (typeof window !== "undefined") {
  try {
    // Check if all required environment variables are available
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

    // Log the Firebase configuration for debugging
    console.log("Firebase configuration check:", {
      apiKey: apiKey ? "Set" : "Not set",
      authDomain: authDomain ? "Set" : "Not set",
      projectId: projectId ? "Set" : "Not set",
      storageBucket: storageBucket ? "Set" : "Not set",
      messagingSenderId: messagingSenderId ? "Set" : "Not set",
      appId: appId ? "Set" : "Not set",
    })

    // Only initialize if all required variables are present
    if (apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId) {
      const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      }

      console.log("Initializing Firebase with config:", firebaseConfig)

      // Initialize Firebase
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
      functions = getFunctions(app)

      // Verify initialization
      if (auth && db) {
        console.log("Firebase Auth and Firestore initialized successfully")
        isFirebaseInitialized = true
      } else {
        console.error("Firebase services failed to initialize properly")
        console.error("Auth initialized:", !!auth)
        console.error("Firestore initialized:", !!db)
      }
    } else {
      console.warn("Missing Firebase environment variables. Using mock implementation.")
      console.warn("Missing variables:", {
        apiKey: !apiKey,
        authDomain: !authDomain,
        projectId: !projectId,
        storageBucket: !storageBucket,
        messagingSenderId: !messagingSenderId,
        appId: !appId,
      })
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
  }
}

// Export a function to check if Firebase is properly initialized
export function getIsFirebaseInitialized() {
  return isFirebaseInitialized
}

export { app, auth, db, storage, functions }
