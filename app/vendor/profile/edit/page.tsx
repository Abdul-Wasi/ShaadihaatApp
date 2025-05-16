"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorByUserId, updateVendorProfile } from "@/lib/firebase/vendors"
import type { Vendor } from "@/types"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  category: z.string({ required_error: "Please select a category" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  city: z.string().min(2, { message: "City is required" }),
  address: z.string().min(5, { message: "Address is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  priceRangeMin: z.coerce.number().min(0, { message: "Minimum price is required" }),
  priceRangeMax: z.coerce.number().min(0, { message: "Maximum price is required" }),
})

const categories = [
  { id: "photography", name: "Photography" },
  { id: "catering", name: "Catering" },
  { id: "music", name: "Music & DJ" },
  { id: "decor", name: "Decoration" },
  { id: "makeup", name: "Makeup Artist" },
  { id: "gifts", name: "Gifts & Favors" },
  { id: "flowers", name: "Flowers" },
  { id: "transport", name: "Transportation" },
  { id: "venue", name: "Venue" },
  { id: "mehendi", name: "Mehendi Artist" },
]

export default function EditVendorProfilePage() {
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [vendor, setVendor] = useState<Vendor | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      city: "",
      address: "",
      phoneNumber: "",
      email: "",
      website: "",
      priceRangeMin: 0,
      priceRangeMax: 0,
    },
  })

  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const vendorData = await getVendorByUserId(user.uid)

        if (vendorData) {
          setVendor(vendorData)
          form.reset({
            name: vendorData.name,
            category: vendorData.category,
            description: vendorData.description,
            city: vendorData.city,
            address: vendorData.address,
            phoneNumber: vendorData.phoneNumber,
            email: vendorData.email,
            website: vendorData.website || "",
            priceRangeMin: vendorData.priceRange.min,
            priceRangeMax: vendorData.priceRange.max,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Profile not found",
            description: "Could not find your vendor profile",
          })
          router.push("/vendor/profile/create")
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your profile",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorProfile()
  }, [user, toast, router, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !vendor) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Profile not found",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const vendorData = {
        name: values.name,
        category: values.category,
        description: values.description,
        city: values.city,
        address: values.address,
        phoneNumber: values.phoneNumber,
        email: values.email,
        ...(values.website ? { website: values.website } : {}),
        priceRange: {
          min: values.priceRangeMin,
          max: values.priceRangeMax,
        },
      }

      await updateVendorProfile(vendor.id, vendorData)

      toast({
        title: "Profile updated",
        description: "Your vendor profile has been updated successfully",
      })

      router.push("/vendor/dashboard")
    } catch (error) {
      console.error("Error updating vendor profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your profile",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to edit your vendor profile.</p>
        <Button className="mt-4" asChild>
          <a href="/auth/login">Sign In</a>
        </Button>
      </div>
    )
  }

  if (userRole !== "vendor") {
    return (
      <div className="container flex flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You need a vendor account to access this page.</p>
        <Button className="mt-4" asChild>
          <a href="/">Go Home</a>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <div className="h-8 w-1/3 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
                  <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Edit Vendor Profile</CardTitle>
          <CardDescription>Update your vendor profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your business name" {...field} />
                    </FormControl>
                    <FormDescription>This is how your business will appear to users.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose the category that best describes your services.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your services, experience, and what makes you unique..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Provide a detailed description of your services and experience.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Your city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormDescription>Your business website or social media page.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priceRangeMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRangeMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="flex justify-end gap-2 px-0">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
