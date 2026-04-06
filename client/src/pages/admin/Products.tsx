import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { apiGet, apiPut, apiDelete } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, Category, PaginatedResponse } from "@/types";

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<"delete" | "activate" | "deactivate" | null>(null);
  const limit = 15;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["admin-categories-list"],
    queryFn: () => apiGet("/categories"),
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin-products", page, search, categoryFilter, statusFilter],
    queryFn: () =>
      apiGet("/admin/products", {
        page,
        limit,
        search: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined,
      }),
  });

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: string; value: boolean }) =>
      apiPut(`/products/${id}`, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to update product."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete product."),
  });

  const bulkMutation = useMutation({
    mutationFn: async (action: "delete" | "activate" | "deactivate") => {
      const ids = Array.from(selected);
      if (action === "delete") {
        await Promise.all(ids.map((id) => apiDelete(`/products/${id}`)));
      } else {
        const isActive = action === "activate";
        await Promise.all(ids.map((id) => apiPut(`/products/${id}`, { isActive })));
      }
    },
    onSuccess: () => {
      toast.success("Bulk action completed.");
      setSelected(new Set());
      setBulkAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Bulk action failed."),
  });

  const allSelected = products.length > 0 && products.every((p) => selected.has(p._id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p._id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function getTotalStock(product: Product): number {
    return product.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">Products</h1>
        <Link to="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#1a1f36]/20 bg-[#1a1f36]/5 px-4 py-3">
          <span className="text-sm font-medium text-[#1a1f36]">
            {selected.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAction("activate")}
          >
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAction("deactivate")}
          >
            Deactivate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkAction("delete")}
          >
            Delete Selected
          </Button>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No products found"
              description="Try adjusting your filters or add your first product."
              ctaLabel="Add Product"
              ctaHref="/admin/products/new"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Category</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Stock</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Featured</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => {
                    const cat =
                      typeof product.category === "object"
                        ? (product.category as Category)?.name
                        : "";
                    const stock = getTotalStock(product);
                    return (
                      <tr
                        key={product._id}
                        className={cn(
                          "hover:bg-gray-50",
                          selected.has(product._id) && "bg-blue-50/50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(product._id)}
                            onCheckedChange={() => toggleOne(product._id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.thumbnail || product.images?.[0] || "/placeholder.png"}
                              alt={product.name}
                              className="h-10 w-10 rounded-md border object-cover"
                            />
                            <span className="font-medium text-[#1a1f36]">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {cat && <Badge variant="secondary">{cat}</Badge>}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(product.variants[0]?.price ?? 0)}
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span
                            className={cn(
                              "font-medium",
                              stock === 0
                                ? "text-red-600"
                                : stock < 10
                                ? "text-amber-600"
                                : "text-[#2d3436]"
                            )}
                          >
                            {stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({
                                id: product._id,
                                field: "isActive",
                                value: checked,
                              })
                            }
                          />
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <Switch
                            checked={product.isFeatured}
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({
                                id: product._id,
                                field: "isFeatured",
                                value: checked,
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/admin/products/${product._id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteTarget({
                                  id: product._id,
                                  name: product.name,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
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
            Page {page} of {totalPages} ({data?.total ?? 0} products)
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

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirm Dialog */}
      <Dialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              {bulkAction === "delete"
                ? `Are you sure you want to delete ${selected.size} product(s)? This cannot be undone.`
                : `Are you sure you want to ${bulkAction} ${selected.size} product(s)?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBulkAction(null)}>
              Cancel
            </Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              disabled={bulkMutation.isPending}
              onClick={() => bulkAction && bulkMutation.mutate(bulkAction)}
            >
              {bulkMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
