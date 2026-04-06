import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Heart,
  Truck,
  RotateCcw,
  Shield,
  Headphones,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { StarRating } from "@/components/shared/StarRating";
import { SkeletonProductCard } from "@/components/shared/Skeleton";
import type { Product, Category, ApiResponse } from "@/types";

// ─── Hero Slides ─────────────────────────────────────────────
const heroSlides = [
  {
    headline: "New Season Collection",
    subtitle: "Discover the latest trends in fashion. Fresh styles, bold statements.",
    cta: "Shop Now",
    href: "/category/new-arrivals",
    gradient: "from-[#1a1f36] via-[#1a1f36]/80 to-transparent",
    accent: "bg-gradient-to-br from-[#c8a96e]/20 via-[#1a1f36] to-[#2d3436]",
  },
  {
    headline: "Ethnic Wear Festival",
    subtitle: "Celebrate tradition with our curated ethnic collection. Elegance redefined.",
    cta: "Explore Collection",
    href: "/category/ethnic-wear",
    gradient: "from-[#2d3436] via-[#2d3436]/80 to-transparent",
    accent: "bg-gradient-to-br from-[#1a1f36] via-[#c8a96e]/30 to-[#1a1f36]",
  },
  {
    headline: "Summer Sale",
    subtitle: "Up to 50% off on select styles. Limited time only.",
    cta: "Shop Sale",
    href: "/category/sale",
    gradient: "from-[#1a1f36] via-[#1a1f36]/70 to-transparent",
    accent: "bg-gradient-to-br from-[#c8a96e]/10 via-[#2d3436] to-[#1a1f36]",
  },
  {
    headline: "Premium Accessories",
    subtitle: "Complete your look with handpicked accessories and essentials.",
    cta: "View Accessories",
    href: "/category/accessories",
    gradient: "from-[#2d3436] via-[#2d3436]/80 to-transparent",
    accent: "bg-gradient-to-br from-[#1a1f36] via-[#1a1f36] to-[#c8a96e]/20",
  },
];

// ─── Category Grid ───────────────────────────────────────────
const categoryCards = [
  { name: "Men", slug: "men", color: "from-[#1a1f36] to-[#2d3436]" },
  { name: "Women", slug: "women", color: "from-[#c8a96e] to-[#a08050]" },
  { name: "Kids", slug: "kids", color: "from-[#4a90d9] to-[#2d6ab8]" },
  { name: "Accessories", slug: "accessories", color: "from-[#2d3436] to-[#1a1f36]" },
  { name: "Ethnic Wear", slug: "ethnic-wear", color: "from-[#8b5e3c] to-[#6b4226]" },
  { name: "Western Wear", slug: "western-wear", color: "from-[#1a1f36] to-[#c8a96e]/70" },
  { name: "Sportswear", slug: "sportswear", color: "from-[#2d8659] to-[#1a5c3a]" },
  { name: "Footwear", slug: "footwear", color: "from-[#6c5ce7] to-[#4834d4]" },
];

// ─── Trust Badges ────────────────────────────────────────────
const trustBadges = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On orders above ₹999",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    subtitle: "7-day return policy",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    subtitle: "100% protected checkout",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    subtitle: "We're always here to help",
  },
];

// ─── Product Card ────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const { user } = useAuthStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const [wishlisted, setWishlisted] = useState(
    user?.wishlist?.includes(product._id) ?? false
  );
  const [addingToCart, setAddingToCart] = useState(false);

  const firstVariant = product.variants.find((v) => v.isActive && v.stock > 0) ?? product.variants[0];
  const image =
    firstVariant?.images?.[0] || product.thumbnail || product.images?.[0] || "https://placehold.co/400x533/1a1f36/c8a96e?text=No+Image";
  const isOnSale = firstVariant?.compareAtPrice && firstVariant.compareAtPrice > firstVariant.price;
  const discountPercent = isOnSale
    ? Math.round(((firstVariant.compareAtPrice! - firstVariant.price) / firstVariant.compareAtPrice!) * 100)
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

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="relative overflow-hidden rounded-t-xl">
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

      {/* Wishlist */}
      <button
        onClick={toggleWishlist}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            wishlisted ? "fill-red-500 text-red-500" : "text-gray-500"
          )}
        />
      </button>

      {/* Info */}
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
        <StarRating rating={product.avgRating} size="sm" showCount count={product.reviewCount} />
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
            disabled={addingToCart || !firstVariant || firstVariant.stock <= 0}
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

