import { create } from "zustand";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { CartItem, ApiResponse } from "@/types";

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<ApiResponse<CartItem[]>>("/cart");
      set({ items: res.data });
    } catch {
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (variantId, quantity) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<ApiResponse<CartItem[]>>("/cart", {
        variantId,
        quantity,
      });
      set({ items: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      const res = await apiPut<ApiResponse<CartItem[]>>(`/cart/${itemId}`, {
        quantity,
      });
      set({ items: res.data });
    } catch {
      // Revert on failure by re-fetching
      await get().fetchCart();
    }
  },

  removeItem: async (itemId) => {
    const prevItems = get().items;
    // Optimistic removal
    set({ items: prevItems.filter((item) => item._id !== itemId) });
    try {
      await apiDelete(`/cart/${itemId}`);
    } catch {
      set({ items: prevItems });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await apiDelete("/cart");
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  subtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.variant.price * item.quantity,
      0
    );
  },
}));
