"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, useSettingsStore } from "@/lib/store";
import { X, Trash2, Plus, Minus, ShieldCheck, ArrowRight, Sparkles, Percent, Gift, Tag, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import confetti from "canvas-confetti";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getCartTotal, addItem } = useCartStore();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const drawerRef = useRef<HTMLDivElement>(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0); // in paise
  const [couponApplied, setCouponApplied] = useState(false);
  const [appliedCouponDetails, setAppliedCouponDetails] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500000; // Rs. 5000 in paise
  const shippingCharge = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 25000; // Rs. 250 in paise
  const total = subtotal + shippingCharge - discount;
  const { emiConfig } = useSettingsStore();
  const showEmi = emiConfig?.enabled !== false && total >= (emiConfig?.minAmount ?? 300000);

  // EMI Estimate: 12-month tenure at ~12% interest
  const emiTenure = 12;
  const emiInterestRate = 0.12;
  const emiMonthlyRate = emiInterestRate / 12;
  const emiAmount =
    total > 0
      ? Math.round(
          (total * emiMonthlyRate * Math.pow(1 + emiMonthlyRate, emiTenure)) /
            (Math.pow(1 + emiMonthlyRate, emiTenure) - 1)
        )
      : 0;

  // Free shipping math
  const progress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOffersModalOpen) return;
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen, isOffersModalOpen]);

  // Fetch available public coupons on mount or drawer state opening
  useEffect(() => {
    if (isOpen) {
      loadAvailableCoupons();
    }
  }, [isOpen]);

  const loadAvailableCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setAvailableCoupons(data);
      } else {
        loadSimulatedCoupons();
      }
    } catch (e) {
      loadSimulatedCoupons();
    }
  };

  const loadSimulatedCoupons = () => {
    const saved = localStorage.getItem("vega_sim_coupons");
    if (saved) {
      try {
        const all = JSON.parse(saved);
        const now = new Date();
        const filtered = all.filter((c: any) => {
          if (c.targetType !== "all") return false;
          if (c.expiryDate) {
            const expiry = new Date(c.expiryDate);
            expiry.setHours(23, 59, 59, 999);
            if (now > expiry) return false;
          }
          return true;
        });
        setAvailableCoupons(filtered);
      } catch (e) {
        setAvailableCoupons([]);
      }
    } else {
      const defaultMockAll = [
        {
          id: "mock-cpn-mega",
          code: "MEGA500",
          desc: "Flat ₹500 off on orders above ₹3,000",
          discountType: "flat",
          discountValue: 50000,
          minPurchase: 300000,
          targetType: "all",
          targetValue: "",
        },
        {
          id: "mock-cpn-freebie",
          code: "FREEBIE",
          desc: "Free helmet on orders above ₹5,000",
          discountType: "gift",
          discountValue: "VEGA-ACC-HELM",
          minPurchase: 500000,
          targetType: "all",
          targetValue: "",
        }
      ];
      setAvailableCoupons(defaultMockAll);
    }
  };

  // Load and validate saved coupon on mount, session load, or subtotal change
  useEffect(() => {
    const saved = localStorage.getItem("vega_applied_coupon");
    if (!saved) {
      setCouponApplied(false);
      setAppliedCouponDetails(null);
      setDiscount(0);
      return;
    }

    try {
      const details = JSON.parse(saved);
      const couponCodeUpper = details.code.trim().toUpperCase();

      // Find customer phone/email
      let email = "customer@vyorax.in";
      let phone = "8888888888";
      if (session?.user) {
        if (session.user.phone) phone = session.user.phone;
        if (session.user.email) email = session.user.email;
      }
      const savedAddr = localStorage.getItem("vega_saved_address");
      if (savedAddr) {
        try {
          const addr = JSON.parse(savedAddr);
          if (addr.phone) phone = addr.phone;
          if (addr.email) email = addr.email;
        } catch (err) {}
      }

      // 1. Check local simulated limits
      let localLimitReached = false;
      try {
        const simOrdersStr = localStorage.getItem("vega_sim_orders");
        if (simOrdersStr) {
          const simOrders = JSON.parse(simOrdersStr);
          const usedCount = simOrders.filter((o: any) => o.couponCode?.toUpperCase() === couponCodeUpper).length;
          
          const simSettingsStr = localStorage.getItem("vega_sim_settings");
          let limit = null;
          let uLimit = null;
          if (simSettingsStr) {
            const simSettings = JSON.parse(simSettingsStr);
            const cpn = simSettings.homepageConfig?.coupons?.find((c: any) => c.code === couponCodeUpper);
            if (cpn) {
              limit = cpn.usageLimit;
              uLimit = cpn.userLimit;
            }
          }
          
          if (limit && usedCount >= Number(limit)) {
            localLimitReached = true;
          }

          if (uLimit) {
            const userUsedCount = simOrders.filter((o: any) => 
              o.couponCode?.toUpperCase() === couponCodeUpper && 
              (o.phone === phone || o.email?.toLowerCase() === email.toLowerCase())
            ).length;
            if (userUsedCount >= Number(uLimit)) {
              localLimitReached = true;
            }
          }
        }
      } catch (e) {}

      if (localLimitReached) {
        // Revoke coupon
        const giftItem = items.find((item) => item.isGift === true);
        if (giftItem) {
          removeItem(giftItem.id);
        }
        setDiscount(0);
        setCouponApplied(false);
        setAppliedCouponDetails(null);
        setCoupon(details.code);
        localStorage.removeItem("vega_applied_coupon");
        setCouponError("Already used");
        return;
      }

      // Apply initial discount locally first, then validate with API in the background
      setAppliedCouponDetails(details);
      setCouponApplied(true);
      setCoupon(details.code);
      if (details.discountType === "percentage") {
        setDiscount(Math.round(subtotal * (details.discountValue / 100)));
      } else if (details.discountType === "flat") {
        setDiscount(details.discountValue);
      } else if (details.discountType === "gift") {
        setDiscount(0);
      }

      // Validate against API in the background
      fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: details.code,
          phone,
          email,
          cartItems: items.filter(item => !item.isGift),
          subtotal,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid) {
            // Revoke coupon
            const giftItem = items.find((item) => item.isGift === true);
            if (giftItem) {
              removeItem(giftItem.id);
            }
            setDiscount(0);
            setCouponApplied(false);
            setAppliedCouponDetails(null);
            setCoupon(details.code);
            localStorage.removeItem("vega_applied_coupon");
            setCouponError(data.error || "Coupon is no longer valid.");
          }
        })
        .catch((e) => {
          console.warn("Background coupon validation failed:", e);
        });

    } catch (e) {
      setCouponApplied(false);
      setAppliedCouponDetails(null);
      setDiscount(0);
      localStorage.removeItem("vega_applied_coupon");
    }
  }, [subtotal, session]);

  // Sync gift product
  useEffect(() => {
    if (couponApplied && appliedCouponDetails && appliedCouponDetails.discountType === "gift") {
      const giftProduct = appliedCouponDetails.giftProduct;
      if (giftProduct) {
        const hasGift = items.some((item) => item.isGift === true || item.id === `${giftProduct.id}-gift`);
        if (!hasGift) {
          addItem({
            id: `${giftProduct.id}-gift`,
            name: giftProduct.name,
            slug: giftProduct.slug,
            price: 0, // Free
            originalPrice: giftProduct.price,
            image: giftProduct.image,
            sku: giftProduct.sku,
            stock: giftProduct.stock || 5,
            isGift: true,
          } as any);
        }
      }
    } else {
      // Auto-cleanup: remove gift item if coupon is not applied
      const giftItem = items.find((item) => item.isGift === true);
      if (giftItem) {
        removeItem(giftItem.id);
      }
    }
  }, [couponApplied, appliedCouponDetails, items, addItem, removeItem]);

  // Monitor subtotal validity threshold
  useEffect(() => {
    if (couponApplied && appliedCouponDetails) {
      const minVal = appliedCouponDetails.minPurchase;
      if (subtotal < minVal) {
        // Automatically revoke coupon
        const giftItem = items.find((item) => item.isGift === true);
        if (giftItem) {
          removeItem(giftItem.id);
        }
        setDiscount(0);
        setCouponApplied(false);
        setAppliedCouponDetails(null);
        setCoupon("");
        localStorage.removeItem("vega_applied_coupon");
        alert("Coupon removed because the cart subtotal fell below the minimum required purchase amount.");
      }
    }
  }, [subtotal, couponApplied, appliedCouponDetails, items, removeItem]);

  // Revoke applied coupon if not logged in
  useEffect(() => {
    if (!isLoggedIn && couponApplied) {
      const giftItem = items.find((item) => item.isGift === true);
      if (giftItem) {
        removeItem(giftItem.id);
      }
      setDiscount(0);
      setCouponApplied(false);
      setAppliedCouponDetails(null);
      setCoupon("");
      localStorage.removeItem("vega_applied_coupon");
    }
  }, [isLoggedIn, couponApplied, items, removeItem]);

  // Apply Coupon by Code
  const applyCouponByCode = async (codeToApply: string) => {
    if (!codeToApply || codeToApply.trim().length === 0) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    // Premium validation experience delay (1000ms) to showcase the spinner animation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let email = "customer@vyorax.in";
    let phone = "8888888888";

    if (session?.user) {
      if (session.user.phone) phone = session.user.phone;
      if (session.user.email) email = session.user.email;
    }

    const savedAddr = localStorage.getItem("vega_saved_address");
    if (savedAddr) {
      try {
        const addr = JSON.parse(savedAddr);
        if (addr.phone) phone = addr.phone;
        if (addr.email) email = addr.email;
      } catch (err) {}
    }

    try {
      const simOrdersStr = localStorage.getItem("vega_sim_orders");
      if (simOrdersStr) {
        const simOrders = JSON.parse(simOrdersStr);
        const couponCodeUpper = codeToApply.trim().toUpperCase();
        const usedCount = simOrders.filter((o: any) => o.couponCode?.toUpperCase() === couponCodeUpper).length;
        
        const simSettingsStr = localStorage.getItem("vega_sim_settings");
        let limit = null;
        let uLimit = null;
        if (simSettingsStr) {
          const simSettings = JSON.parse(simSettingsStr);
          const cpn = simSettings.homepageConfig?.coupons?.find((c: any) => c.code === couponCodeUpper);
          if (cpn) {
            limit = cpn.usageLimit;
            uLimit = cpn.userLimit;
          }
        }
        
        if (limit && usedCount >= Number(limit)) {
          setCouponError("Already used");
          setDiscount(0);
          setCouponApplied(false);
          setAppliedCouponDetails(null);
          localStorage.removeItem("vega_applied_coupon");
          setIsValidatingCoupon(false);
          return;
        }

        if (uLimit) {
          const userUsedCount = simOrders.filter((o: any) => 
            o.couponCode?.toUpperCase() === couponCodeUpper && 
            (o.phone === phone || o.email?.toLowerCase() === email.toLowerCase())
          ).length;
          if (userUsedCount >= Number(uLimit)) {
            setCouponError("Already used");
            setDiscount(0);
            setCouponApplied(false);
            setAppliedCouponDetails(null);
            localStorage.removeItem("vega_applied_coupon");
            setIsValidatingCoupon(false);
            return;
          }
        }
      }
    } catch (e) {}

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToApply,
          phone,
          email,
          cartItems: items.filter(item => !item.isGift),
          subtotal,
        }),
      });

      const data = await response.json();
      if (data.valid) {
        let computedDiscount = 0;
        if (data.discountType === "percentage") {
          computedDiscount = Math.round(subtotal * (data.discountValue / 100));
        } else if (data.discountType === "flat") {
          computedDiscount = data.discountValue;
        } else if (data.discountType === "gift") {
          computedDiscount = 0;
        }

        const couponDetails = {
          code: data.code,
          desc: data.desc,
          discountType: data.discountType,
          discountValue: data.discountValue,
          minPurchase: data.minPurchase,
          discountAmount: computedDiscount,
          giftProduct: data.giftProduct,
        };

        setDiscount(computedDiscount);
        setAppliedCouponDetails(couponDetails);
        setCouponApplied(true);
        localStorage.setItem("vega_applied_coupon", JSON.stringify(couponDetails));

        // Trigger premium confetti burst on the right side of the screen (near the cart drawer)
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { x: 0.85, y: 0.5 }
        });

        if (data.discountType === "gift" && data.giftProduct) {
          addItem({
            id: `${data.giftProduct.id}-gift`,
            name: data.giftProduct.name,
            slug: data.giftProduct.slug,
            price: 0,
            originalPrice: data.giftProduct.price,
            image: data.giftProduct.image,
            sku: data.giftProduct.sku,
            stock: data.giftProduct.stock || 5,
            isGift: true,
          } as any);
        }
      } else {
        setCouponError(data.error || "Invalid coupon code.");
        setDiscount(0);
        setCouponApplied(false);
        setAppliedCouponDetails(null);
        localStorage.removeItem("vega_applied_coupon");
      }
    } catch (err) {
      setCouponError("Validation failed. Check coupon code or connection.");
      setDiscount(0);
      setCouponApplied(false);
      setAppliedCouponDetails(null);
      localStorage.removeItem("vega_applied_coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCouponByCode(coupon);
  };

  const handleRemoveCoupon = () => {
    // Remove gift items from cart
    const giftItem = items.find((item) => item.isGift === true);
    if (giftItem) {
      removeItem(giftItem.id);
    }
    setDiscount(0);
    setCouponApplied(false);
    setAppliedCouponDetails(null);
    setCoupon("");
    localStorage.removeItem("vega_applied_coupon");
    alert("Coupon code removed.");
  };

  // Static upsell products
  const upsellItems = [
    {
      id: "VEGA-ACC-HELM",
      name: "Aero Shield Helmet",
      slug: "vega-aero-x-carbon", // Redirects to accessories context
      price: 249900,
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop",
      stock: 5,
      sku: "VEGA-ACC-HELM",
    },
    {
      id: "VEGA-ACC-LIGHT",
      name: "USB Laser Tail Light",
      slug: "vega-aero-x-carbon",
      price: 99900,
      image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=200&auto=format&fit=crop",
      stock: 8,
      sku: "VEGA-ACC-LIGHT",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--charcoal)] border-l border-[var(--steel)] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-[var(--steel)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-display font-bold tracking-wide uppercase">Your Bag</span>
                <span className="text-xs bg-[var(--carbon)] px-2.5 py-1 rounded-full text-[var(--silver)] font-sans">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-[var(--silver)] hover:text-[var(--white)] hover:bg-[var(--carbon)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="bg-[var(--carbon)] px-6 py-4 border-b border-[var(--steel)]">
                <div className="text-xs font-sans text-[var(--silver)] mb-2 flex justify-between">
                  {remainingForFreeShipping > 0 ? (
                    <span>
                      You are{" "}
                      <span className="font-bold text-[var(--agni)]">
                        ₹{(remainingForFreeShipping / 100).toLocaleString("en-IN")}
                      </span>{" "}
                      away from <span className="text-white font-semibold">FREE SHIPPING</span>
                    </span>
                  ) : (
                    <span className="text-[var(--forest)] font-bold flex items-center space-x-1">
                      <ShieldCheck size={14} className="mr-1" /> Congrats! You earned FREE shipping.
                    </span>
                  )}
                  <span className="font-mono text-[10px]">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--steel)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--agni)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl mb-4 text-[var(--silver)]">🛒</span>
                  <h3 className="text-lg font-sans font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-sm text-[var(--smoke)] max-w-[200px] mb-6">
                    Add cycles or premium sports gear to get rolling.
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-bold tracking-widest uppercase hover:bg-[var(--agni-light)] transition-all rounded"
                  >
                    Go Shop
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex space-x-4 p-3 rounded-lg bg-[var(--carbon)] border border-[var(--steel)]/50 relative overflow-hidden"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-[var(--obsidian)] rounded relative flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h4 className="text-sm font-sans font-bold text-white truncate pr-6">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[var(--smoke)] font-mono uppercase tracking-wider mt-0.5">
                              SKU: {item.sku}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Controls */}
                            {item.isGift ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-sans uppercase font-bold tracking-wider">
                                Gift Item (Qty: 1)
                              </span>
                            ) : (
                              <div className="flex items-center border border-[var(--steel)] bg-[var(--obsidian)] rounded overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-2.5 py-1 text-[var(--silver)] hover:text-white transition-colors"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="px-3 py-1 font-mono text-xs text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-2.5 py-1 text-[var(--silver)] hover:text-white transition-colors"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}

                            {/* Price */}
                            <div className="text-right">
                              {item.isGift ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-[var(--smoke)] line-through">
                                    ₹{((item.originalPrice || 0) / 100).toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-sm font-sans font-bold text-emerald-400 uppercase tracking-wide">
                                    FREE
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-display font-semibold text-white">
                                  ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Action Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute top-3 right-3 text-[var(--smoke)] hover:text-[var(--agni)] transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Smart Upsell: People also added */}
                  <div className="border-t border-[var(--steel)] pt-6 mt-6">
                    <h5 className="text-xs font-sans font-bold text-[var(--silver)] tracking-wider uppercase mb-4">
                      Complete Your Setup
                    </h5>
                    <div className="space-y-3">
                      {upsellItems.map((item) => {
                        const inCart = items.some((i) => i.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--obsidian)] border border-[var(--steel)]/30 hover:border-[var(--steel)] transition-colors"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-12 h-12 rounded bg-[var(--carbon)] relative overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-sans font-bold text-white truncate">
                                  {item.name}
                                </p>
                                <p className="text-xs text-[var(--gold)] font-display mt-0.5">
                                  ₹{(item.price / 100).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                            <button
                              disabled={inCart}
                              onClick={() => {
                                addItem(item);
                                alert(`${item.name} added to cart!`);
                              }}
                              className={`px-3 py-1.5 rounded text-[10px] font-sans font-bold tracking-wider uppercase transition-all ${
                                inCart
                                  ? "bg-[var(--steel)] text-[var(--smoke)] cursor-not-allowed"
                                  : "bg-[var(--agni)] text-neutral-50 hover:bg-[var(--agni-light)]"
                              }`}
                            >
                              {inCart ? "Added" : "Add"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer (Summary & Checkout) */}
            {items.length > 0 && (
              <div className="p-6 border-t border-[var(--steel)] bg-[var(--charcoal)] space-y-4">
                {/* Coupon Input or Login Prompt */}
                {!isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-lg p-3.5 text-center text-xs font-sans">
                      <p className="text-[var(--silver)]">
                        <span className="text-amber-400 mr-1.5">🔒</span>
                        <Link href="/account?redirect=cart" onClick={() => setIsOpen(false)} className="text-[var(--gold)] font-bold hover:underline">
                          Log in
                        </Link>{" "}
                        to view and apply discount offers
                      </p>
                    </div>
                    {availableCoupons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsOffersModalOpen(true)}
                        className="w-full text-center text-[10px] text-[var(--gold)] font-sans font-bold flex items-center justify-center space-x-1 hover:underline mt-2 cursor-pointer focus:outline-none"
                      >
                        <Sparkles size={11} className="text-[var(--gold)] animate-pulse" />
                        <span>View Available Offers ({availableCoupons.length})</span>
                      </button>
                    )}
                  </div>
                ) : !couponApplied ? (
                  <div className="space-y-1">
                    <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Coupon Code (e.g. WELCOME10)"
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          setCouponError(null);
                        }}
                        className="flex-1 bg-[var(--obsidian)] border border-[var(--steel)] rounded px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-[var(--agni)] uppercase placeholder-[var(--smoke)]"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingCoupon}
                        className={`px-4 py-2 border rounded text-xs font-sans font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-1.5 min-w-[95px] ${
                          isValidatingCoupon
                            ? "border-[var(--gold)] text-[var(--gold)] cursor-not-allowed bg-[var(--gold)]/5"
                            : "border-[var(--steel)] hover:border-white text-white hover:bg-[var(--steel)]/10"
                        }`}
                      >
                        {isValidatingCoupon ? (
                          <>
                            <span className="w-3 h-3 rounded-full border border-[var(--gold)] border-t-transparent animate-spin inline-block" />
                            <span>Checking</span>
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </form>
                    {couponError && (
                      <p className="text-xs text-red-500 font-sans pl-1 pt-1 animate-in fade-in">
                        ⚠️ {couponError}
                      </p>
                    )}
                    {availableCoupons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsOffersModalOpen(true)}
                        className="text-[11px] text-[var(--gold)] font-sans font-bold flex items-center space-x-1 hover:underline mt-2 cursor-pointer focus:outline-none"
                      >
                        <Sparkles size={11} className="text-[var(--gold)] animate-pulse" />
                        <span>View Available Offers ({availableCoupons.length})</span>
                      </button>
                    )}
                  </div>
                ) : (
                  appliedCouponDetails && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5 flex items-center justify-between text-xs text-emerald-400 font-sans">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-base">🏷️</span>
                          <div className="truncate">
                            <p className="font-bold uppercase tracking-wider">{appliedCouponDetails.code}</p>
                            <p className="text-[10px] text-[var(--smoke)] truncate mt-0.5">{appliedCouponDetails.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] uppercase font-bold text-red-400 hover:text-red-500 px-2 py-1 bg-red-500/10 rounded transition-colors ml-2"
                        >
                          Remove
                        </button>
                      </div>
                      {availableCoupons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsOffersModalOpen(true)}
                          className="text-[10px] text-[var(--gold)] font-sans font-bold flex items-center space-x-1 hover:underline pl-1 cursor-pointer focus:outline-none"
                        >
                          <Sparkles size={10} className="text-[var(--gold)] animate-pulse" />
                          <span>View all available offers ({availableCoupons.length})</span>
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Pricing Summary */}
                <div className="space-y-2 text-xs font-sans text-[var(--silver)]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">₹{(subtotal / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-mono text-white">
                      {shippingCharge === 0 ? (
                        <span className="text-[var(--forest)] font-bold uppercase">Free</span>
                      ) : (
                        `₹${(shippingCharge / 100).toLocaleString("en-IN")}`
                      )}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--forest)] font-semibold animate-in fade-in">
                      <span>Promo Discount ({appliedCouponDetails?.code})</span>
                      <span className="font-mono">-₹{(discount / 100).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {couponApplied && appliedCouponDetails?.discountType === "gift" && (
                    <div className="flex justify-between text-[var(--forest)] font-semibold animate-in fade-in">
                      <span>Promo Gift Item ({appliedCouponDetails?.giftProduct?.name})</span>
                      <span className="uppercase text-[9px] font-sans border border-emerald-500/30 px-1 py-0.2 rounded bg-emerald-500/5">FREE</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[var(--steel)] pt-2.5 text-sm font-sans font-bold text-white">
                    <span>Total</span>
                    <span className="font-mono text-[var(--agni)] text-base">
                      ₹{(total / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* EMI Preview Indicator */}
                {showEmi && (
                  <div className="bg-[var(--carbon)] rounded px-4 py-2.5 border border-[var(--steel)]/60 text-[10px] font-sans flex items-center justify-between text-[var(--silver)]">
                    <span>Pay as low as <strong className="text-[var(--gold-light)]">₹{(emiAmount / 100).toLocaleString("en-IN")}/mo</strong></span>
                    <span className="text-[var(--gold)] font-bold text-[9px] border border-[var(--gold)]/40 px-1.5 py-0.5 rounded uppercase">
                      No Cost EMI Available
                    </span>
                  </div>
                )}

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold tracking-widest uppercase rounded transition-all group"
                >
                  <span>Checkout Now</span>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </motion.div>

          {/* Available Offers Dialog Modal */}
          {isOffersModalOpen && (
            <div 
              onClick={() => setIsOffersModalOpen(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md cursor-pointer"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-[var(--steel)]/50 flex items-center justify-between bg-[var(--obsidian)]">
                  <div className="flex items-center space-x-2 text-white">
                    <Sparkles size={16} className="text-[var(--gold)]" />
                    <span className="text-sm font-sans font-bold uppercase tracking-wider">Available Offers</span>
                  </div>
                  <button
                    onClick={() => setIsOffersModalOpen(false)}
                    className="p-1 rounded-full text-[var(--silver)] hover:text-white hover:bg-[var(--carbon)] transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1 bg-[var(--charcoal)]">
                  {availableCoupons.map((cpn) => {
                    const isApplied = couponApplied && appliedCouponDetails?.code?.toUpperCase() === cpn.code?.toUpperCase();
                    const isEligible = subtotal >= cpn.minPurchase;
                    const CpnIcon = cpn.discountType === "percentage" ? Percent : cpn.discountType === "gift" ? Gift : Tag;

                    return (
                      <div
                        key={cpn.id}
                        className={`relative border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 ${
                          isApplied
                            ? "bg-emerald-500/5 border-emerald-500/40"
                            : isEligible
                              ? "bg-[var(--carbon)] border-[var(--steel)]/50 hover:border-[var(--steel)]"
                              : "bg-[var(--carbon)]/50 border-[var(--steel)]/30 opacity-75"
                        }`}
                      >
                        {/* Ticket edge style indicators */}
                        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--charcoal)] border-r border-[var(--steel)]/40 hidden sm:block" />
                        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--charcoal)] border-l border-[var(--steel)]/40 hidden sm:block" />

                        <div className="space-y-2">
                          {/* Code badge */}
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 bg-[var(--obsidian)] text-white font-mono font-bold text-xs uppercase rounded border border-[var(--steel)]/50">
                              {cpn.code}
                            </span>
                            <span className="text-[var(--smoke)]" title={cpn.discountType}>
                              <CpnIcon size={14} className="text-[var(--gold)]" />
                            </span>
                          </div>

                          {/* Details */}
                          <div>
                            <h4 className="text-xs font-sans font-bold text-white uppercase tracking-wide">
                              {cpn.discountType === "flat"
                                ? `₹${(cpn.discountValue / 100).toLocaleString("en-IN")} Off`
                                : cpn.discountType === "percentage"
                                  ? `${cpn.discountValue}% Off`
                                  : `Free Gift Coupon`}
                            </h4>
                            <p className="text-[11px] text-[var(--smoke)] mt-1 leading-normal">
                              {cpn.desc || "Unlock flat savings on premium equipment."}
                            </p>
                          </div>

                          {/* Requirement criteria */}
                          <div className="text-[10px] text-[var(--silver)] space-y-1 pt-1.5 border-t border-[var(--steel)]/20 mt-1">
                            {cpn.minPurchase > 0 && (
                              <div className="flex justify-between">
                                <span>Minimum purchase:</span>
                                <span className="font-bold text-white">₹{(cpn.minPurchase / 100).toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            {cpn.expiryDate && (
                              <div className="flex justify-between">
                                <span>Expires on:</span>
                                <span className="text-red-400 font-semibold">{cpn.expiryDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="mt-4 pt-3 border-t border-[var(--steel)]/20 flex justify-end">
                          {isApplied ? (
                            <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1.5 rounded flex items-center">
                              <Check size={12} className="mr-1" /> Applied
                            </span>
                          ) : isEligible ? (
                            <button
                              disabled={isValidatingCoupon}
                              onClick={async () => {
                                setCoupon(cpn.code);
                                await applyCouponByCode(cpn.code);
                                setIsOffersModalOpen(false);
                              }}
                              className={`px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center space-x-1.5 min-w-[95px] ${
                                isValidatingCoupon && coupon === cpn.code
                                  ? "bg-[var(--gold)]/10 border border-[var(--gold)] text-[var(--gold)] cursor-not-allowed"
                                  : "bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 disabled:opacity-50"
                              }`}
                            >
                              {isValidatingCoupon && coupon === cpn.code ? (
                                <>
                                  <span className="w-3 h-3 rounded-full border border-[var(--gold)] border-t-transparent animate-spin inline-block" />
                                  <span>Checking</span>
                                </>
                              ) : (
                                <span>Apply Coupon</span>
                              )}
                            </button>
                          ) : (
                            <div className="text-[10px] text-amber-400 font-bold font-sans">
                              Add ₹{((cpn.minPurchase - subtotal) / 100).toLocaleString("en-IN")} more to unlock
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
