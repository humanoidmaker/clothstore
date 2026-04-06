import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartDrawerOpen);
  const toggleCartDrawer = useUIStore((s) => s.toggleCartDrawer);
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) toggleCartDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, toggleCartDrawer]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleCartDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1a1f36] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Shopping Cart
            <span className="text-sm font-normal text-[#2d3436]/60">
              ({count} {count === 1 ? "item" : "items"})
            </span>
          </h2>
          <button
            onClick={toggleCartDrawer}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-[#2d3436]" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-medium text-[#2d3436] mb-2">
              Your cart is empty
            </p>
            <p className="text-sm text-[#2d3436]/60 mb-6">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/"
              onClick={toggleCartDrawer}
              className="inline-flex items-center px-6 py-2.5 bg-[#1a1f36] text-white text-sm font-medium rounded-lg hover:bg-[#1a1f36]/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 pb-4 border-b border-gray-50 last:border-0"
              >
                {/* Thumbnail */}
                <Link
                  to={`/product/${item.product.slug}`}
                  onClick={toggleCartDrawer}
                  className="flex-shrink-0 w-20 h-24 bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={item.product.thumbnail || item.product.images?.[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.slug}`}
                    onClick={toggleCartDrawer}
                    className="text-sm font-medium text-[#1a1f36] hover:text-[#c8a96e] transition-colors line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {item.variant.size && (
                      <span className="text-xs text-[#2d3436]/60">
                        Size: {item.variant.size}
                      </span>
                    )}
                    {item.variant.color && (
                      <span className="text-xs text-[#2d3436]/60 flex items-center gap-1">
                        Color:
                        {item.variant.colorHex && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.variant.colorHex }}
                          />
                        )}
                        {item.variant.color}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-gray-200 rounded-md">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(item._id, item.quantity - 1)
                            : removeItem(item._id)
                        }
                        className="p-1.5 hover:bg-gray-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 text-[#2d3436]" />
                      </button>
                      <span className="px-3 text-sm font-medium text-[#1a1f36] min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#2d3436]" />
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-semibold text-[#1a1f36]">
                      {formatPrice(item.variant.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item._id)}
                  className="flex-shrink-0 self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#2d3436]/70">Subtotal</span>
              <span className="text-lg font-bold text-[#1a1f36]">
                {formatPrice(subtotal())}
              </span>
            </div>
            <p className="text-xs text-[#2d3436]/50">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/cart"
                onClick={toggleCartDrawer}
                className="flex items-center justify-center px-4 py-2.5 border border-[#1a1f36] text-[#1a1f36] text-sm font-medium rounded-lg hover:bg-[#1a1f36] hover:text-white transition-colors"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={toggleCartDrawer}
                className="flex items-center justify-center px-4 py-2.5 bg-[#c8a96e] text-white text-sm font-medium rounded-lg hover:bg-[#b89555] transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
