import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FintechPay — Smart Payments",
  description: "Secure • Fast • Reliable",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}