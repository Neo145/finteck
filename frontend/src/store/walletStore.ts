import { create } from "zustand";
import api from "@/lib/api";

interface Transaction {
  id: string;
  transaction_type: string;
  transaction_status: string;
  category: string;
  amount: string;
  commission: string;
  net_amount: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

interface Wallet {
  id: string;
  balance: string;
  currency: string;
  is_active: boolean;
}

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  total: number;
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  simulateAddMoney: (amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  transactions: [],
  total: 0,
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/wallet/balance");
      set({ wallet: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/wallet/transactions?page=${page}&page_size=10`);
      set({
        transactions: res.data.transactions,
        total: res.data.total,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  simulateAddMoney: async (amount: number) => {
    set({ isLoading: true });
    try {
      const res = await api.post(
        `/wallet/add-money/simulate?amount=${amount}`
      );
      set({ wallet: res.data });
    } finally {
      set({ isLoading: false });
    }
  },
}));