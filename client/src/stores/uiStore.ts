import { create } from "zustand";

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isCartDrawerOpen: boolean;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  toggleCartDrawer: () => void;
  closeAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isCartDrawerOpen: false,

  toggleMobileMenu: () =>
    set((state) => ({
      isMobileMenuOpen: !state.isMobileMenuOpen,
      isSearchOpen: false,
      isCartDrawerOpen: false,
    })),

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      isMobileMenuOpen: false,
      isCartDrawerOpen: false,
    })),

  toggleCartDrawer: () =>
    set((state) => ({
      isCartDrawerOpen: !state.isCartDrawerOpen,
      isMobileMenuOpen: false,
      isSearchOpen: false,
    })),

  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isSearchOpen: false,
      isCartDrawerOpen: false,
    }),
}));
