import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { User, Order, PaginatedResponse } from "@/types";

interface CustomerData extends User {
  orderCount: number;
  totalSpent: number;
  recentOrders?: Order[];
}

export default function Customers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 15;

  const { data, isLoading } = useQuery<PaginatedResponse<CustomerData>>({
    queryKey: ["admin-customers", page, search, roleFilter],
    queryFn: () =>
      apiGet("/admin/customers", {
        page,
        limit,
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      }),
  });

  const customers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Fetch expanded customer details
  const { data: expandedCustomer } = useQuery<CustomerData>({
    queryKey: ["admin-customer-detail", expandedId],
    queryFn: () => apiGet(`/admin/customers/${expandedId}`),
    enabled: !!expandedId,
  });

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a1f36]">Customers</h1>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Try adjusting your search criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Email</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Phone</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Total Spent</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Joined</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <>
                      <tr
                        key={customer._id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpand(customer._id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1f36] text-xs font-semibold text-white">
                              {customer.firstName?.[0]?.toUpperCase() ?? ""}
                              {customer.lastName?.[0]?.toUpperCase() ?? ""}
                            </div>
                            <span className="font-medium text-[#1a1f36]">
                              {customer.firstName} {customer.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {customer.email}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {customer.orderCount ?? 0}
                        </td>
                        <td className="hidden px-4 py-3 font-medium sm:table-cell">
                          {formatPrice(customer.totalSpent ?? 0)}
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={customer.role === "admin" ? "accent" : "secondary"}
                          >
                            {customer.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm">
                            {expandedId === customer._id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedId === customer._id && (
                        <tr key={`${customer._id}-detail`}>
                          <td colSpan={8} className="bg-gray-50 px-6 py-4">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Recent Orders */}
                              <div>
                                <h4 className="mb-3 flex items-center gap-2 font-semibold text-[#1a1f36]">
                                  <ShoppingBag className="h-4 w-4" /> Recent Orders
                                </h4>
                                {expandedCustomer?.recentOrders &&
                                expandedCustomer.recentOrders.length > 0 ? (
                                  <div className="space-y-2">
                                    {expandedCustomer.recentOrders.slice(0, 5).map((order) => (
                                      <div
                                        key={order._id}
                                        className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
                                      >
                                        <div>
                                          <span className="font-mono text-xs">
                                            #{order.orderNumber}
                                          </span>
                                          <span className="ml-2 text-gray-500">
                                            {formatDate(order.createdAt)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {formatPrice(order.total)}
                                          </span>
                                          <Badge
                                            variant={
                                              order.status === "delivered"
                                                ? "success"
                                                : order.status === "cancelled"
                                                ? "destructive"
                                                : "secondary"
                                            }
                                          >
                                            {order.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">No orders yet.</p>
                                )}
                              </div>

                              {/* Addresses */}
                              <div>
                                <h4 className="mb-3 flex items-center gap-2 font-semibold text-[#1a1f36]">
                                  <MapPin className="h-4 w-4" /> Addresses
                                </h4>
                                {(expandedCustomer ?? customer).addresses.length > 0 ? (
                                  <div className="space-y-2">
                                    {(expandedCustomer ?? customer).addresses.map((addr) => (
                                      <div
                                        key={addr._id}
                                        className="rounded-md border bg-white px-3 py-2 text-sm"
                                      >
                                        <p className="font-medium">{addr.fullName}</p>
                                        <p className="text-gray-500">
                                          {addr.addressLine1}
                                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                                        </p>
                                        <p className="text-gray-500">
                                          {addr.city}, {addr.state} {addr.pincode}
                                        </p>
                                        {addr.isDefault && (
                                          <Badge variant="accent" className="mt-1">
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">No saved addresses.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
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
            Page {page} of {totalPages} ({data?.total ?? 0} customers)
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
