import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Home,
  Briefcase,
  Star,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { Address, ApiResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";

const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  addressLine1: z.string().min(1, "Address line 1 is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  type: z.enum(["home", "work", "other"]),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const addressTypeIcons: Record<string, React.ReactNode> = {
  home: <Home className="h-3.5 w-3.5" />,
  work: <Briefcase className="h-3.5 w-3.5" />,
  other: <MapPin className="h-3.5 w-3.5" />,
};

export default function AccountAddresses() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiGet<ApiResponse<Address[]>>("/addresses"),
  });

  const addresses = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      type: "home",
      isDefault: false,
    },
  });

  const openAddDialog = () => {
    setEditingAddress(null);
    reset({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      type: "home",
      isDefault: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (addr: Address) => {
    setEditingAddress(addr);
    reset({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      type: (addr as Address & { type?: string }).type as "home" | "work" | "other" ?? "home",
      isDefault: addr.isDefault,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: AddressFormValues) => {
      if (editingAddress) {
        return apiPut<ApiResponse<Address>>(
          `/addresses/${editingAddress._id}`,
          data
        );
      }
      return apiPost<ApiResponse<Address>>("/addresses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setDialogOpen(false);
      toast.success(
        editingAddress ? "Address updated" : "Address added"
      );
    },
    onError: () => {
      toast.error("Failed to save address");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<ApiResponse<null>>(`/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setDeleteId(null);
      toast.success("Address deleted");
    },
    onError: () => {
      toast.error("Failed to delete address");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      apiPut<ApiResponse<Address>>(`/addresses/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Default address updated");
    },
    onError: () => {
      toast.error("Failed to set default address");
    },
  });

  const onSubmit = (data: AddressFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">My Addresses</h1>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Addresses Saved"
          description="Add a delivery address to speed up checkout."
          ctaLabel="Add Address"
          onCtaClick={openAddDialog}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr._id} className="relative">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1a1f36]">
                      {addr.fullName}
                    </p>
                    {(addr as Address & { type?: string }).type && (
                      <Badge variant="secondary" className="gap-1 capitalize">
                        {addressTypeIcons[(addr as Address & { type?: string }).type ?? "other"]}
                        {(addr as Address & { type?: string }).type}
                      </Badge>
                    )}
                    {addr.isDefault && (
                      <Badge variant="accent" className="gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600">{addr.phone}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-gray-600"
                    onClick={() => openEditDialog(addr)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setDeleteId(addr._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto gap-1.5 text-[#c8a96e]"
                      onClick={() => setDefaultMutation.mutate(addr._id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Set as Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your delivery address details."
                : "Enter your delivery address details."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Full name"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="10-digit number"
                  maxLength={10}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                {...register("addressLine1")}
                placeholder="House no., building, street"
              />
              {errors.addressLine1 && (
                <p className="text-xs text-red-500">
                  {errors.addressLine1.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                {...register("addressLine2")}
                placeholder="Landmark, area"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} placeholder="City" />
                {errors.city && (
                  <p className="text-xs text-red-500">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="State"
                />
                {errors.state && (
                  <p className="text-xs text-red-500">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  {...register("pincode")}
                  placeholder="6-digit"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-xs text-red-500">
                    {errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Address Type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-end pb-2">
                <Controller
                  control={control}
                  name="isDefault"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isDefault"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="isDefault" className="cursor-pointer">
                        Set as default address
                      </Label>
                    </div>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingAddress ? (
                  "Update Address"
                ) : (
                  "Add Address"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
