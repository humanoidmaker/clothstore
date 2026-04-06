import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Loader2,
  Percent,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import type { Coupon } from "@/types";

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(30)
    .transform((v) => v.toUpperCase()),
  description: z.string().max(200).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(1, "Value must be > 0"),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  validFrom: z.string().min(1, "Start date required"),
  validUntil: z.string().min(1, "End date required"),
  isActive: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function Coupons() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => apiGet("/admin/coupons"),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
      validFrom: "",
      validUntil: "",
      isActive: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CouponFormValues) => {
      const payload = {
        ...data,
        minimumAmount: data.minOrderValue || 0,
        maximumDiscount: data.maxDiscount || undefined,
      };
      if (editingCoupon) {
        return apiPut(`/coupons/${editingCoupon._id}`, payload);
      }
      return apiPost("/coupons", payload);
    },
    onSuccess: () => {
      toast.success(editingCoupon ? "Coupon updated." : "Coupon created.");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeDialog();
    },
    onError: () => toast.error("Failed to save coupon."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: () => toast.error("Failed to delete coupon."),
  });

  function openAdd() {
    setEditingCoupon(null);
    reset({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 0,
      validFrom: "",
      validUntil: "",
      isActive: true,
    });
    setDialogOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue ?? 0,
      maxDiscount: coupon.maxDiscount ?? 0,
      usageLimit: coupon.usageLimit ?? 0,
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : "",
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : "",
      isActive: coupon.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingCoupon(null);
    reset();
  }

  function isExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  function getUsagePercent(coupon: Coupon): number {
    if (!coupon.usageLimit || coupon.usageLimit === 0) return 0;
    return Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">Coupons</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !coupons || coupons.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No coupons"
              description="Create your first coupon to offer discounts."
              ctaLabel="Create Coupon"
              onCtaClick={openAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Min Amount</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Max Discount</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Usage</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Valid Period</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon);
                    const usagePercent = getUsagePercent(coupon);
                    return (
                      <tr
                        key={coupon._id}
                        className={cn("hover:bg-gray-50", expired && "opacity-60")}
                      >
                        <td className="px-4 py-3">
                          <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-[#1a1f36]">
                            {coupon.code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {coupon.discountType === "percentage" ? (
                              <Percent className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                            )}
                            <span className="capitalize">{coupon.discountType}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : formatPrice(coupon.discountValue)}
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {coupon.minOrderValue
                            ? formatPrice(coupon.minOrderValue)
                            : "-"}
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {coupon.maxDiscount
                            ? formatPrice(coupon.maxDiscount)
                            : "-"}
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500">
                              {coupon.usedCount}/{coupon.usageLimit || "Unlimited"}
                            </span>
                            {coupon.usageLimit > 0 && (
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    usagePercent >= 90
                                      ? "bg-red-500"
                                      : usagePercent >= 70
                                      ? "bg-amber-500"
                                      : "bg-[#1a1f36]"
                                  )}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-xs md:table-cell">
                          <div>
                            {formatDate(coupon.validFrom)} —
                          </div>
                          <div>{formatDate(coupon.validUntil)}</div>
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <Badge variant="secondary">Expired</Badge>
                          ) : coupon.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="warning">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(coupon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(coupon)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                {...register("code")}
                className="mt-1 font-mono uppercase"
                placeholder="SUMMER20"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coupon-desc">Description</Label>
              <Input
                id="coupon-desc"
                {...register("description")}
                className="mt-1"
                placeholder="Summer sale discount"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Controller
                  control={control}
                  name="discountType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="coupon-value">Discount Value</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  {...register("discountValue")}
                  className="mt-1"
                  min={0}
                />
                {errors.discountValue && (
                  <p className="mt-1 text-xs text-red-500">{errors.discountValue.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-min">Minimum Amount (paise)</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  {...register("minOrderValue")}
                  className="mt-1"
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="coupon-max">Max Discount (paise)</Label>
                <Input
                  id="coupon-max"
                  type="number"
                  {...register("maxDiscount")}
                  className="mt-1"
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coupon-limit">Usage Limit (0 = unlimited)</Label>
              <Input
                id="coupon-limit"
                type="number"
                {...register("usageLimit")}
                className="mt-1"
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-from">Valid From</Label>
                <Input
                  id="coupon-from"
                  type="date"
                  {...register("validFrom")}
                  className="mt-1"
                />
                {errors.validFrom && (
                  <p className="mt-1 text-xs text-red-500">{errors.validFrom.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="coupon-until">Valid Until</Label>
                <Input
                  id="coupon-until"
                  type="date"
                  {...register("validUntil")}
                  className="mt-1"
                />
                {errors.validUntil && (
                  <p className="mt-1 text-xs text-red-500">{errors.validUntil.message}</p>
                )}
              </div>
            </div>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  <Label>Active</Label>
                </div>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCoupon ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete coupon "{deleteTarget?.code}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
