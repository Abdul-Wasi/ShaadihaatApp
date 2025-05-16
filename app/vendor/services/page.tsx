"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { getVendorByUserId, updateVendorProfile } from "@/lib/firebase/vendors"
import { AuthGuard } from "@/components/auth-guard"
import type { Vendor } from "@/types"

const serviceFormSchema = z.object({
  name: z.string().min(2, { message: "Service name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().min(1, { message: "Price must be at least 1" }),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

export default function ManageServicesPage() {
  return (
    <AuthGuard requiredRole="vendor">
      <ManageServicesContent />
    </AuthGuard>
  )
}

function ManageServicesContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Array<{ name: string; description: string; price: number }>>([])
  const [isAddingService, setIsAddingService] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
    },
  })

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return

      setLoading(true)
      try {
        const vendorData = await getVendorByUserId(user.uid)
        setVendor(vendorData)

        if (vendorData && vendorData.services) {
          setServices(vendorData.services)
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your services",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [user, toast])

  const onSubmit = async (values: ServiceFormValues) => {
    if (!vendor) return

    try {
      const updatedServices = [...services]

      if (editingIndex !== null) {
        // Update existing service
        updatedServices[editingIndex] = values
      } else {
        // Add new service
        updatedServices.push(values)
      }

      setIsSaving(true)
      await updateVendorProfile(vendor.id, { services: updatedServices })

      setServices(updatedServices)
      setIsAddingService(false)
      setEditingIndex(null)
      form.reset()

      toast({
        title: editingIndex !== null ? "Service updated" : "Service added",
        description: editingIndex !== null ? "Your service has been updated" : "Your service has been added",
      })
    } catch (error) {
      console.error("Error saving service:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save service",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditService = (index: number) => {
    const service = services[index]
    form.reset({
      name: service.name,
      description: service.description,
      price: service.price,
    })
    setEditingIndex(index)
    setIsAddingService(true)
  }

  const handleDeleteService = async (index: number) => {
    if (!vendor) return

    try {
      const updatedServices = [...services]
      updatedServices.splice(index, 1)

      setIsSaving(true)
      await updateVendorProfile(vendor.id, { services: updatedServices })

      setServices(updatedServices)
      toast({
        title: "Service deleted",
        description: "Your service has been deleted",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelForm = () => {
    form.reset()
    setIsAddingService(false)
    setEditingIndex(null)
  }

  if (loading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4">Loading your services...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Manage Services</h1>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              You need to set up your vendor profile before you can manage your services.
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
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <Button onClick={() => router.push("/vendor/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Services List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>Manage the services you offer to customers</CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground">You haven't added any services yet.</p>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          </div>
                          <div className="text-right font-semibold">₹{service.price.toLocaleString()}</div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditService(index)}
                            disabled={isSaving}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteService(index)}
                            disabled={isSaving}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!isAddingService && (
                <Button className="w-full" onClick={() => setIsAddingService(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Service
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Add/Edit Service Form */}
        {isAddingService && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{editingIndex !== null ? "Edit Service" : "Add New Service"}</CardTitle>
                <CardDescription>
                  {editingIndex !== null ? "Update the details of your service" : "Add a new service to your offerings"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Basic Photography Package" {...field} />
                          </FormControl>
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
                              placeholder="Describe what's included in this service..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide details about what's included, duration, and any other relevant information.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={cancelForm} disabled={isSaving}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {editingIndex !== null ? "Update Service" : "Add Service"}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
