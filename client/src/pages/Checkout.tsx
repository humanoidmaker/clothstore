import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  Plus,
  Home,
  Briefcase,
  MapPinned,
  Tag,
  X,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Package,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/shared/Skeleton";
import type { Address, ApiResponse, Coupon } from "@/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const FREE_SHIPPING_THRESHOLD = 99900;
const SHIPPING_COST = 9900;

const addressSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
});

type AddressFormData = z.infer<typeof addressSchema>;

const steps = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Payment", icon: CreditCard },
  { id: 3, label: "Confirmation", icon: CheckCircle2 },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const { items, subtotal, fetchCart, clearCart } = useCartStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [billingAddressId, setBillingAddressId] = useState<string>("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; orderId: string; total: number } | null>(null);

  const cartSubtotal = subtotal();
  const shippingCost = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = appliedCoupon?.discount ?? 0;
  const total = cartSubtotal + shippingCost - discount;

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { type: "HOME" },
  });

  const loadAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await apiGet<ApiResponse<Address[]>>("/addresses");
      setAddresses(res.data);
      const defaultAddr = res.data.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        setBillingAddressId(defaultAddr._id);
      } else if (res.data.length > 0) {
        setSelectedAddressId(res.data[0]._id);
        setBillingAddressId(res.data[0]._id);
      }
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    loadAddresses();
  }, [fetchCart, loadAddresses]);

  async function handleSaveAddress(data: AddressFormData) {
    setIsSavingAddress(true);
    try {
      const res = await apiPost<ApiResponse<Address>>("/addresses", data);
      const newAddr = res.data;
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr._id);
      if (billingSameAsShipping) setBillingAddressId(newAddr._id);
      setIsAddressDialogOpen(false);
      addressForm.reset({ type: "HOME" });
      toast.success("Address added successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const res = await apiGet<ApiResponse<{ coupon: Coupon; discount: number }>>(
        `/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&subtotal=${cartSubtotal}`
      );
      setAppliedCoupon({
        code: res.data.coupon.code,
        discount: res.data.discount,
        description: res.data.coupon.description,
      });
      toast.success("Coupon applied!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePlaceOrder() {
    setIsPlacingOrder(true);
    try {
      // 1. Create order
      const orderRes = await apiPost<ApiResponse<{ _id: string; orderNumber: string; total: number }>>("/orders", {
        shippingAddressId: selectedAddressId,
        billingAddressId: billingSameAsShipping ? selectedAddressId : billingAddressId,
        couponCode: appliedCoupon?.code,
        notes: orderNotes || undefined,
      });

      const orderId = orderRes.data._id;
      const orderNumber = orderRes.data.orderNumber;
      const orderTotal = orderRes.data.total;

      // 2. Create Razorpay order
      const paymentRes = await apiPost<ApiResponse<{ id: string; amount: number; currency: string }>>("/payments/create-order", {
        orderId,
      });

      // 3. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setIsPlacingOrder(false);
        return;
      }

      // 4. Open Razorpay checkout
      const options = {
        key: paymentRes.data.id ? undefined : undefined, // key will come from backend
        amount: paymentRes.data.amount,
        currency: paymentRes.data.currency || "INR",
        name: "ClothStore",
        description: `Order #${orderNumber}`,
        order_id: paymentRes.data.id,
        prefill: {
          name: user ? `${user.firstName} ${user.lastName}` : "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#1a1f36" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await apiPost("/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            setOrderResult({ orderNumber, orderId, total: orderTotal });
            setCurrentStep(3);
            clearCart();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled. You can retry anytime.");
            setIsPlacingOrder(false);
          },
        },
      };

      // Get key from the payment response or use environment variable
      const keyRes = await apiGet<ApiResponse<{ key: string }>>("/payments/key");
      (options as any).key = keyRes.data.key;

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        toast.error(response.error?.description || "Payment failed. Please try again.");
        setIsPlacingOrder(false);
      });
      razorpay.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  }

  const typeIcons: Record<string, typeof Home> = {
    HOME: Home,
    WORK: Briefcase,
    OTHER: MapPinned,
  };

  // Step indicator
  function StepIndicator() {
    return (
      <div className="mb-8 flex items-center justify-center">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : isActive
                        ? "border-[#1a1f36] bg-[#1a1f36] text-white"
                        : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    isActive ? "text-[#1a1f36]" : isCompleted ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-12 sm:w-20",
                    currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Step 1: Address
  function renderAddressStep() {
    if (isLoadingAddresses) {
      return (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4">
              <Skeleton className="mb-2 h-4 w-1/3" />
              <Skeleton className="mb-1 h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1a1f36]">Select Delivery Address</h2>
          <Button variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="mb-1 font-medium text-[#2d3436]">No saved addresses</p>
            <p className="mb-4 text-sm text-gray-500">Add a delivery address to continue</p>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Address
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((addr) => {
              const TypeIcon = typeIcons[(addr as any).type] || Home;
              return (
                <button
                  key={addr._id}
                  type="button"
                  onClick={() => {
                    setSelectedAddressId(addr._id);
                    if (billingSameAsShipping) setBillingAddressId(addr._id);
                  }}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-left transition-all",
                    selectedAddressId === addr._id
                      ? "border-[#1a1f36] bg-[#1a1f36]/[0.02] ring-1 ring-[#1a1f36]"
                      : "border-gray-100 hover:border-gray-300"
                  )}
                >
                  {selectedAddressId === addr._id && (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1f36]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-[#1a1f36]">{addr.fullName}</span>
                    {(addr as any).type && (
                      <Badge variant="secondary" className="text-[10px]">
                        {(addr as any).type}
                      </Badge>
                    )}
                    {addr.isDefault && (
                      <Badge variant="accent" className="text-[10px]">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Billing address checkbox */}
        {addresses.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="billing-same"
                checked={billingSameAsShipping}
                onCheckedChange={(checked) => {
                  setBillingSameAsShipping(!!checked);
                  if (checked) setBillingAddressId(selectedAddressId);
                }}
              />
              <Label htmlFor="billing-same" className="cursor-pointer text-sm">
                Billing address same as shipping
              </Label>
            </div>

            {!billingSameAsShipping && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-[#2d3436]">Select Billing Address</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr._id}
                      type="button"
                      onClick={() => setBillingAddressId(addr._id)}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left text-sm transition-all",
                        billingAddressId === addr._id
                          ? "border-[#c8a96e] bg-[#c8a96e]/5"
                          : "border-gray-100 hover:border-gray-300"
                      )}
                    >
                      <p className="font-medium text-[#1a1f36]">{addr.fullName}</p>
                      <p className="text-gray-600">
                        {addr.addressLine1}, {addr.city} - {addr.pincode}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            onClick={() => setCurrentStep(2)}
            disabled={!selectedAddressId}
          >
            Continue to Payment
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {/* Add Address Dialog */}
        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>Enter your delivery address details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addressForm.handleSubmit(handleSaveAddress)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...addressForm.register("fullName")}
                    className="mt-1"
                    placeholder="John Doe"
                  />
                  {addressForm.formState.errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    {...addressForm.register("phone")}
                    className="mt-1"
                    placeholder="9876543210"
                  />
                  {addressForm.formState.errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  {...addressForm.register("addressLine1")}
                  className="mt-1"
                  placeholder="House no, building, street"
                />
                {addressForm.formState.errors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.addressLine1.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  {...addressForm.register("addressLine2")}
                  className="mt-1"
                  placeholder="Landmark, area (optional)"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...addressForm.register("city")}
                    className="mt-1"
                    placeholder="Mumbai"
                  />
                  {addressForm.formState.errors.city && (
                    <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...addressForm.register("state")}
                    className="mt-1"
                    placeholder="Maharashtra"
                  />
                  {addressForm.formState.errors.state && (
                    <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    {...addressForm.register("pincode")}
                    className="mt-1"
                    placeholder="400001"
                    maxLength={6}
                  />
                  {addressForm.formState.errors.pincode && (
                    <p className="mt-1 text-xs text-red-500">{addressForm.formState.errors.pincode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Address Type</Label>
                <div className="mt-2 flex gap-2">
                  {(["HOME", "WORK", "OTHER"] as const).map((type) => {
                    const TypeIcon = typeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addressForm.setValue("type", type)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          addressForm.watch("type") === type
                            ? "border-[#1a1f36] bg-[#1a1f36] text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                        )}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddressDialogOpen(false);
                    addressForm.reset({ type: "HOME" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingAddress}>
                  {isSavingAddress && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Save Address
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Step 2: Review & Pay
  function renderPaymentStep() {
    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    return (
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Order Details */}
        <div className="lg:col-span-3">
          <button
            onClick={() => setCurrentStep(1)}
            className="mb-4 text-sm text-[#c8a96e] transition-colors hover:underline"
          >
            &larr; Back to Address
          </button>

          {/* Delivery Address Summary */}
          {selectedAddress && (
            <div className="mb-6 rounded-lg border border-gray-100 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#1a1f36]">Delivering to</h3>
              <p className="text-sm font-medium text-[#2d3436]">{selectedAddress.fullName}</p>
              <p className="text-sm text-gray-600">
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 && `, ${selectedAddress.addressLine2}`},
                {" "}{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </p>
              <p className="text-sm text-gray-500">{selectedAddress.phone}</p>
            </div>
          )}

          {/* Items */}
          <div className="rounded-lg border border-gray-100 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#1a1f36]">
              Order Items ({items.length})
            </h3>
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-50">
                    <img
                      src={item.variant.images?.[0] || item.product.thumbnail}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1a1f36]">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.variant.size} &middot; {item.variant.color} &middot; Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#1a1f36]">
                    {formatPrice(item.variant.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="mt-4">
            <Label htmlFor="notes" className="text-sm">
              Order Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="mt-1.5"
              placeholder="Special instructions for your order..."
              rows={3}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#1a1f36]">Order Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={cn("font-medium", shippingCost === 0 ? "text-green-600" : "")}>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>

              <Separator />

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="rounded-md bg-green-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="h-8 text-xs uppercase"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplyingCoupon}
                    className="h-8 text-xs"
                  >
                    Apply
                  </Button>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(0)}</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-base font-bold text-[#1a1f36]">Total</span>
                <span className="text-lg font-bold text-[#1a1f36]">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatPrice(total)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  function renderConfirmationStep() {
    return (
      <div className="mx-auto max-w-lg text-center">
        {/* Success Animation */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-40" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600 animate-in zoom-in-50 duration-500" />
          </div>
        </div>

        {/* Confetti dots */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: ["#c8a96e", "#1a1f36", "#22c55e", "#f59e0b", "#3b82f6"][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes confetti-fall {
            0% { opacity: 1; transform: translateY(-20px) rotate(0deg) scale(0); }
            50% { opacity: 1; transform: translateY(10px) rotate(180deg) scale(1); }
            100% { opacity: 0; transform: translateY(40px) rotate(360deg) scale(0.5); }
          }
        `}</style>

        <h1 className="mb-2 text-2xl font-bold text-[#1a1f36]">Order Placed Successfully!</h1>
        <p className="mb-1 text-gray-600">Thank you for your purchase.</p>

        {orderResult && (
          <div className="mx-auto mt-6 max-w-sm rounded-lg border border-gray-100 bg-gray-50 p-5">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Package className="h-5 w-5 text-[#c8a96e]" />
              <span className="text-sm font-medium text-gray-500">Order Number</span>
            </div>
            <p className="mb-4 text-xl font-bold tracking-wide text-[#1a1f36]">
              {orderResult.orderNumber}
            </p>
            <Separator className="mb-4" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-bold text-[#1a1f36]">{formatPrice(orderResult.total)}</span>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            <Truck className="mr-1.5 inline h-4 w-4" />
            Estimated delivery: 5-7 business days
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link to="/account/orders">View Order</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 3) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-lg font-semibold text-[#1a1f36]">Your cart is empty</h2>
          <p className="mb-6 text-sm text-gray-500">Add items to your cart before checking out.</p>
          <Button asChild>
            <Link to="/">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <StepIndicator />
      {currentStep === 1 && renderAddressStep()}
      {currentStep === 2 && renderPaymentStep()}
      {currentStep === 3 && renderConfirmationStep()}
    </div>
  );
}
