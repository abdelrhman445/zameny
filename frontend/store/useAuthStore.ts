import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Merchant } from '@/types';
import { setToken, removeToken } from '@/lib/api';

interface AuthState {
  merchant: Merchant | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (merchant: Merchant, token: string) => void;
  logout: () => void;
  setMerchant: (merchant: Merchant) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      merchant: null,
      token: null,
      isLoading: false,

      setAuth: (merchant: Merchant, token: string) => {
        setToken(token);
        set({ merchant, token, isLoading: false });
      },

      logout: () => {
        removeToken();
        set({ merchant: null, token: null });
      },

      setMerchant: (merchant: Merchant) => {
        set({ merchant });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'aee-auth',
      partialize: (state) => ({ merchant: state.merchant, token: state.token }),
    }
  )
);
