import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  Star,
  Store,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Products", path: "/admin/products", icon: Package },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Categories", path: "/admin/categories", icon: FolderTree },
  { label: "Coupons", path: "/admin/coupons", icon: Tag },
  { label: "Reviews", path: "/admin/reviews", icon: Star },
] as const;

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function isActive(path: string, exact?: boolean) {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ========== Mobile backdrop ========== */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ========== Sidebar ========== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#1a1f36] text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 flex-shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">Cloth</span>
              <span className="text-[#c8a96e]">Store</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-3">
            Admin Panel
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {SIDEBAR_ITEMS.map(({ label, path, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[#c8a96e] text-white shadow-md shadow-[#c8a96e]/20"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Back to store */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <Store className="w-[18px] h-[18px]" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* ========== Main content ========== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-[#2d3436]" />
          </button>

          {/* Breadcrumb-style back button */}
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:flex items-center gap-1 text-sm text-[#2d3436]/60 hover:text-[#2d3436] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="ml-auto flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1a1f36] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#1a1f36] leading-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-[#2d3436]/60 leading-tight">
                    Administrator
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-[#2d3436]/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