// ─── Product Grid Skeleton ───────────────────────────────────
function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────
function Section({
  title,
  subtitle,
  href,
  children,
  className,
  bgClass,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  bgClass?: string;
}) {
  return (
    <section className={cn("py-12 md:py-16", bgClass)}>
      <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1f36] md:text-3xl">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 md:text-base">{subtitle}</p>
            )}
          </div>
          {href && (
            <Link
              to={href}
              className="hidden items-center gap-1 text-sm font-medium text-[#c8a96e] transition-colors hover:text-[#b09458] sm:flex"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {children}
        {href && (
          <div className="mt-6 flex justify-center sm:hidden">
            <Link to={href}>
              <Button variant="outline" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function Home() {
  const [email, setEmail] = useState("");

  // Fetch featured products
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () =>
      apiGet<ApiResponse<Product[]>>("/products/featured"),
  });

  // Fetch new arrivals
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () =>
      apiGet<ApiResponse<Product[]>>("/products/new-arrivals"),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiResponse<Category[]>>("/categories"),
  });

  // Newsletter subscription
  const newsletterMutation = useMutation({
    mutationFn: (emailAddr: string) =>
      apiPost<ApiResponse<null>>("/newsletter/subscribe", { email: emailAddr }),
    onSuccess: () => {
      toast.success("Subscribed successfully! Check your inbox.");
      setEmail("");
    },
    onError: () => {
      toast.error("Failed to subscribe. Please try again.");
    },
  });

  const featuredProducts = featuredData?.data ?? [];
  const newArrivals = newArrivalsData?.data ?? [];
  const categories = categoriesData?.data;

  // Use API categories if available, otherwise fallback to static
  const displayCategories = categories
    ? categories.filter((c) => c.isActive).map((c) => ({
        name: c.name,
        slug: c.slug,
        image: c.image,
        color: categoryCards.find((cc) => cc.slug === c.slug)?.color ?? "from-[#1a1f36] to-[#2d3436]",
      }))
    : categoryCards;

  return (
    <div className="min-h-screen bg-white">
      {/* ══════════ Hero Carousel ══════════ */}
      <section className="relative">
        <Carousel
          loop
          autoplay
          autoplayDelay={5000}
          showDots
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {heroSlides.map((slide, index) => (
              <CarouselItem key={index} className="pl-0">
                <div className={cn("relative flex min-h-[420px] items-center md:min-h-[540px] lg:min-h-[600px]", slide.accent)}>
                  {/* Decorative pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                  <div className={cn("absolute inset-0 bg-gradient-to-r", slide.gradient)} />
                  <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="max-w-xl">
                      <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                        {slide.headline}
                      </h1>
                      <p className="mb-8 text-base text-gray-300 md:text-lg lg:text-xl">
                        {slide.subtitle}
                      </p>
                      <Link to={slide.href}>
                        <Button variant="accent" size="lg" className="gap-2 px-8 text-base font-semibold">
                          {slide.cta} <ArrowRight className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 hidden md:flex" />
          <CarouselNext className="right-4 hidden md:flex" />
        </Carousel>
      </section>

      {/* ══════════ Trust Badges ══════════ */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1a1f36]/5">
                  <badge.icon className="h-5 w-5 text-[#c8a96e]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a1f36]">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Shop by Category ══════════ */}
      <Section
        title="Shop by Category"
        subtitle="Find exactly what you're looking for"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {displayCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-xl"
            >
              <div
                className={cn(
                  "flex aspect-[4/3] items-end bg-gradient-to-br p-4 transition-transform duration-500 group-hover:scale-105",
                  cat.color
                )}
              >
                {/* If API provided an image, show it */}
                {"image" in cat && cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
                  />
                )}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white md:text-xl">{cat.name}</h3>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white/70 transition-colors group-hover:text-[#c8a96e]">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ══════════ Featured Collection ══════════ */}
      <Section
        title="Featured Collection"
        subtitle="Hand-picked styles just for you"
        href="/category/featured"
        bgClass="bg-gray-50/50"
      >
        {featuredLoading ? (
          <ProductGridSkeleton />
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">No featured products available right now.</p>
        )}
      </Section>

      {/* ══════════ Promo Banner ══════════ */}
      <section className="bg-[#1a1f36]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:py-12 lg:px-8">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium uppercase tracking-widest text-[#c8a96e]">
              Limited Time Offer
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Get 10% Off Your First Order
            </h2>
            <p className="mt-1 text-gray-400">
              Use code <span className="font-mono font-semibold text-[#c8a96e]">WELCOME10</span> at checkout
            </p>
          </div>
          <Link to="/category/new-arrivals">
            <Button variant="accent" size="lg" className="gap-2 whitespace-nowrap px-8 font-semibold">
              Shop Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ══════════ New Arrivals ══════════ */}
      <Section
        title="Just Arrived"
        subtitle="The latest additions to our collection"
        href="/category/new-arrivals"
      >
        {newArrivalsLoading ? (
          <ProductGridSkeleton />
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-400">New arrivals coming soon.</p>
        )}
      </Section>

      {/* ══════════ Newsletter ══════════ */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold text-[#1a1f36]">Stay in the Loop</h2>
            <p className="mt-2 text-sm text-gray-500">
              Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                newsletterMutation.mutate(email.trim());
              }}
              className="mt-6 flex gap-3"
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                variant="accent"
                disabled={newsletterMutation.isPending}
                className="gap-2 whitespace-nowrap px-6"
              >
                {newsletterMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
