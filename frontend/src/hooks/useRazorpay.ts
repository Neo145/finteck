import api from "@/lib/api";

interface RazorpayOptions {
  amount: number;
  onSuccess: () => void;
  onError: () => void;
}

export const useRazorpay = () => {
  const initiatePayment = async ({ amount, onSuccess, onError }: RazorpayOptions) => {
    try {
      // Create order from backend
      const res = await api.post("/payments/create-order", { amount });
      const order = res.data;

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "FintechPlatform",
        description: "Wallet Top-up",
        order_id: order.order_id,
        prefill: {
          name: order.user_name,
          email: order.user_email,
          contact: order.user_phone,
        },
        theme: {
          color: "#4F46E5",
        },
        handler: async (response: any) => {
          try {
            // Verify payment with backend
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess();
          } catch {
            onError();
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment dismissed");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      onError();
    }
  };

  return { initiatePayment };
};