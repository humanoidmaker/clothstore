import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  User as UserIcon,
  Phone,
  Mail,
  Loader2,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import type { Order, User, OrderStatus } from "@/types";

interface StatusHistoryEntry {
  status: string;
  note?: string;
  changedAt: string;
  changedBy?: string;
}

interface OrderDetailData extends Order {
  statusHistory?: StatusHistoryEntry[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

const STATUS_FLOW: Record<string, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "delivered":
      return "success" as const;
    case "shipped":
    case "out_for_delivery":
      return "accent" as const;
    case "processing":
    case "confirmed":
      return "default" as const;
    case "pending":
      return "warning" as const;
    case "cancelled":
    case "returned":
    case "refunded":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case "paid":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
      return "destructive" as const;
    case "refunded":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
};

const timelineIcons: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  returned: RefreshCcw,
  refunded: RefreshCcw,
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: order, isLoading } = useQuery<OrderDetailData>({
    queryKey: ["admin-order", id],
    queryFn: () => apiGet(`/admin/orders/${id}`),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: () =>
      apiPut(`/admin/orders/${id}/status`, {
        status: newStatus,
        note: statusNote || undefined,
      }),
    onSuccess: () => {
      toast.success("Order status updated.");
      setNewStatus("");
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => toast.error("Failed to update status."),
  });

  const refundMutation = useMutation({
    mutationFn: () => apiPost(`/payments/refund`, { orderId: id }),
    onSuccess: () => {
      toast.success("Refund initiated.");
      setRefundOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: () => toast.error("Failed to initiate refund."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">Order not found.</p>
        <Link to="/admin/orders" className="mt-4">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const user = order.user as User | null;
  const nextStatuses = STATUS_FLOW[order.status] ?? [];
  const canRefund = order.paymentStatus === "paid" && order.paymentMethod !== "cod";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f36]">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(order.status)} className="text-sm">
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
          <Badge variant={paymentBadgeVariant(order.paymentStatus)} className="text-sm">
            {order.paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#1a1f36]">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Size: {item.size} / Color: {item.color}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.coupon && `(${order.coupon})`}</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold text-[#1a1f36]">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          {nextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => updateStatusMutation.mutate()}
                    disabled={!newStatus || updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Status
                  </Button>
                </div>
                <div>
                  <Label>Note (optional)</Label>
                  <Textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="mt-1"
                    placeholder="Add a note about this status change..."
                    rows={3}
                  />
                </div>
                {canRefund && (
                  <Button
                    variant="destructive"
                    onClick={() => setRefundOpen(true)}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Initiate Refund
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {order.statusHistory.map((entry, i) => {
                    const Icon = timelineIcons[entry.status] || Clock;
                    const isLast = i === order.statusHistory!.length - 1;
                    return (
                      <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Vertical line */}
                        {!isLast && (
                          <div className="absolute left-[15px] top-8 h-full w-0.5 bg-gray-200" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            isLast
                              ? "bg-[#1a1f36] text-white"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="pt-0.5">
                          <p className="font-medium capitalize text-[#1a1f36]">
                            {entry.status.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(entry.changedAt, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {entry.note && (
                            <p className="mt-1 text-sm text-gray-600">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Customer info unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.pincode}
                  </p>
                  <p className="text-gray-500">{order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No shipping address.</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={paymentBadgeVariant(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Razorpay Order</span>
                  <span className="font-mono text-xs">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Razorpay Payment</span>
                  <span className="font-mono text-xs">{order.razorpayPaymentId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Tracking */}
          {order.trackingId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking ID</span>
                  <span className="font-mono">{order.trackingId}</span>
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[#c8a96e] underline"
                  >
                    Track Shipment
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Refund</DialogTitle>
            <DialogDescription>
              This will initiate a refund of {formatPrice(order.total)} to the customer's
              original payment method. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={refundMutation.isPending}
              onClick={() => refundMutation.mutate()}
            >
              {refundMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
