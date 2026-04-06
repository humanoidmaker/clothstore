import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  productCount?: number;
}

function buildTree(categories: CategoryWithChildren[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  categories.forEach((cat) => {
    map.set(cat._id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat._id)!;
    const parentId = typeof cat.parent === "object" ? (cat.parent as Category)?._id : cat.parent;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function CategoryRow({
  category,
  depth,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  category: CategoryWithChildren;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (cat: CategoryWithChildren) => void;
  onDelete: (cat: CategoryWithChildren) => void;
  onToggleActive: (id: string, value: boolean) => void;
}) {
  const hasChildren = (category.children?.length ?? 0) > 0;
  const isExpanded = expanded.has(category._id);

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggle(category._id)}
                className="mr-2 rounded p-0.5 hover:bg-gray-200"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="mr-2 w-5" />
            )}
            <div className="flex items-center gap-3">
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-8 w-8 rounded border object-cover"
                />
              )}
              <span className="font-medium text-[#1a1f36]">{category.name}</span>
            </div>
          </div>
        </td>
        <td className="hidden px-4 py-3 font-mono text-xs text-gray-500 md:table-cell">
          {category.slug}
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          {category.productCount ?? 0}
        </td>
        <td className="px-4 py-3">
          <Switch
            checked={category.isActive}
            onCheckedChange={(checked) => onToggleActive(category._id, checked)}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </td>
      </tr>
      {hasChildren &&
        isExpanded &&
        category.children!.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))}
    </>
  );
}

export default function Categories() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithChildren | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: categories, isLoading } = useQuery<CategoryWithChildren[]>({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet("/admin/categories"),
  });

  const tree = categories ? buildTree(categories) : [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      parentId: "",
      isActive: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        image: data.image || undefined,
        parent: data.parentId || undefined,
        isActive: data.isActive,
      };
      if (editingCategory) {
        return apiPut(`/categories/${editingCategory._id}`, payload);
      }
      return apiPost("/categories", payload);
    },
    onSuccess: () => {
      toast.success(editingCategory ? "Category updated." : "Category created.");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      closeDialog();
    },
    onError: () => toast.error("Failed to save category."),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut(`/categories/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: () => toast.error("Failed to update status."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: () => toast.error("Failed to delete category. It may have products."),
  });

  function openAdd() {
    setEditingCategory(null);
    reset({ name: "", description: "", image: "", parentId: "", isActive: true });
    setDialogOpen(true);
  }

  function openEdit(cat: CategoryWithChildren) {
    setEditingCategory(cat);
    const parentId = typeof cat.parent === "object" ? (cat.parent as Category)?._id : cat.parent;
    reset({
      name: cat.name,
      description: cat.description ?? "",
      image: cat.image ?? "",
      parentId: parentId ?? "",
      isActive: cat.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingCategory(null);
    reset();
  }

  function toggleExpand(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  // Get top-level categories for parent select (exclude self and children when editing)
  function getParentOptions(): Category[] {
    if (!categories) return [];
    if (!editingCategory) return categories.filter((c) => !c.parent);
    return categories.filter(
      (c) => c._id !== editingCategory._id && !c.parent
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">Categories</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No categories"
              description="Create your first category to organize products."
              ctaLabel="Add Category"
              onCtaClick={openAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Slug</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Products</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tree.map((cat) => (
                    <CategoryRow
                      key={cat._id}
                      category={cat}
                      depth={0}
                      expanded={expanded}
                      onToggle={toggleExpand}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onToggleActive={(id, val) =>
                        toggleActiveMutation.mutate({ id, isActive: val })
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" {...register("name")} className="mt-1" />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                {...register("description")}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cat-image">Image URL</Label>
              <Input id="cat-image" {...register("image")} className="mt-1" />
              {errors.image && (
                <p className="mt-1 text-xs text-red-500">{errors.image.message}</p>
              )}
            </div>

            <div>
              <Label>Parent Category</Label>
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {getParentOptions().map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {(deleteTarget?.productCount ?? 0) > 0 &&
                ` This category has ${deleteTarget?.productCount} product(s). They will need to be reassigned.`}
              {(deleteTarget?.children?.length ?? 0) > 0 &&
                " Subcategories will also be affected."}
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
