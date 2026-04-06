import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, X, ShoppingCart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { WishlistItem, ApiResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StarRating } from "@/components/shared/StarRating";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { useCartStore } from "@/stores/cartStore";

export default function AccountWishlist() {
  const queryClient = useQueryClient();
  const addToCart = useCartStore((s) => s.addToCart);

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => apiGet<ApiResponse<WishlistItem[]>>("/wishlist"),
  });

  const items = data?.data ?? [];

  const removeMutation = useMutation({
    mutationFn: (productId: string) =>
      apiDelete<ApiResponse<null>>(`/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
  });

  const handleAddToCart = async (item: WishlistItem) => {
    const product = item.product;
    const activeVariant = product.variants.find((v) => v.isActive && v.stock > 0);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1f36]">
          My Wishlist
          {!isLoading && items.length > 0 && (
            <span className="ml-2 text-lg font-normal text-gray-400">
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Save items you love to your wishlist. They'll appear here so you can easily find and buy them later."
          ctaLabel="Start Shopping"
          ctaHref="/"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const firstVariant = product.variants[0];
            const price = firstVariant?.price ?? 0;
            const compareAtPrice = firstVariant?.compareAtPrice;
            const isOutOfStock = !product.variants.some(
              (v) => v.isActive && v.stock > 0
            );

            return (
              <Card key={item._id} className="group relative overflow-hidden">
                {/* Remove button */}
                <button
                  onClick={() => removeMutation.mutate(product._id)}
                  disabled={removeMutation.isPending}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-4 w-4" />
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
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
