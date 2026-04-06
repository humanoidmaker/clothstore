import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Circle,
  Truck,
  Package,
  ClipboardCheck,
  ShoppingCart,
  XCircle,
  Download,
  Loader2,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPut } from "@/lib/api";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import type { Order, ApiResponse, OrderStatus } from "@/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "accent"> = {
  pending: "warning",
  confirmed: "accent",
  processing: "secondary",
  shipped: "default",
  out_for_delivery: "default",
  delivered: "success",
  cancelled: "destructive",
  returned: "destructive",
  refunded: "warning",
};

const paymentVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "secondary",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Timeline steps in order
const timelineSteps: {
  key: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "pending", label: "Order Placed", icon: ShoppingCart },
  { key: "confirmed", label: "Confirmed", icon: ClipboardCheck },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Check },
];

const statusOrder: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiGet<ApiResponse<Order>>(`/orders/${id}`),
    enabled: !!id,
  });

  const order = data?.data;

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiPut<ApiResponse<Order>>(`/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      setCancelOpen(false);
      toast.success("Order cancelled successfully");
    },
    onError: () => {
      toast.error("Failed to cancel order");
    },
  });

  const handleDownloadInvoice = () => {
    window.open(`/api/orders/${id}/invoice`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center py-16">
        <AlertTriangle className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-[#1a1f36]">Order not found</p>
        <p className="mt-1 text-sm text-gray-500">
          The order you are looking for does not exist.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/account/orders")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const canCancel =
    order.status === "pending" || order.status === "confirmed";

  // Determine the index up to which the timeline is complete
  const currentStepIndex = statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed on{" "}
            {formatDate(order.createdAt, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={statusVariant[order.status] ?? "secondary"}
            className="text-sm"
          >
            {formatStatus(order.status)}
          </Badge>
          <Badge
            variant={paymentVariant[order.paymentStatus] ?? "secondary"}
            className="text-sm"
          >
            Payment: {formatStatus(order.paymentStatus)}
          </Badge>
        </div>
      </div>

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {timelineSteps.map((step, index) => {
              const stepIndex = statusOrder.indexOf(step.key);
              const isCompleted = !isCancelled && stepIndex <= currentStepIndex;
              const isCurrent = !isCancelled && stepIndex === currentStepIndex;
              const isCancelledStep =
                isCancelled && stepIndex === currentStepIndex;
              const isLast = index === timelineSteps.length - 1;

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isCancelledStep
                          ? "border-red-500 bg-red-50 text-red-500"
                          : isCompleted
                            ? "border-[#c8a96e] bg-[#c8a96e] text-white"
                            : "border-gray-200 bg-white text-gray-300"
                      )}
                    >
                      {isCancelledStep ? (
                        <XCircle className="h-4.5 w-4.5" />
                      ) : isCompleted ? (
                        <step.icon className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-[2rem]",
                          isCompleted && stepIndex < currentStepIndex
                            ? "bg-[#c8a96e]"
                            : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <p
                      className={cn(
                        "mt-1.5 text-sm font-medium",
                        isCancelledStep
                          ? "text-red-600"
                          : isCompleted
                            ? "text-[#1a1f36]"
                            : "text-gray-400"
                      )}
                    >
                      {isCancelledStep ? "Cancelled" : step.label}
                      {isCurrent && !isCancelled && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#c8a96e] animate-pulse" />
                      )}
                    </p>
                    {isCancelledStep && order.cancelReason && (
                      <p className="mt-0.5 text-xs text-red-400">
                        Reason: {order.cancelReason}
                      </p>
                    )}
                    {step.key === "delivered" && order.deliveredAt && isCompleted && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(order.deliveredAt, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Size</th>
                  <th className="pb-3 pr-4">Color</th>
                  <th className="pb-3 pr-4 text-center">Qty</th>
                  <th className="pb-3 pr-4 text-right">Price</th>
                  <th className="pb-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-md border border-gray-100 object-cover"
                        />
                        <span className="font-medium text-[#1a1f36]">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.size || "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.color || "-"}
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-600">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3 text-right font-medium text-[#1a1f36]">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Price Breakdown */}
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span>
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span className="text-[#1a1f36]">Total</span>
              <span className="text-[#1a1f36]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium text-[#1a1f36]">
            {order.shippingAddress.fullName}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {order.shippingAddress.phone}
          </p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 &&
              `, ${order.shippingAddress.addressLine2}`}
          </p>
          <p className="text-sm text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
            {order.shippingAddress.pincode}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleDownloadInvoice}
        >
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>

        {canCancel && (
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </Button>
        )}

        {order.trackingUrl && (
          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="accent" className="gap-2">
              <Truck className="h-4 w-4" />
              Track Shipment
            </Button>
          </a>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {order.orderNumber}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
