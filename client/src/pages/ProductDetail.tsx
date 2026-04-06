import { useState, useMemo, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Share2,
  Copy,
  CheckCircle2,
  Loader2,
  Star,
  Ruler,
  Truck,
  RotateCcw,
  Shield,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StarRating } from "@/components/shared/StarRating";
import { Skeleton, SkeletonProductCard } from "@/components/shared/Skeleton";
import type {
  Product,
  ProductVariant,
  Category,
  Review,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

// ─── Size Chart Data ─────────────────────────────────────────
const SIZE_CHART = [
  { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36", length: "25" },
  { size: "S", chest: "35-37", waist: "29-31", hip: "37-39", length: "26" },
  { size: "M", chest: "38-40", waist: "32-34", hip: "40-42", length: "27" },
  { size: "L", chest: "41-43", waist: "35-37", hip: "43-45", length: "28" },
  { size: "XL", chest: "44-46", waist: "38-40", hip: "46-48", length: "29" },
  { size: "XXL", chest: "47-49", waist: "41-43", hip: "49-51", length: "30" },
  { size: "XXXL", chest: "50-52", waist: "44-46", hip: "52-54", length: "31" },
];

// ─── Image Gallery ───────────────────────────────────────────
function ImageGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const displayImages =
    images.length > 0
      ? images
      : ["https://placehold.co/600x800/1a1f36/c8a96e?text=No+Image"];

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    []
  );

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        ref={imageRef}
        className="relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="aspect-[3/4]">
          <img
            src={displayImages[selectedIndex]}
            alt="Product"
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              isZoomed && "scale-150"
            )}
            style={
              isZoomed
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
          />
        </div>
        <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20",
                idx === selectedIndex
                  ? "border-[#c8a96e] ring-1 ring-[#c8a96e]/30"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review Item ─────────────────────────────────────────────
function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="border-b border-gray-100 py-5 last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1f36]/5 text-sm font-semibold text-[#1a1f36]">
          {review.user.avatar ? (
            <img
              src={review.user.avatar}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            `${review.user.firstName?.[0] ?? ""}${review.user.lastName?.[0] ?? ""}`
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#1a1f36]">
              {review.user.firstName} {review.user.lastName}
            </span>
            {review.isVerifiedPurchase && (
              <span className="flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                <CheckCircle2 className="h-3 w-3" /> Verified Purchase
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" className="mt-1" />
          {review.title && (
            <p className="mt-2 text-sm font-medium text-[#2d3436]">
              {review.title}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {review.comment}
          </p>
          {review.images && review.images.length > 0 && (
            <div className="mt-3 flex gap-2">
              {review.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="h-16 w-16 rounded-lg border border-gray-100 object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Write Review Form ───────────────────────────────────────
function WriteReviewForm({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess: () => void;
}) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: (data: {
      rating: number;
      title: string;
      comment: string;
    }) => apiPost<ApiResponse<Review>>(`/reviews/${productId}`, data),
    onSuccess: () => {
      toast.success("Review submitted!");
      setRating(0);
      setTitle("");
      setComment("");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          Please{" "}
          <Link to="/login" className="font-medium text-[#c8a96e] hover:underline">
            login
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating === 0) {
          toast.error("Please select a rating");
          return;
        }
        if (!comment.trim()) {
          toast.error("Please write a comment");
          return;
        }
        mutation.mutate({ rating, title: title.trim(), comment: comment.trim() });
      }}
      className="rounded-lg border border-gray-100 bg-gray-50/50 p-5"
    >
      <h4 className="mb-4 text-sm font-semibold text-[#1a1f36]">
        Write a Review
      </h4>

      {/* Rating */}
      <div className="mb-4">
        <Label className="mb-1.5 block text-xs">Your Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              {rating} of 5
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <Label htmlFor="review-title" className="mb-1.5 block text-xs">
          Title (optional)
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="h-9"
        />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <Label htmlFor="review-comment" className="mb-1.5 block text-xs">
          Your Review
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? How was the fit?"
          rows={4}
          required
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        size="sm"
        disabled={mutation.isPending}
        className="gap-1.5"
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}

// ─── Related Product Card (compact) ──────────────────────────
function RelatedProductCard({ product }: { product: Product }) {
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

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative overflow-hidden rounded-t-xl">
        <div className="aspect-[3/4] bg-gray-50">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          {product.brand}
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm font-medium text-[#1a1f36]">
          {product.name}
        </p>
        <StarRating
          rating={product.avgRating}
          size="sm"
          className="mt-1"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-bold text-[#1a1f36]">
            {formatPrice(firstVariant?.price ?? 0)}
          </span>
          {isOnSale && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(firstVariant.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "info" | "reviews"
  >("description");
  const [addingToCart, setAddingToCart] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  const reviewsRef = useRef<HTMLDivElement>(null);

  // Fetch product
  const {
    data: productData,
    isLoading: productLoading,
    isError: productError,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () =>
      apiGet<ApiResponse<Product>>(`/products/${slug}`),
    enabled: !!slug,
  });

  const product = productData?.data;

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", product?._id, reviewPage],
    queryFn: () =>
      apiGet<ApiResponse<PaginatedResponse<Review>>>(
        `/reviews/${product!._id}`,
        { page: reviewPage, limit: 5 }
      ),
    enabled: !!product?._id,
  });

  // Fetch related products
  const { data: relatedData } = useQuery({
    queryKey: ["products", "related", product?._id],
    queryFn: () =>
      apiGet<ApiResponse<Product[]>>(
        `/products/${product!._id}/related`
      ),
    enabled: !!product?._id,
  });

  const reviews = reviewsData?.data?.data ?? [];
  const reviewsTotal = reviewsData?.data?.total ?? 0;
  const reviewsTotalPages = reviewsData?.data?.totalPages ?? 1;
  const relatedProducts = relatedData?.data ?? [];

  // Derived data
  const availableColors = useMemo(() => {
    if (!product) return [];
    const colorMap = new Map<string, string>();
    product.variants
      .filter((v) => v.isActive)
      .forEach((v) => {
        if (!colorMap.has(v.color)) {
          colorMap.set(v.color, v.colorHex ?? "#000000");
        }
      });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    }));
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product) return [];
    const variants = product.variants.filter(
      (v) => v.isActive && (!selectedColor || v.color === selectedColor)
    );
    const sizeMap = new Map<string, boolean>();
    variants.forEach((v) => {
      sizeMap.set(v.size, v.stock > 0);
    });
    return Array.from(sizeMap.entries()).map(([size, inStock]) => ({
      size,
      inStock,
    }));
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
    return (
      product.variants.find(
        (v) =>
          v.isActive &&
          v.color === selectedColor &&
          v.size === selectedSize
      ) ?? null
    );
  }, [product, selectedColor, selectedSize]);

  // All images: product images + selected variant images
  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (selectedVariant?.images?.length) {
      imgs.push(...selectedVariant.images);
    }
    if (product.images?.length) {
      product.images.forEach((img) => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }
    product.variants.forEach((v) => {
      v.images?.forEach((img) => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    });
    return imgs;
  }, [product, selectedVariant]);

  const displayPrice = selectedVariant?.price ?? product?.variants[0]?.price ?? 0;
  const displayCompareAt =
    selectedVariant?.compareAtPrice ?? product?.variants[0]?.compareAtPrice;
  const isOnSale = displayCompareAt && displayCompareAt > displayPrice;
  const discountPercent = isOnSale
    ? Math.round(
        ((displayCompareAt - displayPrice) / displayCompareAt) * 100
      )
    : 0;

  const stockCount = selectedVariant?.stock ?? 0;

  const wishlisted = user?.wishlist?.includes(product?._id ?? "") ?? false;
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Sync wishlist state when product loads
  useMemo(() => {
    if (product && user?.wishlist) {
      setIsWishlisted(user.wishlist.includes(product._id));
    }
  }, [product, user?.wishlist]);

  // Auto-select first available color
  useMemo(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0].name);
    }
  }, [availableColors, selectedColor]);

  // Reset size when color changes and size is not available
  useMemo(() => {
    if (selectedSize && availableSizes.length > 0) {
      const sizeStillAvailable = availableSizes.some(
        (s) => s.size === selectedSize
      );
      if (!sizeStillAvailable) {
        setSelectedSize(null);
      }
    }
  }, [availableSizes, selectedSize]);

  // Category
  const category =
    product && typeof product.category === "object"
      ? (product.category as Category)
      : null;

  // Handlers
  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to add to wishlist");
      return;
    }
    try {
      await apiPost(`/wishlist/${isWishlisted ? "remove" : "add"}`, {
        productId: product!._id,
      });
      setIsWishlisted(!isWishlisted);
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist"
      );
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please select a size and color");
      return;
    }
    if (selectedVariant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(selectedVariant._id, quantity);
      toast.success("Added to cart!");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error("Please select a size and color");
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(selectedVariant._id, quantity);
      navigate("/checkout");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out ${product?.name}: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Loading state
  if (productLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-5 w-64" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-14 rounded-md" />
                ))}
              </div>
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ShoppingBag className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[#1a1f36]">
          Product Not Found
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/">
          <Button variant="accent">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              ...(category
                ? [{ label: category.name, href: `/category/${category.slug}` }]
                : []),
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left — Image Gallery */}
          <ImageGallery images={allImages} />

          {/* Right — Product Info */}
          <div>
            {/* Brand */}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {product.brand}
            </p>

            {/* Name */}
            <h1 className="mt-1 text-2xl font-bold text-[#1a1f36] md:text-3xl">
              {product.name}
            </h1>

            {/* Rating */}
            <button
              onClick={() => {
                setActiveTab("reviews");
                reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-2 flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <StarRating
                rating={product.avgRating}
                size="md"
                showCount
                count={product.reviewCount}
              />
            </button>

            {/* Price */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-[#1a1f36]">
                {formatPrice(displayPrice)}
              </span>
              {isOnSale && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(displayCompareAt)}
                  </span>
                  <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                    -{discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {product.shortDescription}
              </p>
            )}

            <hr className="my-5 border-gray-100" />

            {/* Color selector */}
            {availableColors.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-[#2d3436]">
                  Color:{" "}
                  <span className="font-normal text-gray-500">
                    {selectedColor ?? "Select"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        selectedColor === color.name
                          ? "border-[#1a1f36] ring-2 ring-[#1a1f36]/20"
                          : "border-gray-200 hover:border-gray-400"
                      )}
                      title={color.name}
                    >
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full",
                          color.hex.toLowerCase() === "#ffffff" &&
                            "border border-gray-200"
                        )}
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {availableSizes.length > 0 && (
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#2d3436]">
                    Size:{" "}
                    <span className="font-normal text-gray-500">
                      {selectedSize ?? "Select"}
                    </span>
                  </p>
                  {/* Size Chart Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1 text-xs font-medium text-[#c8a96e] hover:underline">
                        <Ruler className="h-3.5 w-3.5" /> Size Chart
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Size Chart</DialogTitle>
                        <DialogDescription>
                          All measurements are in inches.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="px-3 py-2 text-left font-semibold text-[#1a1f36]">
                                Size
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-[#1a1f36]">
                                Chest
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-[#1a1f36]">
                                Waist
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-[#1a1f36]">
                                Hip
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-[#1a1f36]">
                                Length
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {SIZE_CHART.map((row) => (
                              <tr
                                key={row.size}
                                className={cn(
                                  "border-b border-gray-100",
                                  selectedSize === row.size &&
                                    "bg-[#c8a96e]/5 font-medium"
                                )}
                              >
                                <td className="px-3 py-2 font-medium">
                                  {row.size}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {row.chest}"
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {row.waist}"
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {row.hip}"
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                  {row.length}"
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(({ size, inStock }) => (
                    <button
                      key={size}
                      onClick={() => inStock && setSelectedSize(size)}
                      disabled={!inStock}
                      className={cn(
                        "flex h-10 min-w-[48px] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all",
                        selectedSize === size
                          ? "border-[#1a1f36] bg-[#1a1f36] text-white"
                          : inStock
                          ? "border-gray-200 bg-white text-[#2d3436] hover:border-[#1a1f36]"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-semibold text-[#2d3436]">
                Quantity
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-l-md border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex h-10 w-14 items-center justify-center border-y border-gray-200 text-sm font-medium">
                  {quantity}
                </div>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(
                        selectedVariant ? selectedVariant.stock : 10,
                        quantity + 1
                      )
                    )
                  }
                  disabled={
                    selectedVariant
                      ? quantity >= selectedVariant.stock
                      : quantity >= 10
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-r-md border border-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Stock indicator */}
              {selectedVariant && (
                <p
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    stockCount > 0 && stockCount < 10
                      ? "text-orange-500"
                      : stockCount === 0
                      ? "text-red-500"
                      : "text-green-600"
                  )}
                >
                  {stockCount === 0
                    ? "Out of Stock"
                    : stockCount < 10
                    ? `Only ${stockCount} left in stock`
                    : "In Stock"}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="accent"
                size="lg"
                className="flex-1 gap-2 text-base font-semibold"
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  !selectedSize ||
                  !selectedColor ||
                  stockCount === 0
                }
              >
                {addingToCart ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingBag className="h-5 w-5" />
                )}
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2 text-base font-semibold"
                onClick={handleBuyNow}
                disabled={
                  addingToCart ||
                  !selectedSize ||
                  !selectedColor ||
                  stockCount === 0
                }
              >
                Buy Now
              </Button>
            </div>

            {/* Wishlist + Share */}
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={toggleWishlist}
                className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-red-500"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isWishlisted && "fill-red-500 text-red-500"
                  )}
                />
                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
              <span className="h-4 w-px bg-gray-200" />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-[#1a1f36]"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy Link
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-green-600"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </button>
            </div>

            <hr className="my-5 border-gray-100" />

            {/* Trust badges (compact) */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, text: "Free Shipping" },
                { icon: RotateCcw, text: "7-Day Returns" },
                { icon: Shield, text: "Secure Payment" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex flex-col items-center gap-1 rounded-lg bg-gray-50 px-2 py-3 text-center"
                >
                  <Icon className="h-4 w-4 text-[#c8a96e]" />
                  <span className="text-[11px] font-medium text-gray-600">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ Tabs ══════════ */}
        <div ref={reviewsRef} className="mt-12 border-t border-gray-100 pt-8">
          {/* Tab headers */}
          <div className="flex gap-0 border-b border-gray-200">
            {(
              [
                { key: "description", label: "Description" },
                { key: "info", label: "Additional Info" },
                {
                  key: "reviews",
                  label: `Reviews (${product.reviewCount})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative px-5 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "text-[#1a1f36]"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8a96e]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-6">
            {/* Description */}
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none text-gray-600">
                {product.description.split("\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {/* Additional Info */}
            {activeTab === "info" && (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: "Brand", value: product.brand },
                      {
                        label: "Category",
                        value: category?.name ?? "N/A",
                      },
                      {
                        label: "Material",
                        value: product.material ?? "N/A",
                      },
                      {
                        label: "Care Instructions",
                        value: product.careInstructions ?? "N/A",
                      },
                      {
                        label: "Tags",
                        value:
                          product.tags?.length > 0
                            ? product.tags.join(", ")
                            : "N/A",
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.label}
                        className={cn(
                          i % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                        )}
                      >
                        <td className="w-40 px-4 py-3 font-medium text-[#1a1f36]">
                          {row.label}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Write review form */}
                <WriteReviewForm
                  productId={product._id}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["reviews", product._id],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["product", slug],
                    });
                  }}
                />

                {/* Reviews list */}
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-8 text-center">
                    <Star className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-500">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-3 text-sm font-medium text-gray-500">
                        Showing {reviews.length} of {reviewsTotal} reviews
                      </p>
                      {reviews.map((review) => (
                        <ReviewItem key={review._id} review={review} />
                      ))}
                    </div>

                    {/* Review pagination */}
                    {reviewsTotalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewPage <= 1}
                          onClick={() => setReviewPage(reviewPage - 1)}
                        >
                          Previous
                        </Button>
                        <span className="px-3 text-sm text-gray-500">
                          Page {reviewPage} of {reviewsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewPage >= reviewsTotalPages}
                          onClick={() => setReviewPage(reviewPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════ Related Products ══════════ */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 border-t border-gray-100 pt-10">
            <h2 className="mb-6 text-2xl font-bold text-[#1a1f36]">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((p) => (
                <RelatedProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
