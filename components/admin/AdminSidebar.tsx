"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3, 
  Settings, LogOut, ArrowLeft, Menu, X, Sparkles, FolderTree, Image, Wrench, Tag, ShieldCheck, CreditCard,
  MessageSquare
} from "lucide-react";

interface AdminSidebarProps {
  session: any;
}

export default function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unseenReviewsCount, setUnseenReviewsCount] = useState(0);

  const adminLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Homepage Config", href: "/admin/homepage", icon: Image },
    { name: "Cycle Services", href: "/admin/services", icon: Wrench },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Warranty Claims", href: "/admin/warranty", icon: ShieldCheck },
    { name: "Product Reviews", href: "/admin/reviews", icon: MessageSquare },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Coupons", href: "/admin/coupons", icon: Tag },
    { name: "EMI Options", href: "/admin/emi", icon: CreditCard },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    async function fetchUnseenCount() {
      try {
        const res = await fetch("/api/admin/reviews");
        if (res.ok) {
          const data = await res.json();
          setUnseenReviewsCount(data.unseenCount || 0);
        } else {
          loadSimulatedUnseenCount();
        }
      } catch (e) {
        loadSimulatedUnseenCount();
      }
    }

    const loadSimulatedUnseenCount = () => {
      try {
        const simReviewsStr = localStorage.getItem("vega_sim_reviews");
        if (simReviewsStr) {
          const simReviews = JSON.parse(simReviewsStr);
          const unseen = simReviews.filter((r: any) => !r.seen).length;
          setUnseenReviewsCount(unseen);
        }
      } catch (err) {}
    };

    fetchUnseenCount();

    const handleReviewsUpdate = () => {
      fetchUnseenCount();
    };
    window.addEventListener("vega_admin_reviews_updated", handleReviewsUpdate);
    return () => {
      window.removeEventListener("vega_admin_reviews_updated", handleReviewsUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/account";
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden w-full h-16 bg-[var(--charcoal)] border-b border-[var(--steel)] px-4 flex items-center justify-between z-40 relative">
        <Link href="/" className="flex items-center space-x-1.5">
          <img
            src="/logo.png"
            alt="Vyorax Logo"
            className="h-6 w-auto object-contain"
          />
          <span className="text-xs font-sans font-bold text-[var(--gold-light)] uppercase">Admin</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-72 flex-shrink-0 bg-[var(--charcoal)] border-r border-[var(--steel)]/60 p-6 flex flex-col justify-between transition-transform duration-300 h-screen overflow-y-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="pb-4 border-b border-[var(--steel)]/40 hidden md:block">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Vyorax Logo"
                className="h-7 w-auto object-contain"
              />
              <span className="text-xs font-sans font-bold text-[var(--gold-light)] uppercase">Admin</span>
            </Link>
            <p className="text-[10px] text-[var(--smoke)] uppercase font-mono tracking-wider mt-1.5">
              Control Panel v1.0
            </p>
          </div>

          {/* Links list */}
          <nav className="space-y-1.5">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isReviews = link.name === "Product Reviews";
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-[var(--agni)] text-neutral-50"
                      : "hover:bg-[var(--carbon)] text-[var(--silver)] hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={14} />
                    <span>{link.name}</span>
                  </div>
                  {isReviews && unseenReviewsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-600 text-white rounded-full animate-pulse">
                      {unseenReviewsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-2.5 pt-6 border-t border-[var(--steel)]/40">
          <Link
            href="/"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider text-[var(--silver)] hover:text-white hover:bg-[var(--carbon)] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
