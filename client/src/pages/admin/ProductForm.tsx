import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { Product, Category } from "@/types";

const variantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  colorHex: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  compareAtPrice: z.coerce.number().optional(),
  images: z.string().optional(),
  isActive: z.boolean().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  shortDescription: z.string().max(300).optional(),
  description: z.string().min(1, "Description is required"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  material: z.string().optional(),
  careInstructions: z.string().optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["admin-categories-list"],
    queryFn: () => apiGet("/categories"),
  });

  const { data: existingProduct, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["admin-product", id],
    queryFn: () => apiGet(`/products/${id}`),
    enabled: isEditing,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      brand: "",
      categoryId: "",
      material: "",
      careInstructions: "",
      isActive: true,
      isFeatured: false,
      variants: [
        {
          size: "",
          color: "",
          colorHex: "#000000",
          sku: "",
          stock: 0,
          price: 0,
          compareAtPrice: undefined,
          images: "",
          isActive: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  useEffect(() => {
    if (existingProduct) {
      reset({
        name: existingProduct.name,
        shortDescription: existingProduct.shortDescription ?? "",
        description: existingProduct.description,
        brand: existingProduct.brand,
        categoryId:
          typeof existingProduct.category === "object"
            ? (existingProduct.category as Category)._id
            : existingProduct.category,
        material: existingProduct.material ?? "",
        careInstructions: existingProduct.careInstructions ?? "",
        isActive: existingProduct.isActive,
        isFeatured: existingProduct.isFeatured,
        variants: existingProduct.variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex ?? "#000000",
          sku: v.sku,
          stock: v.stock,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? undefined,
          images: v.images?.join(", ") ?? "",
          isActive: v.isActive,
        })),
      });
    }
  }, [existingProduct, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: ProductFormValues) => {
      const slug = slugify(data.name);
      const payload = {
        ...data,
        slug,
        category: data.categoryId,
        variants: data.variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || undefined,
          sku: v.sku,
          stock: v.stock,
          price: v.price,
          compareAtPrice: v.compareAtPrice || undefined,
          images: v.images
            ? v.images
                .split(",")
                .map((u) => u.trim())
                .filter(Boolean)
            : [],
          isActive: v.isActive ?? true,
        })),
      };
      if (isEditing) {
        return apiPut(`/products/${id}`, payload);
      }
      return apiPost("/products", payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Product updated." : "Product created.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: () => toast.error("Failed to save product."),
  });

  if (isEditing && productLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#1a1f36]">
          {isEditing ? "Edit Product" : "Add Product"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit((data) => saveMutation.mutate(data))}
        className="space-y-6"
      >
        {/* Card 1 — Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register("name")} className="mt-1" />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                {...register("shortDescription")}
                className="mt-1"
                maxLength={300}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                className="mt-1"
                rows={5}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} className="mt-1" />
              {errors.brand && (
                <p className="mt-1 text-xs text-red-500">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Input id="material" {...register("material")} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="careInstructions">Care Instructions</Label>
              <Input
                id="careInstructions"
                {...register("careInstructions")}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-8">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label>Active</Label>
                </div>
              )}
            />
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label>Featured</Label>
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 3 — Variants */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Variants</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  size: "",
                  color: "",
                  colorHex: "#000000",
                  sku: "",
                  stock: 0,
                  price: 0,
                  compareAtPrice: undefined,
                  images: "",
                  isActive: true,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add Variant
            </Button>
          </CardHeader>
          <CardContent>
            {errors.variants?.root && (
              <p className="mb-3 text-sm text-red-500">{errors.variants.root.message}</p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1a1f36]">
                      Variant {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label>Size</Label>
                      <Input
                        {...register(`variants.${index}.size`)}
                        className="mt-1"
                        placeholder="S, M, L, XL..."
                      />
                      {errors.variants?.[index]?.size && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.variants[index]?.size?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Color</Label>
                      <Input
                        {...register(`variants.${index}.color`)}
                        className="mt-1"
                        placeholder="Black, White..."
                      />
                      {errors.variants?.[index]?.color && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.variants[index]?.color?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Color Hex</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          {...register(`variants.${index}.colorHex`)}
                          className="h-10 w-10 cursor-pointer rounded border border-gray-300"
                        />
                        <Input
                          {...register(`variants.${index}.colorHex`)}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>SKU</Label>
                      <Input
                        {...register(`variants.${index}.sku`)}
                        className="mt-1"
                        placeholder="SKU-001"
                      />
                      {errors.variants?.[index]?.sku && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.variants[index]?.sku?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Price (paise)</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.price`)}
                        className="mt-1"
                        min={0}
                      />
                      {errors.variants?.[index]?.price && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.variants[index]?.price?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Compare At Price</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.compareAtPrice`)}
                        className="mt-1"
                        min={0}
                      />
                    </div>

                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.stock`)}
                        className="mt-1"
                        min={0}
                      />
                      {errors.variants?.[index]?.stock && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.variants[index]?.stock?.message}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                      <Label>Image URLs (comma-separated)</Label>
                      <Input
                        {...register(`variants.${index}.images`)}
                        className="mt-1"
                        placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {(isSubmitting || saveMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update Product" : "Save Product"}
          </Button>
          <Link to="/admin/products">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
