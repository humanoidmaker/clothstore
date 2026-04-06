import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Phone,
  Mail,
  Truck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  Settings,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { apiGet } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import MegaMenu, { NAV_CATEGORIES } from "./MegaMenu";
import type { Product, ApiResponse, PaginatedResponse } from "@/types";

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const {
    isMobileMenuOpen,
    isSearchOpen,
    toggleMobileMenu,
    toggleSearch,
    toggleCartDrawer,
    closeAll,
  } = useUIStore();

  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch cart + wishlist on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      apiGet<ApiResponse<{ count: number }>>("/wishlist/count")
        .then((res) => setWishlistCount(res.data.count))
        .catch(() => setWishlistCount(user?.wishlist?.length ?? 0));
    }
  }, [isAuthenticated, fetchCart, user?.wishlist?.length]);

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close user menu / search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiGet<ApiResponse<PaginatedResponse<Product>>>(
        "/products",
        { search: query.trim(), limit: 6 }
      );
      setSearchResults(res.data.data);
    } catch {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchFocused(false);
      closeAll();
    }
  }

  function handleSearchResultClick(slug: string) {
    navigate(`/product/${slug}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
    closeAll();
  }

  function handleMegaMenuEnter(slug: string) {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setActiveMegaMenu(slug);
  }

  function handleMegaMenuLeave() {
    megaMenuTimeoutRef.current = setTimeout(() => setActiveMegaMenu(null), 150);
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* ========== Top Bar (desktop only) ========== */}
      <div className="hidden lg:block bg-[#1a1f36] text-white/80 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +91 98765 43210
            </a>
            <a
              href="mailto:support@clothstore.in"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              support@clothstore.in
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-[#c8a96e]">
            <Truck className="w-3.5 h-3.5" />
            <span>Free Shipping on orders above ₹999</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ========== Main Header ========== */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 lg:h-[72px] flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-[#1a1f36]" />
            ) : (
              <Menu className="w-6 h-6 text-[#1a1f36]" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center" onClick={closeAll}>
            <span className="text-2xl lg:text-[28px] font-bold tracking-tight">
              <span className="text-[#1a1f36]">Cloth</span>
              <span className="text-[#c8a96e]">Store</span>
            </span>
          </Link>

          {/* Desktop search */}
          <div
            ref={searchContainerRef}
            className="hidden lg:flex flex-1 max-w-xl mx-8 relative"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search for products, brands..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-[#2d3436] placeholder:text-gray-400 focus:outline-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e]/30 transition-all"
                />
              </div>
            </form>

            {/* Search dropdown */}
            {isSearchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <>
                    <div className="max-h-[380px] overflow-y-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product._id}
                          onClick={() => handleSearchResultClick(product.slug)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.thumbnail || product.images?.[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1f36] truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#2d3436]/60">
                              {product.brand}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-[#1a1f36] flex-shrink-0">
                            {product.variants?.[0]
                              ? formatPrice(product.variants[0].price)
                              : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSearchSubmit as unknown as () => void}
                      className="w-full px-4 py-3 text-sm text-[#c8a96e] font-medium hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[#2d3436]/60">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 lg:gap-2 ml-auto">
            {/* Mobile search icon */}
            <button
              onClick={toggleSearch}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-[#1a1f36]" />
            </button>

            {/* User menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5 text-[#1a1f36]" />
                {isAuthenticated && user && (
                  <span className="hidden lg:inline text-sm text-[#2d3436] max-w-[80px] truncate">
                    Hi, {user.firstName}
                  </span>
                )}
                <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-[#1a1f36]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[#2d3436]/60 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        Wishlist
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#2d3436] hover:bg-gray-50 transition-colors"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-[#1a1f36]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#c8a96e] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCartDrawer}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#1a1f36]" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#c8a96e] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========== Category Navigation (desktop) ========== */}
      <nav className="hidden lg:block bg-white border-b border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center gap-0">
            {NAV_CATEGORIES.map((cat) => (
              <li
                key={cat.slug}
                className="relative"
                onMouseEnter={() => handleMegaMenuEnter(cat.slug)}
                onMouseLeave={handleMegaMenuLeave}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeMegaMenu === cat.slug
                      ? "text-[#c8a96e]"
                      : "text-[#2d3436] hover:text-[#c8a96e]"
                  }`}
                >
                  {cat.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mega menus */}
        {NAV_CATEGORIES.map((cat) => (
          <div
            key={cat.slug}
            onMouseEnter={() => handleMegaMenuEnter(cat.slug)}
            onMouseLeave={handleMegaMenuLeave}
          >
            <MegaMenu category={cat} isOpen={activeMegaMenu === cat.slug} />
          </div>
        ))}
      </nav>

      {/* ========== Mobile Search Overlay ========== */}
      <div
        className={`lg:hidden fixed inset-0 bg-white z-[80] transition-all duration-300 ${
          isSearchOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c8a96e]"
              />
            </div>
          </form>
          <button
            onClick={() => {
              toggleSearch();
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#2d3436]" />
          </button>
        </div>

        {/* Mobile search results */}
        <div className="overflow-y-auto max-h-[calc(100vh-64px)]">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {searchResults.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSearchResultClick(product.slug)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.thumbnail || product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1f36] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#2d3436]/60">{product.brand}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#1a1f36] flex-shrink-0">
                    {product.variants?.[0]
                      ? formatPrice(product.variants[0].price)
                      : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-[#2d3436]/60">
                No results found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-[#2d3436]/60">
                Start typing to search products
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== Mobile Menu Drawer ========== */}
      <>
        {/* Backdrop */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          className={`lg:hidden fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <Link to="/" onClick={closeAll}>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-[#1a1f36]">Cloth</span>
                <span className="text-[#c8a96e]">Store</span>
              </span>
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-[#2d3436]" />
            </button>
          </div>

          {/* User section */}
          <div className="px-5 py-4 border-b border-gray-100">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a1f36] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1a1f36]">
                    {user.firstName} {user.lastName}
                  </p>
                  <Link
                    to="/account"
                    onClick={closeAll}
                    className="text-xs text-[#c8a96e]"
                  >
                    View Account
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  onClick={closeAll}
                  className="flex-1 text-center px-4 py-2 bg-[#1a1f36] text-white text-sm font-medium rounded-lg hover:bg-[#1a1f36]/90 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeAll}
                  className="flex-1 text-center px-4 py-2 border border-[#1a1f36] text-[#1a1f36] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Category accordion */}
          <div className="py-2">
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.slug} className="border-b border-gray-50">
                <button
                  onClick={() =>
                    setMobileAccordion((prev) =>
                      prev === cat.slug ? null : cat.slug
                    )
                  }
                  className="flex items-center justify-between w-full px-5 py-3 text-sm font-medium text-[#1a1f36] hover:bg-gray-50 transition-colors"
                >
                  {cat.label}
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      mobileAccordion === cat.slug ? "rotate-90" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    mobileAccordion === cat.slug
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-8 pr-5 pb-3 space-y-0.5">
                    <Link
                      to={`/category/${cat.slug}`}
                      onClick={closeAll}
                      className="block py-2 text-sm text-[#c8a96e] font-medium"
                    >
                      View All {cat.label}
                    </Link>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/category/${sub.slug}`}
                        onClick={closeAll}
                        className="block py-2 text-sm text-[#2d3436]/70 hover:text-[#c8a96e] transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="px-5 py-4 space-y-1 border-t border-gray-100">
            <Link
              to="/account/orders"
              onClick={closeAll}
              className="flex items-center gap-3 py-2.5 text-sm text-[#2d3436] hover:text-[#c8a96e] transition-colors"
            >
              <Package className="w-4 h-4" />
              My Orders
            </Link>
            <Link
              to="/wishlist"
              onClick={closeAll}
              className="flex items-center gap-3 py-2.5 text-sm text-[#2d3436] hover:text-[#c8a96e] transition-colors"
            >
              <Heart className="w-4 h-4" />
              Wishlist
            </Link>
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={closeAll}
                className="flex items-center gap-3 py-2.5 text-sm text-[#2d3436] hover:text-[#c8a96e] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            {isAuthenticated && (
              <button
                onClick={() => {
                  closeAll();
                  logout();
                }}
                className="flex items-center gap-3 py-2.5 text-sm text-red-600 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>

          {/* Contact info */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 text-xs text-[#2d3436]/60"
            >
              <Phone className="w-3.5 h-3.5" />
              +91 98765 43210
            </a>
            <a
              href="mailto:support@clothstore.in"
              className="flex items-center gap-2 text-xs text-[#2d3436]/60"
            >
              <Mail className="w-3.5 h-3.5" />
              support@clothstore.in
            </a>
          </div>
        </div>
      </>
    </header>
  );
}
