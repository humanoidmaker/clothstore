import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Heart,
  ShoppingBag,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  PackageSearch,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StarRating } from "@/components/shared/StarRating";
import { SkeletonProductCard } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type {
  Product,
  Category,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const COLOR_SWATCHES = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Orange", hex: "#f97316" },
  { name: "Brown", hex: "#92400e" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Beige", hex: "#d4c5a9" },
  { name: "Maroon", hex: "#800000" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const RATING_OPTIONS = [4, 3, 2, 1];

const LIMIT = 12;

// ─── Product Card ────────────────────────────────────────────
function ProductCard({
  product,
  viewMode,
}: {
  product: Product;
  viewMode: "grid" | "list";
}) {
  const { user } = useAuthStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const [wishlisted, setWishlisted] = useState(
    user?.wishlist?.includes(product._id) ?? false
  );
  const [addingToCart, setAddingToCart] = useState(false);

  const firstVariant =
    product.variants.find((v) => v.isActive && v.stock > 0) ??
    product.variants[0];
  const image =
    firstVariant?.images?.[0] ||
    product.thumbnail ||
    product.images?.[0] ||
    "https://placehold.co/400x533/1a1f36/c8a96e?text=No+Image";
  const isOnSale =
    firstVariant?.compareAtPrice &&
    firstVariant.compareAtPrice > firstVariant.price;
  const discountPercent = isOnSale
    ? Math.round(
        ((firstVariant.compareAtPrice! - firstVariant.price) /
          firstVariant.compareAtPrice!) *
          100
      )
    : 0;

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      return;
    }
    try {
      await apiPost(`/wishlist/${wishlisted ? "remove" : "add"}`, {
        productId: product._id,
      });
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleAddToCart = async () => {
    if (!firstVariant || firstVariant.stock <= 0) {
      toast.error("This product is currently out of stock");
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(firstVariant._id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (viewMode === "list") {
    return (
      <div className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md sm:gap-6 sm:p-4">
        <Link
          to={`/product/${product.slug}`}
          className="relative w-32 shrink-0 overflow-hidden rounded-lg sm:w-44"
        >
          <div className="aspect-[3/4] bg-gray-50">
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {isOnSale && (
            <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              -{discountPercent}%
            </span>
          )}
        </Link>
        <div className="flex flex-1 flex-col py-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {product.brand}
          </p>
          <Link
            to={`/product/${product.slug}`}
            className="mt-0.5 line-clamp-2 text-sm font-medium text-[#1a1f36] transition-colors hover:text-[#c8a96e] sm:text-base"
          >
            {product.name}
          </Link>
          <StarRating
            rating={product.avgRating}
            size="sm"
            showCount
            count={product.reviewCount}
            className="mt-1"
          />
          {product.shortDescription && (
            <p className="mt-2 hidden line-clamp-2 text-xs text-gray-500 sm:block">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#1a1f36]">
                {formatPrice(firstVariant?.price ?? 0)}
              </span>
              {isOnSale && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(firstVariant.compareAtPrice!)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleWishlist}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition-colors hover:border-red-200 hover:bg-red-50"
                aria-label="Toggle wishlist"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    wishlisted
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400"
                  )}
                />
              </button>
              <Button
                variant="accent"
                size="sm"
                className="gap-1.5"
                onClick={handleAddToCart}
                disabled={
                  addingToCart || !firstVariant || firstVariant.stock <= 0
                }
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {firstVariant?.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link
        to={`/product/${product.slug}`}
        className="relative overflow-hidden rounded-t-xl"
      >
        <div className="aspect-[3/4] overflow-hidden bg-gray-50">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        {isOnSale && (
          <span className="absolute left-3 top-3 rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        )}
      </Link>
      <button
        onClick={toggleWishlist}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110"
        aria-label="Toggle wishlist"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            wishlisted ? "fill-red-500 text-red-500" : "text-gray-500"
          )}
        />
      </button>
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-gray-400">
          {product.brand}
        </p>
        <Link
          to={`/product/${product.slug}`}
          className="mb-1 line-clamp-2 text-sm font-medium text-[#1a1f36] transition-colors hover:text-[#c8a96e]"
        >
          {product.name}
        </Link>
        <StarRating
          rating={product.avgRating}
          size="sm"
          showCount
          count={product.reviewCount}
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-[#1a1f36]">
            {formatPrice(firstVariant?.price ?? 0)}
          </span>
          {isOnSale && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(firstVariant.compareAtPrice!)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3">
          <Button
            variant="accent"
            size="sm"
            className="w-full gap-1.5"
            onClick={handleAddToCart}
            disabled={
              addingToCart || !firstVariant || firstVariant.stock <= 0
            }
          >
            {addingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            {firstVariant?.stock <= 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Filters ─────────────────────────────────────────
function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedSizes,
  toggleSize,
  selectedColors,
  toggleColor,
  selectedBrands,
  toggleBrand,
  brandOptions,
  brandSearch,
  setBrandSearch,
  selectedRating,
  setSelectedRating,
  inStockOnly,
  setInStockOnly,
  clearAllFilters,
  hasActiveFilters,
  onClose,
  isMobile,
}: {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  selectedColors: string[];
  toggleColor: (color: string) => void;
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;
  brandOptions: string[];
  brandSearch: string;
  setBrandSearch: (s: string) => void;
  selectedRating: number | null;
  setSelectedRating: (r: number | null) => void;
  inStockOnly: boolean;
  setInStockOnly: (b: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const filteredBrands = brandOptions.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className={cn("space-y-6", isMobile && "pb-24")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1f36]">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-[#c8a96e] hover:underline"
            >
              Clear All
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#2d3436]">
          Price Range
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{formatPrice(priceRange[0])}</span>
            <span className="text-gray-300">—</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Min
              <input
                type="range"
                min={0}
                max={1000000}
                step={5000}
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([
                    Math.min(Number(e.target.value), priceRange[1] - 5000),
                    priceRange[1],
                  ])
                }
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#c8a96e]"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              Max
              <input
                type="range"
                min={0}
                max={1000000}
                step={5000}
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([
                    priceRange[0],
                    Math.max(Number(e.target.value), priceRange[0] + 5000),
                  ])
                }
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#c8a96e]"
              />
            </label>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Sizes */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#2d3436]">Size</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "flex h-9 min-w-[40px] items-center justify-center rounded-md border px-2.5 text-xs font-medium transition-all",
                selectedSizes.includes(size)
                  ? "border-[#1a1f36] bg-[#1a1f36] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Colors */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#2d3436]">Color</h4>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleColor(color.name)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                selectedColors.includes(color.name)
                  ? "border-[#1a1f36] ring-2 ring-[#1a1f36]/20"
                  : "border-gray-200 hover:border-gray-400"
              )}
              title={color.name}
              aria-label={color.name}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full",
                  color.hex === "#ffffff" && "border border-gray-200"
                )}
                style={{ backgroundColor: color.hex }}
              />
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Brands */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#2d3436]">Brand</h4>
        {brandOptions.length > 5 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brands..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        )}
        <div className="max-h-40 space-y-1.5 overflow-y-auto">
          {filteredBrands.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="h-4 w-4 rounded border-gray-300 text-[#c8a96e] accent-[#c8a96e]"
              />
              <span className="text-gray-600">{brand}</span>
            </label>
          ))}
          {filteredBrands.length === 0 && (
            <p className="py-2 text-center text-xs text-gray-400">
              No brands found
            </p>
          )}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Rating */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[#2d3436]">Rating</h4>
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() =>
                setSelectedRating(selectedRating === r ? null : r)
              }
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                selectedRating === r
                  ? "bg-[#1a1f36]/5 text-[#1a1f36]"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < r
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-semibold text-[#2d3436]">
            In Stock Only
          </span>
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              inStockOnly ? "bg-[#c8a96e]" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                inStockOnly && "translate-x-5"
              )}
            />
          </button>
        </label>
      </div>

      {/* Mobile apply button */}
      {isMobile && onClose && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
          <Button variant="accent" className="w-full" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ProductListing() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  // Read filter state from URL params
  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentSort = (searchParams.get("sort") ?? "newest") as string;
  const selectedSizes = searchParams.get("sizes")?.split(",").filter(Boolean) ?? [];
  const selectedColors = searchParams.get("colors")?.split(",").filter(Boolean) ?? [];
  const selectedBrands = searchParams.get("brands")?.split(",").filter(Boolean) ?? [];
  const selectedRating = searchParams.get("rating") ? Number(searchParams.get("rating")) : null;
  const inStockOnly = searchParams.get("inStock") === "true";
  const priceRange: [number, number] = [
    Number(searchParams.get("minPrice") ?? "0"),
    Number(searchParams.get("maxPrice") ?? "1000000"),
  ];

  // Helper to update search params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        // Reset to page 1 on filter change
        if (!("page" in updates)) {
          next.set("page", "1");
        }
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === "" || value === "0" || value === "1000000") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  // Filter toggle helpers
  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateParams({ sizes: next.length ? next.join(",") : null });
  };

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    updateParams({ colors: next.length ? next.join(",") : null });
  };

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    updateParams({ brands: next.length ? next.join(",") : null });
  };

  const setPriceRange = (range: [number, number]) => {
    updateParams({
      minPrice: range[0] > 0 ? String(range[0]) : null,
      maxPrice: range[1] < 1000000 ? String(range[1]) : null,
    });
  };

  const setSelectedRating = (r: number | null) => {
    updateParams({ rating: r !== null ? String(r) : null });
  };

  const setInStockOnly = (b: boolean) => {
    updateParams({ inStock: b ? "true" : null });
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedBrands.length > 0 ||
    selectedRating !== null ||
    inStockOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000000;

  // Fetch category info
  const { data: categoryData } = useQuery({
    queryKey: ["category", slug],
    queryFn: () =>
      apiGet<ApiResponse<Category>>(`/categories/${slug}`),
    enabled: !!slug,
  });

  const category = categoryData?.data;

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: [
      "products",
      slug,
      currentPage,
      currentSort,
      selectedSizes,
      selectedColors,
      selectedBrands,
      selectedRating,
      inStockOnly,
      priceRange,
    ],
    queryFn: () =>
      apiGet<ApiResponse<PaginatedResponse<Product>>>("/products", {
        category: slug,
        page: currentPage,
        limit: LIMIT,
        sort: currentSort,
        sizes: selectedSizes.length ? selectedSizes.join(",") : undefined,
        colors: selectedColors.length ? selectedColors.join(",") : undefined,
        brands: selectedBrands.length ? selectedBrands.join(",") : undefined,
        rating: selectedRating ?? undefined,
        inStock: inStockOnly || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      }),
  });

  // Fetch available brands for this category
  const { data: brandsData } = useQuery({
    queryKey: ["brands", slug],
    queryFn: () =>
      apiGet<ApiResponse<string[]>>(`/products/brands`, { category: slug }),
  });

  const products = productsData?.data?.data ?? [];
  const totalProducts = productsData?.data?.total ?? 0;
  const totalPages = productsData?.data?.totalPages ?? 1;
  const brandOptions = brandsData?.data ?? [];

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Lock body scroll when mobile filters open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  const categoryName = category?.name ?? slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Products";

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: categoryName }]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f36] md:text-3xl">
              {categoryName}
            </h1>
            {!isLoading && (
              <p className="mt-0.5 text-sm text-gray-500">
                {totalProducts} {totalProducts === 1 ? "product" : "products"} found
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c8a96e] text-[10px] text-white">
                  {selectedSizes.length +
                    selectedColors.length +
                    selectedBrands.length +
                    (selectedRating ? 1 : 0) +
                    (inStockOnly ? 1 : 0) +
                    (priceRange[0] > 0 || priceRange[1] < 1000000 ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* Sort */}
            <Select
              value={currentSort}
              onValueChange={(v) => updateParams({ sort: v, page: "1" })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="hidden items-center rounded-lg border border-gray-200 p-0.5 sm:flex">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-[#1a1f36] text-white"
                    : "text-gray-400 hover:text-gray-600"
                )}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-[#1a1f36] text-white"
                    : "text-gray-400 hover:text-gray-600"
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <FilterSidebar
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedSizes={selectedSizes}
                toggleSize={toggleSize}
                selectedColors={selectedColors}
                toggleColor={toggleColor}
                selectedBrands={selectedBrands}
                toggleBrand={toggleBrand}
                brandOptions={brandOptions}
                brandSearch={brandSearch}
                setBrandSearch={setBrandSearch}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                clearAllFilters={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className="flex items-center gap-1 rounded-full bg-[#1a1f36]/5 px-3 py-1 text-xs font-medium text-[#1a1f36] transition-colors hover:bg-[#1a1f36]/10"
                  >
                    Size: {s} <X className="h-3 w-3" />
                  </button>
                ))}
                {selectedColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleColor(c)}
                    className="flex items-center gap-1 rounded-full bg-[#1a1f36]/5 px-3 py-1 text-xs font-medium text-[#1a1f36] transition-colors hover:bg-[#1a1f36]/10"
                  >
                    {c} <X className="h-3 w-3" />
                  </button>
                ))}
                {selectedBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBrand(b)}
                    className="flex items-center gap-1 rounded-full bg-[#1a1f36]/5 px-3 py-1 text-xs font-medium text-[#1a1f36] transition-colors hover:bg-[#1a1f36]/10"
                  >
                    {b} <X className="h-3 w-3" />
                  </button>
                ))}
                {selectedRating && (
                  <button
                    onClick={() => setSelectedRating(null)}
                    className="flex items-center gap-1 rounded-full bg-[#1a1f36]/5 px-3 py-1 text-xs font-medium text-[#1a1f36] transition-colors hover:bg-[#1a1f36]/10"
                  >
                    {selectedRating}+ Stars <X className="h-3 w-3" />
                  </button>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <button
                    onClick={() => setPriceRange([0, 1000000])}
                    className="flex items-center gap-1 rounded-full bg-[#1a1f36]/5 px-3 py-1 text-xs font-medium text-[#1a1f36] transition-colors hover:bg-[#1a1f36]/10"
                  >
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}{" "}
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={clearAllFilters}
                  className="rounded-full px-3 py-1 text-xs font-medium text-[#c8a96e] hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Loading state */}
            {isLoading ? (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
                    : "space-y-4"
                )}
              >
                {Array.from({ length: LIMIT }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={PackageSearch}
                title="No products found"
                description="Try adjusting your filters or search for a different category. We're always adding new products!"
                ctaLabel="Clear Filters"
                onCtaClick={clearAllFilters}
              />
            ) : (
              <>
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
                      : "space-y-4"
                  )}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        updateParams({ page: String(currentPage - 1) })
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      // Show first, last, current, and neighbors
                      if (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={
                              page === currentPage ? "default" : "ghost"
                            }
                            size="sm"
                            className={cn(
                              "min-w-[36px]",
                              page === currentPage &&
                                "bg-[#1a1f36] text-white"
                            )}
                            onClick={() =>
                              updateParams({ page: String(page) })
                            }
                          >
                            {page}
                          </Button>
                        );
                      }
                      // Show ellipsis
                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-1 text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        updateParams({ page: String(currentPage + 1) })
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl lg:hidden">
            <FilterSidebar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedSizes={selectedSizes}
              toggleSize={toggleSize}
              selectedColors={selectedColors}
              toggleColor={toggleColor}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              brandOptions={brandOptions}
              brandSearch={brandSearch}
              setBrandSearch={setBrandSearch}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              clearAllFilters={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              onClose={() => setMobileFiltersOpen(false)}
              isMobile
            />
          </div>
        </>
      )}
    </div>
  );
}
