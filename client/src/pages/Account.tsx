import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  MapPin,
  Package,
  Heart,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard, exact: true },
  { label: "Profile", href: "/account/profile", icon: User, exact: false },
  { label: "Addresses", href: "/account/addresses", icon: MapPin, exact: false },
  { label: "Orders", href: "/account/orders", icon: Package, exact: false },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart, exact: false },
  { label: "Change Password", href: "/account/change-password", icon: KeyRound, exact: false },
];

export default function Account() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  const isActive = (href: string, exact: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {/* User info */}
            <div className="mb-6 flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1f36] text-sm font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1a1f36]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Navigation */}
            <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-l-[3px] border-[#c8a96e] bg-[#c8a96e]/5 text-[#1a1f36] lg:rounded-l-none"
                        : "border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#1a1f36]"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-4" />

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Content area */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
