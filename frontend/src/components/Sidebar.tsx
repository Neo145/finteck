"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { label: "Dashboard", icon: "🏠", href: "/dashboard" },
  { label: "Wallet", icon: "👛", href: "/dashboard/wallet" },
  { label: "Transactions", icon: "🔄", href: "/dashboard/transactions" },
  { label: "Payment Links", icon: "🔗", href: "/dashboard/payment-links" },
  { label: "Withdraw", icon: "💸", href: "/dashboard/withdraw" },
];

const serviceItems = [
  { label: "Bus Booking", icon: "🚌", href: "/dashboard/bus", badge: null },
  { label: "Movies", icon: "🎬", href: "/dashboard/movies", badge: null },
  { label: "Recharge", icon: "📱", href: "/dashboard/recharge", badge: null },
  { label: "Bill Pay", icon: "🧾", href: "/dashboard/bills", badge: "New" },
];

const accountItems = [
  { label: "Profile", icon: "👤", href: "/dashboard/profile" },
  { label: "KYC", icon: "🛡️", href: "/dashboard/kyc" },
  { label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const NavItem = ({ item }: { item: any }) => (
    <button
      onClick={() => router.push(item.href)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 10px",
        borderRadius: "8px",
        fontSize: "13px",
        border: "none",
        cursor: "pointer",
        marginBottom: "2px",
        background: pathname === item.href ? "rgba(99,102,241,0.15)" : "transparent",
        color: pathname === item.href ? "#818cf8" : "rgba(255,255,255,0.5)",
        transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "15px" }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          background: "#6366f1", color: "#fff",
          fontSize: "10px", padding: "1px 6px",
          borderRadius: "20px"
        }}>{item.badge}</span>
      )}
    </button>
  );

  return (
    <aside style={{
      width: "200px",
      minHeight: "100vh",
      background: "#0f0f1a",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ padding: "24px 20px", fontSize: "16px", fontWeight: 600, color: "#fff", letterSpacing: "-0.3px" }}>
        Fintech<span style={{ color: "#6366f1" }}>Pay</span>
      </div>

      <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "0 8px", marginBottom: "6px" }}>Main</p>
          {navItems.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "0 8px", marginBottom: "6px" }}>Services</p>
          {serviceItems.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
        <div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", padding: "0 8px", marginBottom: "6px" }}>Account</p>
          {accountItems.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", marginBottom: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "#6366f1", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontSize: "12px",
            fontWeight: 600, flexShrink: 0
          }}>
            {user?.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#fff", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {user?.full_name}
            </p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
              {user?.phone}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "9px",
            background: "rgba(239,68,68,0.1)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}