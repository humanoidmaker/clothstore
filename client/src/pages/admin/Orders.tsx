import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { apiGet } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, User, PaginatedResponse } from "@/types";

const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;

const PAYMENT_STATUSES = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;

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

export default function Orders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const limit = 15;

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders", page, search, status, paymentStatus, dateFrom, dateTo],
    queryFn: () =>
      apiGet("/admin/orders", {
        page,
        limit,
        search: search || undefined,
        status: status !== "ALL" ? status.toLowerCase() : undefined,
        paymentStatus: paymentStatus !== "ALL" ? paymentStatus.toLowerCase() : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const orders = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">Orders</h1>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by order # or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={paymentStatus}
              onValueChange={(v) => {
                setPaymentStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All Payments" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden"
            >
              <Filter className="mr-1 h-4 w-4" /> Dates
            </Button>
          </div>

          {/* Date range — visible on sm+ always, toggle on mobile */}
          <div className={`mt-3 flex gap-3 ${showFilters ? "" : "hidden sm:flex"}`}>
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm text-gray-500">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm text-gray-500">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders found"
              description="Try adjusting your filters or check back later."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Date</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => {
                    const user = order.user as User | string;
                    const customerName =
                      typeof user === "object" && user
                        ? `${user.firstName} ${user.lastName}`
                        : "N/A";
                    const customerEmail =
                      typeof user === "object" && user ? user.email : "";
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-[#1a1f36]">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{customerName}</p>
                            {customerEmail && (
                              <p className="text-xs text-gray-500">{customerEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {order.items.length}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={paymentBadgeVariant(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(order.status)}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/orders/${order._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-1 h-4 w-4" /> View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({data?.total ?? 0} orders)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
