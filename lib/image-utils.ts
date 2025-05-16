/**
 * Utility functions for image processing
 */

// Function to compress an image before uploading
export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // If the file is not an image, return it as is
    if (!file.type.startsWith("image/")) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        // Only resize if the image is larger than maxWidth
        const width = img.width
        const height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        let newWidth = width
        let newHeight = height

        if (width > maxWidth) {
          newWidth = maxWidth
          newHeight = Math.floor((height / width) * newWidth)
        }

        // Create a canvas to resize the image
        const canvas = document.createElement("canvas")
        canvas.width = newWidth
        canvas.height = newHeight

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Draw the resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Convert to blob with reduced quality for JPEGs
        const imageQuality = file.type === "image/jpeg" || file.type === "image/jpg" ? quality : 0.9
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob"))
              return
            }

            // Create a new file from the blob
            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })

            // Log compression results
            console.log(
              `Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`,
            )

            resolve(newFile)
          },
          file.type,
          imageQuality,
        )
      }
      img.onerror = () => {
        console.error("Error loading image for compression")
        // If compression fails, return the original file
        resolve(file)
      }
    }
    reader.onerror = () => {
      console.error("Error reading file for compression")
      // If compression fails, return the original file
      resolve(file)
    }
  })
}

// Check if an image is too large
export function isImageTooLarge(file: File, maxSizeMB = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size > maxSizeBytes
}

// Get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        })
      }
      img.onerror = (error) => {
        reject(error)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}
