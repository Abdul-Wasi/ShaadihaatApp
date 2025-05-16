import { ref, getDownloadURL, uploadString } from "firebase/storage"
import { storage, getIsFirebaseInitialized } from "@/lib/firebase/config"

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let retries = 0
  let delay = initialDelay

  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (retries >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached, throwing error`)
        throw error
      }

      console.log(`Attempt ${retries + 1} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      retries++
      delay *= 2 // Exponential backoff
    }
  }
}

// Direct upload to Firebase Storage with retry
export async function uploadToFirebaseStorage(
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!getIsFirebaseInitialized()) {
    throw new Error("Firebase is not initialized")
  }

  try {
    // Convert to base64
    const base64Data = await fileToBase64(file)

    // Create storage reference
    const storageRef = ref(storage, path)

    // Upload with retry
    await retryWithBackoff(async () => {
      await uploadString(storageRef, base64Data, "data_url")
      if (onProgress) onProgress(100)
    })

    // Get download URL
    return await getDownloadURL(storageRef)
  } catch (error) {
    console.error("Firebase Storage upload failed:", error)
    throw error
  }
}

// Fallback upload using fetch to a temporary storage service
// This is a mock implementation - in a real app, you would use your own server endpoint
export async function uploadToTempStorage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // This is a mock implementation
  // In a real app, you would implement an upload to your own server or a service like Cloudinary

  // Simulate progress
  if (onProgress) {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      onProgress(Math.min(progress, 99))
      if (progress >= 100) clearInterval(interval)
    }, 300)
  }

  // For now, we'll just return a placeholder URL
  // In a real implementation, you would upload the file and get a real URL
  await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate upload time

  if (onProgress) onProgress(100)
  return `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(file.name)}`
}

// Multi-strategy upload function that tries different methods
export async function uploadWithFallback(
  path: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // First try Firebase Storage
    console.log("Attempting Firebase Storage upload...")
    return await uploadToFirebaseStorage(path, file, onProgress)
  } catch (error) {
    console.error("Firebase Storage upload failed, trying fallback...", error)

    // If Firebase fails, try the fallback method
    console.log("Attempting fallback upload...")
    return await uploadToTempStorage(file, onProgress)
  }
}
