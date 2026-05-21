import api from "@/lib/api";

interface CashfreeOptions {
  amount: number;
  onSuccess: () => void;
  onError: () => void;
}

export const useCashfree = () => {
  const initiatePayment = async ({ amount, onSuccess, onError }: CashfreeOptions) => {
    try {
      const res = await api.post(`/cashfree/create-order?amount=${amount}`);
      const order = res.data;

      const cashfree = (window as any).Cashfree({
        mode: "sandbox"
      });

      cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        returnUrl: `${window.location.origin}/dashboard`,
      }).then(async (result: any) => {
        if (result.error) {
          onError();
        } else {
          try {
            await api.post(`/cashfree/verify?order_id=${order.order_id}`);
            onSuccess();
          } catch {
            onError();
          }
        }
      });
    } catch (err) {
      onError();
    }
  };

  return { initiatePayment };
};