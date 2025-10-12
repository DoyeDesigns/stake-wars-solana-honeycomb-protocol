import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
  accessToken: string | null;
  tokenExpiry: number | null;
  setAccessToken: (token: string | null) => void;
  clearAccessToken: () => void;
  isTokenValid: () => boolean;
};

const TOKEN_EXPIRY_HOURS = 12; // Token valid for 12 hours

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      tokenExpiry: null,
      
      setAccessToken: (token) => {
        const expiry = token ? Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000) : null;
        set({ accessToken: token, tokenExpiry: expiry });
      },
      
      clearAccessToken: () => set({ accessToken: null, tokenExpiry: null }),
      
      isTokenValid: () => {
        const { accessToken, tokenExpiry } = get();
        if (!accessToken || !tokenExpiry) return false;
        return Date.now() < tokenExpiry;
      },
    }),
    {
      name: "auth-storage", // localStorage key
    }
  )
);


