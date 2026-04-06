import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import type { Order, Product } from "@/types";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RevenueDataPoint {
  label: string;
  revenue: number;
}

interface LowStockItem {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  stock: number;
}

interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
}

interface DashboardData {
  stats: DashboardStats;
  revenueChart: Record<string, RevenueDataPoint[]>;
  recentOrders: Order[];
  lowStock: LowStockItem[];
  topProducts: TopProduct[];
}

type Period = "7d" | "30d" | "12m";

const periodLabels: Record<Period, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "12m": "12 Months",
};

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "destructive";
    case "refunded":
      return "secondary";
    default:
      return "outline";
  }
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
    case "out_for_delivery":
      return "accent";
    case "processing":
    case "confirmed":
      return "default";
    case "pending":
      return "warning";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("7d");

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiGet("/admin/dashboard"),
  });

  const stats = data?.stats;
  const revenueData = data?.revenueChart?.[period] ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const lowStock = data?.lowStock ?? [];
  const topProducts = data?.topProducts ?? [];

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatPrice(stats.totalRevenue) : "--",
      icon: DollarSign,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders?.toLocaleString("en-IN") ?? "--",
      icon: ShoppingCart,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Customers",
      value: stats?.totalCustomers?.toLocaleString("en-IN") ?? "--",
      icon: Users,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Total Products",
      value: stats?.totalProducts?.toLocaleString("en-IN") ?? "--",
      icon: Package,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) =>
          isLoading ? (
            <Card key={card.label} className="p-6">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ) : (
            <Card key={card.label} className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                    card.bg
                  )}
                >
                  <card.icon className={cn("h-6 w-6", card.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="truncate text-xl font-bold text-[#1a1f36]">
                    {card.value}
                  </p>
                </div>
              </div>
            </Card>
          )
        )}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Revenue Overview</CardTitle>
          <div className="flex gap-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 100).toLocaleString("en-IN")}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [formatPrice(value), "Revenue"]}
                />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8a96e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c8a96e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1a1f36"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#1a1f36", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#c8a96e", strokeWidth: 0 }}
                  fill="url(#revenueGrad)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders + Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Order #</th>
                      <th className="pb-2 font-medium">Customer</th>
                      <th className="hidden pb-2 font-medium sm:table-cell">Date</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Payment</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map((order) => {
                      const user = order.user as { firstName?: string; lastName?: string } | string;
                      const customerName =
                        typeof user === "object" && user
                          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                          : "N/A";
                      return (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="py-2.5 font-mono text-xs">
                            {order.orderNumber}
                          </td>
                          <td className="py-2.5">{customerName}</td>
                          <td className="hidden py-2.5 sm:table-cell">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-2.5 font-medium">
                            {formatPrice(order.total)}
                          </td>
                          <td className="py-2.5">
                            <Badge variant={statusBadgeVariant(order.status)}>
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <Badge variant={paymentBadgeVariant(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <Link to={`/admin/orders/${order._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
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

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
            <Link to="/admin/products">
              <Button variant="ghost" size="sm">
                View Products
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                All products are well stocked.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-4 py-3",
                      item.stock === 0
                        ? "border-red-200 bg-red-50"
                        : item.stock < 5
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200"
                    )}
                  >
                    <div>
                      <p className="font-medium text-[#1a1f36]">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.size} / {item.color}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          item.stock === 0 ? "text-red-500" : "text-amber-500"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          item.stock === 0 ? "text-red-600" : "text-amber-600"
                        )}
                      >
                        {item.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No sales data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12, fill: "#2d3436" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value: number) => [value, "Units Sold"]}
                />
                <Bar
                  dataKey="unitsSold"
                  fill="#1a1f36"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
