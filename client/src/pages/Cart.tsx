import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, X, Minus, Plus, Trash2, Tag, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/stores/cartStore";
import { apiGet } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ApiResponse, Coupon } from "@/types";

const FREE_SHIPPING_THRESHOLD = 99900; // 999 rupees in paise
const SHIPPING_COST = 9900; // 99 rupees in paise

export default function Cart() {
  const navigate = useNavigate();
  const { items, isLoading, fetchCart, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartSubtotal = subtotal();
  const shippingCost = cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = appliedCoupon?.discount ?? 0;
  const total = cartSubtotal + shippingCost - discount;

  async function handleQuantityChange(itemId: string, newQty: number) {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQty);
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await removeItem(itemId);
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  }

  async function handleClearCart() {
    try {
      await clearCart();
      setAppliedCoupon(null);
      setCouponCode("");
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
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
      toast.success("Coupon applied successfully!");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Invalid coupon code";
      toast.error(message);
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-5 w-48" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 rounded-lg border border-gray-100 bg-white p-4">
                <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-4 h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs items={[{ label: "Shopping Cart" }]} className="mb-6" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet. Start shopping to find something you love!"
          ctaLabel="Continue Shopping"
          ctaHref="/"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Shopping Cart" }]} className="mb-6" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">
          Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
        </h1>
        <button
          onClick={handleClearCart}
          className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const isUpdating = updatingItems.has(item._id);
            const lowStock = item.variant.stock > 0 && item.variant.stock <= 5;
            return (
              <div
                key={item._id}
                className={cn(
                  "relative flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-opacity",
                  isUpdating && "opacity-60"
                )}
              >
                {/* Thumbnail */}
                <Link
                  to={`/products/${item.product.slug}`}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50"
                >
                  <img
                    src={item.variant.images?.[0] || item.product.thumbnail}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-medium text-[#1a1f36] transition-colors hover:text-[#c8a96e]"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.variant.size}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {item.variant.colorHex && (
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.variant.colorHex }}
                          />
                        )}
                        <span className="text-xs text-gray-500">{item.variant.color}</span>
                      </div>
                    </div>
                    {lowStock && (
                      <Badge variant="warning" className="mt-1.5 text-[10px]">
                        Only {item.variant.stock} left
                      </Badge>
                    )}
                    <p className="mt-1.5 text-sm font-semibold text-[#1a1f36] sm:hidden">
                      {formatPrice(item.variant.price)}
                    </p>
                  </div>

                  {/* Price & Quantity */}
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                    <p className="hidden text-sm font-semibold text-[#1a1f36] sm:block">
                      {formatPrice(item.variant.price)}
                    </p>

                    {/* Quantity Stepper */}
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                        className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-[#1a1f36]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.variant.stock || isUpdating}
                        className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-[#1a1f36]">
                      {formatPrice(item.variant.price * item.quantity)}
                    </p>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item._id)}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove item"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1a1f36]">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-[#2d3436]">{formatPrice(cartSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={cn("font-medium", shippingCost === 0 ? "text-green-600" : "text-[#2d3436]")}>
                  {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-gray-400">
                  Free shipping on orders above {formatPrice(FREE_SHIPPING_THRESHOLD)}
                </p>
              )}

              <Separator />

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="rounded-md bg-green-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-green-600 transition-colors hover:bg-green-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-green-600">{appliedCoupon.description}</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="h-9 text-xs uppercase"
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplyingCoupon}
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Discount</span>
                  <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#1a1f36]">Total</span>
                <span className="text-lg font-bold text-[#1a1f36]">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={() => navigate("/checkout")}
              disabled={items.length === 0}
            >
              Proceed to Checkout
            </Button>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] text-gray-500">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] text-gray-500">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-gray-400" />
                <span className="text-[10px] text-gray-500">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
