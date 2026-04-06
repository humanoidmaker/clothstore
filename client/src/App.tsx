import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

// Eager-loaded
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";

// Auth pages
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

// Shop pages
const ProductListing = lazy(() => import("@/pages/ProductListing"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Search = lazy(() => import("@/pages/Search"));

// Account pages
const Account = lazy(() => import("@/pages/Account"));
const AccountDashboard = lazy(() => import("@/pages/AccountDashboard"));
const AccountProfile = lazy(() => import("@/pages/AccountProfile"));
const AccountAddresses = lazy(() => import("@/pages/AccountAddresses"));
const AccountOrders = lazy(() => import("@/pages/AccountOrders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const AccountWishlist = lazy(() => import("@/pages/AccountWishlist"));
const ChangePassword = lazy(() => import("@/pages/ChangePassword"));

// Admin pages
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));

// Static pages
const AboutUs = lazy(() => import("@/pages/static/AboutUs"));
const Contact = lazy(() => import("@/pages/static/Contact"));
const FAQ = lazy(() => import("@/pages/static/FAQ"));
const ShippingPolicy = lazy(() => import("@/pages/static/ShippingPolicy"));
const ReturnPolicy = lazy(() => import("@/pages/static/ReturnPolicy"));
const Terms = lazy(() => import("@/pages/static/Terms"));
const Privacy = lazy(() => import("@/pages/static/Privacy"));
const NotFound = lazy(() => import("@/pages/static/NotFound"));

// Protected route wrapper
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#c8a96e]" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Home */}
          <Route index element={<Home />} />

          {/* Shop */}
          <Route path="category/:slug" element={<ProductListing />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="search" element={<Search />} />

          {/* Auth */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          {/* Account */}
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountDashboard />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>

          {/* Static pages */}
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="shipping-policy" element={<ShippingPolicy />} />
          <Route path="return-policy" element={<ReturnPolicy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="privacy" element={<Privacy />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
