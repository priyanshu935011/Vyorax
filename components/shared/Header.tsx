"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, useWishlistStore, useCompareStore } from "@/lib/store";
import {
  ShoppingBag,
  Heart,
  User,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  Home,
  Wrench,
  Search,
  X,
} from "lucide-react";
import GlobalSearch from "@/components/shared/GlobalSearch";
import { MOCK_CATEGORIES } from "@/lib/mockData";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartItems = useCartStore((state) => state.items);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const wishlistItems = useWishlistStore((state) => state.items);
  const compareItems = useCompareStore((state) => state.products);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const compareCount = compareItems.length;

  const isAdmin = session?.user?.role === "ADMIN";

  const navLinks = [
    { name: "Cycles", href: "/products?category=cycles" },
    { name: "E-Cycles", href: "/products?category=electric-cycles" },
    { name: "Fitness", href: "/products?category=fitness" },
    { name: "Gear", href: "/products?category=sports" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Servicing", href: "/servicing" },
    { name: "Repairing", href: "/repairing" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all duration-300 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Vyorax Logo"
                className="h-5 object-contain"
              />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-grow max-w-xs lg:max-w-sm xl:max-w-md ml-12 mr-6">
            <GlobalSearch />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 mr-6 lg:mr-10">
            <Link
              href="/products"
              className={`text-sm font-sans tracking-wide uppercase transition-colors hover:text-[var(--agni)] ${
                pathname === "/products"
                  ? "text-[var(--agni)]"
                  : "text-[var(--white)]"
              }`}
            >
              All Products
            </Link>

            {/* Services Hover Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button className="flex items-center space-x-1 text-sm font-sans tracking-wide uppercase transition-colors text-[var(--silver)] hover:text-white focus:outline-none py-2">
                <span>Services</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${servicesDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {servicesDropdownOpen && (
                <div className="absolute top-full left-0 pt-2 w-60 z-50 text-left">
                  <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl shadow-2xl p-4 space-y-4">
                    <div className="space-y-1">
                      <Link
                        href="/servicing"
                        onClick={() => setServicesDropdownOpen(false)}
                        className="block text-xs font-sans font-bold uppercase tracking-wider text-white hover:text-[var(--agni)] transition-colors"
                      >
                        🚲 Cycle Servicing
                      </Link>
                      <p className="text-[10px] text-[var(--smoke)] pl-5 font-sans leading-tight">
                        doorstep Ranchi pickup general tune-ups & overhauls
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/repairing"
                        onClick={() => setServicesDropdownOpen(false)}
                        className="block text-xs font-sans font-bold uppercase tracking-wider text-white hover:text-[var(--agni)] transition-colors"
                      >
                        🛠️ Cycle Repairing
                      </Link>
                      <p className="text-[10px] text-[var(--smoke)] pl-5 font-sans leading-tight">
                        component adjustments brake overhauls & wheel truing
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Categories Hover Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center space-x-1 text-sm font-sans tracking-wide uppercase transition-colors text-[var(--silver)] hover:text-white focus:outline-none py-2">
                <span>Shop Categories</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 pt-2 w-64 z-50 text-left">
                  <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl shadow-2xl p-4 space-y-4">
                    {MOCK_CATEGORIES.filter((c) => !c.parentId).map((cat) => {
                      const subCats = MOCK_CATEGORIES.filter(
                        (c) => c.parentId === cat.id,
                      );
                      return (
                        <div key={cat.id} className="space-y-1">
                          <Link
                            href={`/products?category=${cat.slug}`}
                            onClick={() => setDropdownOpen(false)}
                            className="block text-xs font-sans font-bold uppercase tracking-wider text-white hover:text-[var(--agni)] transition-colors"
                          >
                            {cat.name}
                          </Link>
                          {subCats.length > 0 && (
                            <div className="pl-3 border-l border-[var(--steel)]/25 space-y-1.5 py-0.5 ml-1">
                              {subCats.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={`/products?category=${sub.slug}`}
                                  onClick={() => setDropdownOpen(false)}
                                  className="block text-[10px] font-sans font-medium text-[var(--smoke)] hover:text-white transition-colors"
                                >
                                  ↳ {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className={`text-sm font-sans tracking-wide uppercase transition-colors text-[var(--gold)] hover:text-[var(--gold-light)] font-bold`}
              >
                Admin Portal
              </Link>
            )}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* AI Companion Indicator */}
            {/* <Link
            href="#ai-assistant"
            onClick={(e) => {
              e.preventDefault();
              // Will trigger state update in Chat
              const chatButton = document.getElementById("ai-chat-trigger");
              if (chatButton) chatButton.click();
            }}
            className="hidden sm:inline-block text-[var(--silver)] hover:text-[var(--agni)] transition-colors p-1"
            title="AI Shopping Assistant"
          >
            <Sparkles size={20} className="animate-pulse text-[var(--agni-light)]" />
          </Link> */}

            {/* Product Comparison Badge */}
            <Link
              href="/products"
              onClick={(e) => {
                if (pathname !== "/products") {
                  // Let comparison view open
                }
              }}
              className="hidden sm:inline-block relative p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors"
              title="Compare Products"
            >
              <ArrowRightLeft size={20} />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)] text-[9px] font-bold text-black">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="hidden md:inline-block relative p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors"
              title="Wishlist"
            >
              <Heart
                size={20}
                className={
                  wishlistCount > 0
                    ? "fill-[var(--agni)] text-[var(--agni)]"
                    : ""
                }
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--agni)] text-[9px] font-bold text-neutral-50">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Mobile Search Icon Trigger */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors focus:outline-none"
              title="Search Products"
            >
              <Search size={20} />
            </button>

            {/* Cart Icon Toggle */}
            <button
              id="header-cart-icon"
              onClick={() => setIsOpen(true)}
              className="relative p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors focus:outline-none"
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--agni)] text-[9px] font-bold text-neutral-50">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Admin Link */}
            <Link
              href="/account"
              className="hidden md:flex items-center space-x-2 p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors"
              title={session ? `Account: ${session.user.name}` : "Sign In"}
            >
              <User
                size={20}
                className={
                  pathname.startsWith("/account") ||
                  pathname.startsWith("/admin")
                    ? "text-[var(--agni)]"
                    : ""
                }
              />
              {session && (
                <span className="hidden lg:inline text-xs font-sans font-medium max-w-[100px] truncate text-[var(--silver)]">
                  {isAdmin ? "Admin" : session.user.name}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {!(pathname.startsWith("/products/") && pathname.split("/").filter(Boolean).length === 2) && (
        <div
          style={{ backgroundColor: "white" }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--steel)]/60 h-16 grid grid-cols-5 items-center justify-items-center shadow-lg select-none pb-safe px-2"
        >
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center space-y-1 w-full text-center transition-colors ${
              pathname === "/" ? "text-[var(--agni)]" : "text-[var(--silver)]"
            }`}
          >
            <Home size={18} />
            <span className="text-[8px] xs:text-[9px] font-sans font-semibold capitalize tracking-tight">
              Home
            </span>
          </Link>

          {/* Services */}
          <Link
            href="/servicing"
            className={`flex flex-col items-center justify-center space-y-1 w-full text-center transition-colors ${
              pathname.startsWith("/servicing") ||
              pathname.startsWith("/repairing")
                ? "text-[var(--agni)]"
                : "text-[var(--silver)]"
            }`}
          >
            <Wrench size={18} />
            <span className="text-[8px] xs:text-[9px] font-sans font-semibold capitalize tracking-tight">
              Services
            </span>
          </Link>

          {/* Shop */}
          <Link
            href="/categories"
            className={`flex flex-col items-center justify-center space-y-1 w-full text-center transition-colors ${
              pathname.startsWith("/categories")
                ? "text-[var(--agni)]"
                : "text-[var(--silver)]"
            }`}
          >
            <ShoppingBag size={18} />
            <span className="text-[8px] xs:text-[9px] font-sans font-semibold capitalize tracking-tight">
              Shop
            </span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className={`flex flex-col items-center justify-center space-y-1 w-full text-center transition-colors ${
              pathname === "/wishlist"
                ? "text-[var(--agni)]"
                : "text-[var(--silver)]"
            }`}
          >
            <Heart
              size={18}
              className={
                wishlistCount > 0 ? "fill-[var(--agni)] text-[var(--agni)]" : ""
              }
            />
            <span className="text-[8px] xs:text-[9px] font-sans font-semibold capitalize tracking-tight">
              Wishlist
            </span>
          </Link>

          {/* Account */}
          <Link
            href="/account"
            className={`flex flex-col items-center justify-center space-y-1 w-full text-center transition-colors ${
              pathname.startsWith("/account") || pathname.startsWith("/admin")
                ? "text-[var(--agni)]"
                : "text-[var(--silver)]"
            }`}
          >
            <User size={18} />
            <span className="text-[8px] xs:text-[9px] font-sans font-semibold capitalize tracking-tight">
              Account
            </span>
          </Link>
        </div>
      )}

      {/* Mobile Full Page Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--obsidian)] flex flex-col p-5 overflow-hidden">
          {/* Header Row: Title, Close button */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--steel)]/60 mb-5">
            <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Search Vyorax</span>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-1 text-[var(--silver)] hover:text-[var(--white)] transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Full Page Search Bar Container */}
          <div className="flex-grow overflow-y-auto no-scrollbar">
            <GlobalSearch isMobileOverlay={true} onClose={() => setMobileSearchOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
