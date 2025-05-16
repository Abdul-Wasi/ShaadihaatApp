"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, CreditCard, Loader2 } from "lucide-react"
import { format, addDays, isBefore, isAfter } from "date-fns"
import { Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar" //test comment
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { createBooking } from "@/lib/firebase/bookings"
import { processPayment, type PaymentMethod } from "@/lib/payment-service"
import type { Vendor } from "@/types"

const bookingFormSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  timeSlot: z.object(
    {
      start: z.string(),
      end: z.string(),
    },
    {
      required_error: "Please select a time slot",
    },
  ),
  notes: z
    .string()
    .max(500, {
      message: "Notes must not exceed 500 characters",
    })
    .optional(),
})

const paymentFormSchema = z
  .object({
    paymentMethod: z.enum(["credit_card", "debit_card", "upi", "net_banking", "wallet"], {
      required_error: "Please select a payment method",
    }),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
    upiId: z.string().optional(),
    bankAccount: z.string().optional(),
    walletProvider: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "credit_card" || data.paymentMethod === "debit_card") {
        return !!data.cardNumber && !!data.cardExpiry && !!data.cardCvc
      }
      if (data.paymentMethod === "upi") {
        return !!data.upiId
      }
      if (data.paymentMethod === "net_banking") {
        return !!data.bankAccount
      }
      if (data.paymentMethod === "wallet") {
        return !!data.walletProvider
      }
      return true
    },
    {
      message: "Please provide all required payment details",
      path: ["paymentMethod"],
    },
  )

interface BookingFormProps {
  vendor: Vendor
  onClose: () => void
}

