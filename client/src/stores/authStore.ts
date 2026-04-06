import { create } from "zustand";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { User, ApiResponse } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<
        ApiResponse<{ user: User; accessToken: string }>
      >("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      set({ user: res.data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<
        ApiResponse<{ user: User; accessToken: string }>
      >("/auth/register", data);
      localStorage.setItem("accessToken", res.data.accessToken);
      set({ user: res.data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await apiGet<ApiResponse<User>>("/auth/me");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await apiPut<ApiResponse<User>>("/auth/me", data);
    set({ user: res.data });
  },

  clearAuth: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
