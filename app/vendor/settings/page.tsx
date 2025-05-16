"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorByUserId } from "@/lib/firebase/vendors"
import { AuthGuard } from "@/components/auth-guard"
import type { Vendor } from "@/types"

const accountFormSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }).optional(),
    currentPassword: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  })

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  bookingUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  accountAlerts: z.boolean().default(true),
})

export default function SettingsPage() {
  return (
    <AuthGuard requiredRole="vendor">
      <SettingsContent />
    </AuthGuard>
  )
}

function SettingsContent() {
  const { user, isFirebaseAvailable } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      bookingUpdates: true,
      marketingEmails: false,
      accountAlerts: true,
    },
  })

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const vendorData = await getVendorByUserId(user.uid)
        setVendor(vendorData)

        if (vendorData) {
          accountForm.reset({
            email: user.email || "",
          })

          // If we had notification settings in the vendor data, we would set them here
          // For now, we'll use the defaults
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your settings",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [user, toast, accountForm])

  const onAccountSubmit = async (values: z.infer<typeof accountFormSchema>) => {
    if (!user || !vendor) return

    setIsSaving(true)
    setError(null)

    try {
      // In a real app, we would update the user's email and password in Firebase Auth
      // For now, we'll just show a success message

      if (values.newPassword && !isFirebaseAvailable) {
        throw new Error("Password changes are not available in fallback mode")
      }

      // Simulate a successful update
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Account updated",
        description: "Your account settings have been updated",
      })

      // Reset the password fields
      accountForm.reset({
        email: values.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error("Error updating account:", error)
      setError(error.message || "Failed to update account settings")
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update account settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const onNotificationSubmit = async (values: z.infer<typeof notificationFormSchema>) => {
    if (!vendor) return

    setIsSaving(true)
    try {
      // In a real app, we would save these settings to the vendor's profile
      // For now, we'll just show a success message

      // Simulate a successful update
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification settings",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              You need to set up your vendor profile before you can manage your account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create your vendor profile with details about your services, pricing, and availability.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/vendor/profile/create">Create Vendor Profile</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <Button onClick={() => router.push("/vendor/dashboard")}>Back to Dashboard</Button>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your account settings and change your password</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6">
                  <FormField
                    control={accountForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} disabled={!isFirebaseAvailable} />
                        </FormControl>
                        {!isFirebaseAvailable && (
                          <FormDescription>Email changes are not available in fallback mode</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>

                    <FormField
                      control={accountForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseAvailable} />
                          </FormControl>
                          {!isFirebaseAvailable && (
                            <FormDescription>Password changes are not available in fallback mode</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseAvailable} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseAvailable} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>Receive notifications via email</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="bookingUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Booking Updates</FormLabel>
                          <FormDescription>
                            Get notified when you receive new bookings or booking status changes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Marketing Emails</FormLabel>
                          <FormDescription>Receive emails about new features, tips, and promotions</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="accountAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Account Alerts</FormLabel>
                          <FormDescription>
                            Get important notifications about your account, security, and privacy
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
