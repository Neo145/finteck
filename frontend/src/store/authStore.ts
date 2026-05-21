import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: string;
  kyc_status: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOTP: (phone: string) => Promise<string>;
  verifyOTP: (phone: string, otp: string, full_name?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  sendOTP: async (phone: string) => {
    const res = await api.post("/auth/send-otp", { phone });
    return res.data.dev_otp;
  },

  verifyOTP: async (phone: string, otp: string, full_name?: string) => {
    const res = await api.post("/auth/verify-otp", {
      phone,
      otp,
      full_name: full_name || "User",
    });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    const profileRes = await api.get("/users/me");
    set({
      user: profileRes.data,
      isAuthenticated: true,
    });
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await api.get("/users/me");
      set({ user: res.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },
}));