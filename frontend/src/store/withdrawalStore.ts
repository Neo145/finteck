import { create } from "zustand";
import api from "@/lib/api";

interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  status: string;
  upi_id: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_account_name: string | null;
  admin_note: string | null;
  transaction_ref: string | null;
  created_at: string;
}

interface WithdrawalState {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  fetchWithdrawals: () => Promise<void>;
  requestWithdrawal: (data: any) => Promise<void>;
}

export const useWithdrawalStore = create<WithdrawalState>((set) => ({
  withdrawals: [],
  isLoading: false,

  fetchWithdrawals: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/withdrawals/my-withdrawals");
      set({ withdrawals: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  requestWithdrawal: async (data: any) => {
    set({ isLoading: true });
    try {
      await api.post("/withdrawals/request", data);
    } finally {
      set({ isLoading: false });
    }
  },
}));