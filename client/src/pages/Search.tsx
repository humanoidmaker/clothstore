import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  ShoppingCart,
  Heart,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import type {
  Product,
  PaginatedResponse,
  ApiResponse,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

const sortOptions = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "popular";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const category = searchParams.get("category") || "";

  const [showFilters, setShowFilters] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.addToCart);

  const { data, isLoading } = useQuery({
    queryKey: ["search-products", query, sort, page, minPrice, maxPrice, category],
    queryFn: () =>
      apiGet<PaginatedResponse<Product>>("/products", {
        search: query,
        sort,
        page,
        limit: 24,
        ...(minPrice && { minPrice: parseInt(minPrice, 10) }),
        ...(maxPrice && { maxPrice: parseInt(maxPrice, 10) }),
        ...(category && { category }),
      }),
    enabled: query.length > 0,
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const wishlistSet = useMemo(
    () => new Set(user?.wishlist ?? []),
    [user?.wishlist]
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    setSearchParams(params);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (localMinPrice) params.set("minPrice", localMinPrice);
    else params.delete("minPrice");
    if (localMaxPrice) params.set("maxPrice", localMaxPrice);
    else params.delete("maxPrice");
    params.set("page", "1");
    setSearchParams(params);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    setSearchParams(params);
    setLocalMinPrice("");
    setLocalMaxPrice("");
  };

  const hasActiveFilters = minPrice || maxPrice || category || sort !== "popular";

  const handleAddToCart = async (product: Product) => {
    const activeVariant = product.variants.find(
      (v) => v.isActive && v.stock > 0
    );
    if (!activeVariant) {
      toast.error("No available variant in stock");
      return;
    }
    try {
      await addToCart(activeVariant._id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error("Please login to save items");
      return;
    }
    try {
      if (wishlistSet.has(productId)) {
        await apiDelete<ApiResponse<null>>(`/wishlist/${productId}`);
        toast.success("Removed from wishlist");
      } else {
        await apiPost<ApiResponse<null>>(`/wishlist/${productId}`);
        toast.success("Added to wishlist");
      }
      // Refresh user to update wishlist
      useAuthStore.getState().fetchUser();
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const goToPage = (p: number) => {
    updateParam("page", p.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        {query ? (
          <h1 className="text-2xl font-bold text-[#1a1f36]">
            Search Results for &apos;{query}&apos;
            {!isLoading && (
              <span className="ml-2 text-lg font-normal text-gray-400">
                ({total} {total === 1 ? "result" : "results"})
              </span>
            )}
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-[#1a1f36]">Search</h1>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-gray-500"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-400">
                  Min Price
                </Label>
                <Input
                  type="number"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-gray-400">
                  Max Price
                </Label>
                <Input
                  type="number"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-32"
                />
              </div>
              <Button size="sm" onClick={applyPriceFilter}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!query ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <SearchIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1a1f36]">
            Search for Products
          </h3>
          <p className="max-w-sm text-sm text-gray-500">
            Type a product name, category, or brand in the search bar to find
            what you&apos;re looking for.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <SearchIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1a1f36]">
            No Products Found for &apos;{query}&apos;
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            We couldn&apos;t find any products matching your search. Try the
            following:
          </p>
          <ul className="mb-6 space-y-1 text-left text-sm text-gray-500">
            <li>- Check the spelling of your search term</li>
            <li>- Use more general keywords</li>
            <li>- Browse our categories instead</li>
          </ul>
          <Link to="/">
            <Button variant="accent">Browse All Products</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const firstVariant = product.variants[0];
              const price = firstVariant?.price ?? 0;
              const compareAtPrice = firstVariant?.compareAtPrice;
              const isOutOfStock = !product.variants.some(
                (v) => v.isActive && v.stock > 0
              );
              const isWishlisted = wishlistSet.has(product._id);

              return (
                <Card
                  key={product._id}
                  className="group relative overflow-hidden"
                >
                  {/* Wishlist toggle */}
                  <button
                    onClick={() => handleToggleWishlist(product._id)}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-red-50"
                    aria-label={
                      isWishlisted
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isWishlisted
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400 hover:text-red-400"
                      )}
                    />
                  </button>

                  <Link to={`/products/${product.slug}`}>
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                      <img
                        src={product.thumbnail || product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Badge variant="destructive" className="text-sm">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#c8a96e]">
                      {product.brand}
                    </p>
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="mt-1 line-clamp-2 text-sm font-medium text-[#1a1f36] transition-colors hover:text-[#c8a96e]">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-2">
                      <StarRating
                        rating={product.avgRating}
                        size="sm"
                        showCount
                        count={product.reviewCount}
                      />
                    </div>

                    <div className="mt-2">
                      <PriceDisplay
                        price={price}
                        compareAtPrice={compareAtPrice}
                        size="sm"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full gap-2"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 2 && p <= page + 2)
                )
                .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(item)}
                      className="min-w-[2.25rem]"
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