export function BookingForm({ vendor, onClose }: BookingFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<"booking" | "payment" | "confirmation">("booking")
  const [bookingDetails, setBookingDetails] = useState<z.infer<typeof bookingFormSchema> | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Time slots - in a real app, these would come from the vendor's availability
  const timeSlots = [
    { start: "09:00", end: "11:00" },
    { start: "11:00", end: "13:00" },
    { start: "14:00", end: "16:00" },
    { start: "16:00", end: "18:00" },
  ]

  const bookingForm = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      notes: "",
    },
  })

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "credit_card",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      upiId: "",
      bankAccount: "",
      walletProvider: "",
    },
  })

  async function onBookingSubmit(values: z.infer<typeof bookingFormSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to book a vendor",
      })
      return
    }

    // Save booking details and move to payment step
    setBookingDetails(values)
    setStep("payment")
  }

  async function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (!user || !bookingDetails) return

    setIsSubmitting(true)
    try {
      // Calculate booking amount (in a real app, this would be based on the vendor's pricing)
      const bookingAmount = vendor.priceRange.min

      // Process payment
      const paymentResult = await processPayment({
        amount: bookingAmount,
        currency: "INR",
        description: `Booking for ${vendor.name} on ${format(bookingDetails.date, "PPP")}`,
        paymentMethod: values.paymentMethod as PaymentMethod,
        cardNumber: values.cardNumber,
        cardExpiry: values.cardExpiry,
        cardCvc: values.cardCvc,
        upiId: values.upiId,
        bankAccount: values.bankAccount,
        walletProvider: values.walletProvider,
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment failed")
      }

      // Save transaction ID
      setTransactionId(paymentResult.transactionId || null)

      // Create booking in database
      await createBooking({
        userId: user.uid,
        vendorId: vendor.id,
        date: Timestamp.fromDate(bookingDetails.date),
        timeSlot: bookingDetails.timeSlot,
        notes: bookingDetails.notes || "",
        transactionId: paymentResult.transactionId,
        amount: bookingAmount,
        paymentMethod: values.paymentMethod,
      })

      // Move to confirmation step
      setStep("confirmation")

      toast({
        title: "Booking confirmed",
        description: `Your booking with ${vendor.name} has been confirmed.`,
      })
    } catch (error: any) {
      console.error("Error processing payment:", error)
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "There was an error processing your payment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate date range for booking (today + 90 days)
  const today = new Date()
  const maxDate = addDays(today, 90)

  // Disable past dates and dates more than 90 days in the future
  const disabledDates = (date: Date) => {
    return isBefore(date, today) || isAfter(date, maxDate)
  }

  const handleClose = () => {
    if (step === "confirmation") {
      // If booking is confirmed, redirect to bookings page
      router.push("/bookings")
    } else {
      onClose()
    }
  }

  const renderBookingForm = () => (
    <>
      <DialogHeader>
        <DialogTitle>Book {vendor.name}</DialogTitle>
        <DialogDescription>Fill out the form below to request a booking with this vendor.</DialogDescription>
      </DialogHeader>
      <Form {...bookingForm}>
        <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-6">
          <FormField
            control={bookingForm.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={disabledDates}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={bookingForm.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Slot</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const [start, end] = value.split("-")
                    field.onChange({ start, end })
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot, index) => (
                      <SelectItem key={index} value={`${slot.start}-${slot.end}`}>
                        {slot.start} - {slot.end}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={bookingForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requirements or information for the vendor"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Continue to Payment</Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )

  const renderPaymentForm = () => (
    <>
      <DialogHeader>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogDescription>
          Complete your payment to confirm your booking with {vendor.name} on{" "}
          {bookingDetails ? format(bookingDetails.date, "PPP") : ""}
        </DialogDescription>
      </DialogHeader>
      <Form {...paymentForm}>
        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
          <div className="rounded-md border p-4">
            <h3 className="mb-2 font-medium">Booking Summary</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Vendor:</span> {vendor.name}
              </p>
              <p>
                <span className="text-muted-foreground">Date:</span>{" "}
                {bookingDetails ? format(bookingDetails.date, "PPP") : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Time:</span>{" "}
                {bookingDetails ? `${bookingDetails.timeSlot.start} - ${bookingDetails.timeSlot.end}` : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span> ₹{vendor.priceRange.min.toLocaleString()}
              </p>
            </div>
          </div>

          <FormField
            control={paymentForm.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Payment Method</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="credit_card" />
                      </FormControl>
                      <FormLabel className="font-normal">Credit Card</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="debit_card" />
                      </FormControl>
                      <FormLabel className="font-normal">Debit Card</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="upi" />
                      </FormControl>
                      <FormLabel className="font-normal">UPI</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="net_banking" />
                      </FormControl>
                      <FormLabel className="font-normal">Net Banking</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="wallet" />
                      </FormControl>
                      <FormLabel className="font-normal">Wallet</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional fields based on payment method */}
          {(paymentForm.watch("paymentMethod") === "credit_card" ||
            paymentForm.watch("paymentMethod") === "debit_card") && (
            <div className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input placeholder="4111 1111 1111 1111" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="cardExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input placeholder="MM/YY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="cardCvc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVC</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {paymentForm.watch("paymentMethod") === "upi" && (
            <FormField
              control={paymentForm.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI ID</FormLabel>
                  <FormControl>
                    <Input placeholder="username@upi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {paymentForm.watch("paymentMethod") === "net_banking" && (
            <FormField
              control={paymentForm.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Bank</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sbi">State Bank of India</SelectItem>
                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                      <SelectItem value="icici">ICICI Bank</SelectItem>
                      <SelectItem value="axis">Axis Bank</SelectItem>
                      <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {paymentForm.watch("paymentMethod") === "wallet" && (
            <FormField
              control={paymentForm.control}
              name="walletProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paytm">Paytm</SelectItem>
                      <SelectItem value="phonepe">PhonePe</SelectItem>
                      <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                      <SelectItem value="mobikwik">MobiKwik</SelectItem>
                      <SelectItem value="freecharge">Freecharge</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStep("booking")}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{vendor.priceRange.min.toLocaleString()}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  )

  const renderConfirmation = () => (
    <>
      <DialogHeader>
        <DialogTitle>Booking Confirmed!</DialogTitle>
        <DialogDescription>Your booking with {vendor.name} has been confirmed.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="rounded-md border border-green-100 bg-green-50 p-4">
          <h3 className="mb-2 font-medium text-green-800">Booking Details</h3>
          <div className="space-y-1 text-sm text-green-800">
            <p>
              <span className="font-medium">Vendor:</span> {vendor.name}
            </p>
            <p>
              <span className="font-medium">Date:</span> {bookingDetails ? format(bookingDetails.date, "PPP") : ""}
            </p>
            <p>
              <span className="font-medium">Time:</span>{" "}
              {bookingDetails ? `${bookingDetails.timeSlot.start} - ${bookingDetails.timeSlot.end}` : ""}
            </p>
            <p>
              <span className="font-medium">Amount Paid:</span> ₹{vendor.priceRange.min.toLocaleString()}
            </p>
            {transactionId && (
              <p>
                <span className="font-medium">Transaction ID:</span> {transactionId}
              </p>
            )}
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          A confirmation email has been sent to your registered email address. You can view all your bookings in the "My
          Bookings" section.
        </p>
      </div>
      <DialogFooter>
        <Button onClick={handleClose}>View My Bookings</Button>
      </DialogFooter>
    </>
  )

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "booking" && renderBookingForm()}
        {step === "payment" && renderPaymentForm()}
        {step === "confirmation" && renderConfirmation()}
      </DialogContent>
    </Dialog>
  )
}
