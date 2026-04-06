// ===== User & Auth =====

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "customer" | "admin";
  addresses: Address[];
  wishlist: string[];
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// ===== Category =====

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Product =====

export interface ProductVariant {
  _id: string;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  category: string | Category;
  subcategory?: string | Category;
  tags: string[];
  variants: ProductVariant[];
  images: string[];
  thumbnail: string;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  material?: string;
  careInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  rating?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  search?: string;
  page?: number;
  limit?: number;
}

// ===== Cart =====

export interface CartItem {
  _id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon?: string;
}

// ===== Wishlist =====

export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

// ===== Order =====

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export interface OrderItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  price: number;
  name: string;
  image: string;
  size: string;
  color: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: "cod" | "online" | "upi";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon?: string;
  trackingId?: string;
  trackingUrl?: string;
  notes?: string;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutData {
  addressId: string;
  paymentMethod: "cod" | "online" | "upi";
  couponCode?: string;
  notes?: string;
}

// ===== Review =====

export interface Review {
  _id: string;
  user: Pick<User, "_id" | "firstName" | "lastName" | "avatar">;
  product: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Coupon =====

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

// ===== API Response Types =====

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}
