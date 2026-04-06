import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Heart,
  MapPin,
  UserPen,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { apiGet } from "@/lib/api";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import type { Order, ApiResponse, PaginatedResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AccountDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["account-orders-summary"],
    queryFn: () =>
      apiGet<PaginatedResponse<Order>>("/orders/my", {
        limit: 3,
        page: 1,
        sort: "-createdAt",
      }),
  });

  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ["account-wishlist-count"],
    queryFn: () => apiGet<ApiResponse<{ count: number }>>("/wishlist/count"),
  });

  const totalOrders = ordersData?.total ?? 0;
  const wishlistCount = wishlistData?.data?.count ?? user?.wishlist?.length ?? 0;
  const addressCount = user?.addresses?.length ?? 0;
  const recentOrders = ordersData?.data ?? [];

  const stats = [
    { label: "Total Orders", value: totalOrders, icon: Package, href: "/account/orders", color: "bg-blue-50 text-blue-600" },
    { label: "Wishlist Items", value: wishlistCount, icon: Heart, href: "/account/wishlist", color: "bg-pink-50 text-pink-600" },
    { label: "Saved Addresses", value: addressCount, icon: MapPin, href: "/account/addresses", color: "bg-green-50 text-green-600" },
  ];

  const quickActions = [
    { label: "Edit Profile", description: "Update your personal information", icon: UserPen, href: "/account/profile" },
    { label: "Manage Addresses", description: "Add or edit delivery addresses", icon: MapPin, href: "/account/addresses" },
    { label: "View Wishlist", description: "Browse your saved items", icon: Heart, href: "/account/wishlist" },
  ];

  const isLoading = ordersLoading || wishlistLoading;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's a quick overview of your account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) =>
          isLoading ? (
            <Skeleton key={stat.label} className="h-24 rounded-lg" />
          ) : (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:border-[#c8a96e]/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      stat.color
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1a1f36]">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Link to="/account/orders">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No orders yet</p>
              <Link to="/" className="mt-3">
                <Button variant="accent" size="sm">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="pb-3 pr-4">Order #</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4 text-right">Total</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="group">
                      <td className="py-3 pr-4 font-medium text-[#1a1f36]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[order.status] ?? "secondary"}>
                          {formatStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/account/orders/${order._id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1a1f36]">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card className="group h-full cursor-pointer hover:border-[#c8a96e]/40">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a1f36]/5">
                    <action.icon className="h-5 w-5 text-[#1a1f36]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1f36] group-hover:text-[#c8a96e]">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
