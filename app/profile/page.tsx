"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getUserProfile, updateUserProfile } from "@/lib/firebase/users"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"

const formSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
})

export default function ProfilePage() {
  const { user, isFirebaseAvailable } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [photoURL, setPhotoURL] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      phoneNumber: "",
      city: "",
    },
  })

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const profile = await getUserProfile(user.uid)
        setPhotoURL(user.photoURL)

        if (profile) {
          form.reset({
            displayName: profile.displayName || user.displayName || "",
            phoneNumber: profile.phoneNumber || "",
            city: profile.city || "",
          })
        } else {
          form.reset({
            displayName: user.displayName || "",
            phoneNumber: "",
            city: "",
          })
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your profile",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [user, form, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to update your profile",
      })
      return
    }

    try {
      await updateUserProfile(user.uid, {
        displayName: values.displayName,
        phoneNumber: values.phoneNumber || "",
        city: values.city || "",
        profileComplete: true,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your profile",
      })
    }
  }

  const handlePhotoChange = async (newPhotoURL: string | null) => {
    if (!user) return

    try {
      // In a real app with Firebase, we would update the user's photoURL in Firebase Auth
      // For now, we'll just update it in the local state
      setPhotoURL(newPhotoURL)

      // Update the user profile in Firestore
      await updateUserProfile(user.uid, {
        photoURL: newPhotoURL,
      })

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating profile picture:", error)
      return Promise.reject(error)
    }
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view your profile.</p>
        <Button className="mt-4" asChild>
          <a href="/auth/login">Sign In</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="flex flex-col items-center text-center">
          <ProfilePictureUpload currentPhotoURL={photoURL} onPhotoChange={handlePhotoChange} size="lg" />
          <CardTitle className="mt-4">Your Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your phone number" {...field} />
                    </FormControl>
                    <FormDescription>This will be used for booking confirmations.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your city" {...field} />
                    </FormControl>
                    <FormDescription>This helps us show you relevant vendors.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end gap-2 px-0">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
