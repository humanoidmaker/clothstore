export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700" },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-blue-50 text-blue-700",
  },
  {
    value: "processing",
    label: "Processing",
    color: "bg-indigo-50 text-indigo-700",
  },
  { value: "shipped", label: "Shipped", color: "bg-purple-50 text-purple-700" },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "bg-orange-50 text-orange-700",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-50 text-green-700",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    color: "bg-red-50 text-red-700",
  },
  {
    value: "returned",
    label: "Returned",
    color: "bg-gray-50 text-gray-700",
  },
  {
    value: "refunded",
    label: "Refunded",
    color: "bg-pink-50 text-pink-700",
  },
] as const;

export const NAV_CATEGORIES = [
  {
    name: "Men",
    slug: "men",
    subcategories: [
      { name: "T-Shirts", slug: "t-shirts" },
      { name: "Shirts", slug: "shirts" },
      { name: "Jeans", slug: "jeans" },
      { name: "Trousers", slug: "trousers" },
      { name: "Jackets", slug: "jackets" },
      { name: "Suits", slug: "suits" },
      { name: "Ethnic Wear", slug: "ethnic-wear" },
      { name: "Activewear", slug: "activewear" },
    ],
  },
  {
    name: "Women",
    slug: "women",
    subcategories: [
      { name: "Dresses", slug: "dresses" },
      { name: "Tops", slug: "tops" },
      { name: "Sarees", slug: "sarees" },
      { name: "Kurtis", slug: "kurtis" },
      { name: "Jeans", slug: "jeans" },
      { name: "Skirts", slug: "skirts" },
      { name: "Ethnic Wear", slug: "ethnic-wear" },
      { name: "Activewear", slug: "activewear" },
    ],
  },
  {
    name: "Kids",
    slug: "kids",
    subcategories: [
      { name: "Boys", slug: "boys" },
      { name: "Girls", slug: "girls" },
      { name: "Infants", slug: "infants" },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    subcategories: [
      { name: "Watches", slug: "watches" },
      { name: "Belts", slug: "belts" },
      { name: "Bags", slug: "bags" },
      { name: "Sunglasses", slug: "sunglasses" },
      { name: "Jewellery", slug: "jewellery" },
    ],
  },
] as const;

export const TRUST_BADGES = [
  {
    icon: "Truck",
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: "RotateCcw",
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: "Shield",
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: "Headphones",
    title: "24/7 Support",
    description: "Dedicated customer care",
  },
] as const;

export const HERO_SLIDES = [
  {
    id: 1,
    title: "Summer Collection 2026",
    subtitle: "Discover the latest trends in premium fashion",
    cta: "Shop Now",
    ctaLink: "/category/summer-collection",
    image: "/images/hero/summer-collection.jpg",
    bgColor: "bg-gradient-to-r from-primary-800 to-primary-600",
  },
  {
    id: 2,
    title: "Ethnic Elegance",
    subtitle: "Handcrafted traditional wear for every occasion",
    cta: "Explore Collection",
    ctaLink: "/category/ethnic-wear",
    image: "/images/hero/ethnic-wear.jpg",
    bgColor: "bg-gradient-to-r from-accent-dark to-accent",
  },
  {
    id: 3,
    title: "Flat 50% Off",
    subtitle: "End of season sale on premium brands",
    cta: "Grab Deals",
    ctaLink: "/sale",
    image: "/images/hero/sale.jpg",
    bgColor: "bg-gradient-to-r from-red-700 to-red-500",
  },
  {
    id: 4,
    title: "New Arrivals",
    subtitle: "Be the first to wear the newest styles",
    cta: "View New In",
    ctaLink: "/new-arrivals",
    image: "/images/hero/new-arrivals.jpg",
    bgColor: "bg-gradient-to-r from-primary to-primary-700",
  },
] as const;
