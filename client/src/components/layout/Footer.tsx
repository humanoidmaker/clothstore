import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function Footer() {
  const { isAuthenticated } = useAuthStore();

  return (
    <footer className="bg-[#1a1f36]">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1 - About */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-white">Cloth</span>
                <span className="text-[#c8a96e]">Store</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Your destination for premium fashion. Quality clothing for men,
              women, and kids.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#c8a96e] hover:text-white transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#c8a96e] hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#c8a96e] hover:text-white transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#c8a96e] hover:text-white transition-all"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2 - Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Customer Service
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Contact Us", path: "/page/contact" },
                { label: "FAQ", path: "/page/faq" },
                { label: "Shipping Policy", path: "/page/shipping-policy" },
                { label: "Return Policy", path: "/page/return-policy" },
                { label: "Terms & Conditions", path: "/page/terms" },
                { label: "Privacy Policy", path: "/page/privacy-policy" },
              ].map(({ label, path }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - My Account */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              My Account
            </h3>
            <ul className="space-y-3">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      to="/account"
                      className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                    >
                      My Account
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                  >
                    Login / Register
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/account/orders"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  to="/wishlist"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  to="/account/addresses"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  Addresses
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              Contact Info
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#c8a96e] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/60">
                  123 Fashion Street, Andheri West,
                  <br />
                  Mumbai, Maharashtra 400058, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#c8a96e] flex-shrink-0" />
                <a
                  href="tel:+919876543210"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#c8a96e] flex-shrink-0" />
                <a
                  href="mailto:support@clothstore.in"
                  className="text-sm text-white/60 hover:text-[#c8a96e] transition-colors"
                >
                  support@clothstore.in
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#c8a96e] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/60">
                  Mon - Sat: 10:00 AM - 8:00 PM
                  <br />
                  Sunday: Closed
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            &copy; 2024 ClothStore. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {["Visa", "Mastercard", "RuPay", "UPI"].map((method) => (
              <span
                key={method}
                className="px-2.5 py-1 bg-white/10 rounded text-[10px] font-medium text-white/70 uppercase tracking-wide"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
