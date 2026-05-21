import api from "@/lib/api";

interface CashfreeOptions {
  amount: number;
  onSuccess: () => void;
  onError: () => void;
}

export const useCashfree = () => {
  const initiatePayment = async ({ amount, onSuccess, onError }: CashfreeOptions) => {
    try:
      const res = await api.post(`/cashfree/create-order?amount=${amount}`);
      const order = res.data;

      const cashfree = (window as any).Cashfree({
        mode: "sandbox"
      });

      const checkoutOptions = {
        paymentSessionId: order.payment_session_id,
        returnUrl: `${window.location.origin}/dashboard`,
        onSuccess: async (data: any) => {
          try {
            await api.post(`/cashfree/verify?order_id=${order.order_id}`);
            onSuccess();
          } catch {
            onError();
          }
        },
        onError: (error: any) => {
          console.error("Cashfree error:", error);
          onError();
        },
      };

      cashfree.checkout(checkoutOptions);
    } catch (err) {
      onError();
    }
  };

  return { initiatePayment };
};