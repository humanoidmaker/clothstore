import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, PaginatedResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";

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

const filterTabs = [
  { value: "all", label: "All" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AccountOrders() {
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", activeTab],
    queryFn: () =>
      apiGet<PaginatedResponse<Order>>("/orders/my", {
        limit: 50,
        page: 1,
        sort: "-createdAt",
        ...(activeTab !== "all" && { status: activeTab }),
      }),
  });

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">My Orders</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap">
          {filterTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {filterTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title={
                  activeTab === "all"
                    ? "No Orders Yet"
                    : `No ${formatStatus(activeTab)} Orders`
                }
                description={
                  activeTab === "all"
                    ? "You haven't placed any orders yet. Start shopping to see your orders here."
                    : `You don't have any orders with status "${formatStatus(activeTab)}".`
                }
                ctaLabel={activeTab === "all" ? "Start Shopping" : undefined}
                ctaHref={activeTab === "all" ? "/" : undefined}
              />
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#1a1f36]">
              {order.orderNumber}
            </span>
            <span className="text-sm text-gray-400">
              {formatDate(order.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[order.status] ?? "secondary"}>
              {formatStatus(order.status)}
            </Badge>
            <Badge variant={paymentVariant[order.paymentStatus] ?? "secondary"}>
              {formatStatus(order.paymentStatus)}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-50 px-5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 py-3">
              <img
                src={item.image}
                alt={item.name}
                className="h-14 w-14 shrink-0 rounded-md border border-gray-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1a1f36]">
                  {item.name}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
              <p className="shrink-0 text-sm font-medium text-[#1a1f36]">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <div>
            <span className="text-sm text-gray-500">Total: </span>
            <span className="font-bold text-[#1a1f36]">
              {formatPrice(order.total)}
            </span>
          </div>
          <Link to={`/account/orders/${order._id}`}>
            <Button variant="outline" size="sm" className="gap-1">
              View Details <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
