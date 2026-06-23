"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Tag,
  Percent,
  Gift,
  Users,
  Check,
  Pencil,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mockData";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Load products & categories for target dropdowns
  const [productsList, setProductsList] = useState<any[]>(MOCK_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<any[]>(MOCK_CATEGORIES);

  // Form states
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [discountType, setDiscountType] = useState<
    "flat" | "percentage" | "gift"
  >("percentage");
  const [discountValue, setDiscountValue] = useState(""); // Rupees for flat, % for percentage, product SKU/ID for gift
  const [minPurchase, setMinPurchase] = useState(""); // in Rupees
  const [targetType, setTargetType] = useState<
    "all" | "customer" | "first_time" | "category"
  >("all");
  const [targetValue, setTargetValue] = useState(""); // mobile phone or category slug/ID
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [userLimit, setUserLimit] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const resCat = await fetch("/api/admin/categories");
        if (resCat.ok) {
          const data = await resCat.json();
          setCategoriesList(data);
        }
      } catch (e) {
        // ignore fallback
      }

      try {
        const resProd = await fetch("/api/products/search");
        if (resProd.ok) {
          const data = await resProd.json();
          setProductsList(data);
        }
      } catch (e) {
        // ignore fallback
      }
    }
    loadMeta();
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
        setIsSimulationMode(false);
      } else {
        loadSimulationData();
      }
    } catch (e) {
      console.warn(
        "Coupons API failed. Falling back to local storage simulation."
      );
      loadSimulationData();
    } finally {
      setIsLoading(false);
    }
  }

  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_coupons");
    if (saved) {
      try {
        setCoupons(JSON.parse(saved));
      } catch (e) {
        setCoupons([]);
      }
    } else {
      const defaultMock = [
        {
          id: "mock-cpn-welcome",
          code: "WELCOME10",
          desc: "10% off for first-time customers (Min. ₹1,000)",
          discountType: "percentage",
          discountValue: 10,
          minPurchase: 100000,
          targetType: "first_time",
          targetValue: "",
          usedCount: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mock-cpn-mega",
          code: "MEGA500",
          desc: "Flat ₹500 off on orders above ₹3,000",
          discountType: "flat",
          discountValue: 50000,
          minPurchase: 300000,
          targetType: "all",
          targetValue: "",
          usedCount: 1,
          createdAt: new Date().toISOString(),
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
          usedCount: 0,
          createdAt: new Date().toISOString(),
        },
      ];
      setCoupons(defaultMock);
      localStorage.setItem("vega_sim_coupons", JSON.stringify(defaultMock));
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !discountType) {
      alert("Please provide a coupon code.");
      return;
    }

    let finalValue: any = discountValue;
    if (discountType === "flat") {
      finalValue = Number(discountValue) * 100; // to paise
    } else if (discountType === "percentage") {
      finalValue = Number(discountValue); // Keep percentage raw (e.g. 10)
    }

    const payload = {
      code: code.trim().toUpperCase(),
      desc:
        desc.trim() ||
        `${discountType === "gift" ? "Free Gift" : discountType === "flat" ? `₹${discountValue} Off` : `${discountValue}% Off`} coupon`,
      discountType,
      discountValue: finalValue,
      minPurchase: (Number(minPurchase) || 0) * 100, // to paise
      targetType,
      targetValue: targetValue.trim(),
      expiryDate: expiryDate || null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userLimit: userLimit ? Number(userLimit) : null,
    };

    if (isSimulationMode) {
      if (editingCouponId) {
        const updated = coupons.map((c) => {
          if (c.id === editingCouponId) {
            return {
              ...c,
              ...payload,
            };
          }
          return c;
        });
        setCoupons(updated);
        localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
        alert("Simulated coupon updated successfully!");
        resetForm();
      } else {
        const newC = {
          ...payload,
          id: `cpn-sim-${Date.now()}`,
          usedCount: 0,
          createdAt: new Date().toISOString(),
        };
        if (coupons.some((c) => c.code === newC.code)) {
          alert("Coupon code already exists!");
          return;
        }
        const updated = [...coupons, newC];
        setCoupons(updated);
        localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
        alert("Simulated coupon added successfully!");
        resetForm();
      }
    } else {
      if (editingCouponId) {
        try {
          const res = await fetch("/api/admin/coupons", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: editingCouponId }),
          });

          if (res.ok) {
            const updatedC = await res.json();
            setCoupons(
              coupons.map((c) => (c.id === editingCouponId ? { ...c, ...updatedC } : c))
            );
            alert("Coupon updated successfully!");
            resetForm();
          } else {
            const data = await res.json();
            alert(data.error || "Failed to update coupon.");
          }
        } catch (err) {
          alert("Network error. Saving to local simulation instead.");
          setIsSimulationMode(true);
          const updated = coupons.map((c) => {
            if (c.id === editingCouponId) {
              return {
                ...c,
                ...payload,
              };
            }
            return c;
          });
          setCoupons(updated);
          localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
          resetForm();
        }
      } else {
        try {
          const res = await fetch("/api/admin/coupons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const newC = await res.json();
            setCoupons([...coupons, { ...newC, usedCount: 0 }]);
            alert("Coupon created successfully!");
            resetForm();
          } else {
            const data = await res.json();
            alert(data.error || "Failed to create coupon.");
          }
        } catch (err) {
          alert("Network error. Saving to local simulation instead.");
          setIsSimulationMode(true);
          const newC = {
            ...payload,
            id: `cpn-sim-${Date.now()}`,
            usedCount: 0,
            createdAt: new Date().toISOString(),
          };
          const updated = [...coupons, newC];
          setCoupons(updated);
          localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
          resetForm();
        }
      }
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;

    if (isSimulationMode) {
      const updated = coupons.filter((c) => c.id !== id);
      setCoupons(updated);
      localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
      alert("Simulated coupon deleted.");
    } else {
      try {
        const res = await fetch(`/api/admin/coupons?id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setCoupons(coupons.filter((c) => c.id !== id));
          alert("Coupon deleted successfully.");
          if (editingCouponId === id) {
            resetForm();
          }
        } else {
          alert("Failed to delete coupon from database.");
        }
      } catch (err) {
        alert("Error deleting coupon. Attempting simulation delete.");
        const updated = coupons.filter((c) => c.id !== id);
        setCoupons(updated);
        localStorage.setItem("vega_sim_coupons", JSON.stringify(updated));
        if (editingCouponId === id) {
          resetForm();
        }
      }
    }
  };

  const handleEditClick = (cpn: any) => {
    setEditingCouponId(cpn.id);
    setCode(cpn.code);
    setDesc(cpn.desc || "");
    setDiscountType(cpn.discountType);

    if (cpn.discountType === "flat") {
      setDiscountValue(String(cpn.discountValue / 100));
    } else {
      setDiscountValue(String(cpn.discountValue));
    }

    if (cpn.minPurchase && cpn.minPurchase > 0) {
      setMinPurchase(String(cpn.minPurchase / 100));
    } else {
      setMinPurchase("");
    }

    setTargetType(cpn.targetType);
    setTargetValue(cpn.targetValue || "");
    setExpiryDate(cpn.expiryDate || "");
    setUsageLimit(cpn.usageLimit ? String(cpn.usageLimit) : "");
    setUserLimit(cpn.userLimit ? String(cpn.userLimit) : "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setCode("");
    setDesc("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinPurchase("");
    setTargetType("all");
    setTargetValue("");
    setExpiryDate("");
    setUsageLimit("");
    setUserLimit("");
    setEditingCouponId(null);
  };

  const formatDiscount = (cpn: any) => {
    if (cpn.discountType === "flat") {
      const rupees = cpn.discountValue / 100;
      return `₹${rupees.toLocaleString("en-IN")} Off`;
    } else if (cpn.discountType === "percentage") {
      return `${cpn.discountValue}% Off`;
    } else if (cpn.discountType === "gift") {
      const p = productsList.find(
        (item) => item.sku === cpn.discountValue || item.id === cpn.discountValue
      );
      return `Free gift: ${p ? p.name : cpn.discountValue}`;
    }
    return "";
  };

  const formatTarget = (cpn: any) => {
    if (cpn.targetType === "all") return "All Customers";
    if (cpn.targetType === "first_time") return "First-Time Customers";
    if (cpn.targetType === "customer") return `Mobile: ${cpn.targetValue}`;
    if (cpn.targetType === "category") return `Category: ${cpn.targetValue}`;
    return "";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[var(--steel)]/40 pb-6">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">
            Coupons Manager
          </h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">
            Configure e-commerce discount promo codes, target customers, minimum
            purchase thresholds, and gift campaigns.
          </p>
        </div>
        {isSimulationMode && (
          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
            Sandbox Offline Mode
          </span>
        )}
      </div>

      <div className="space-y-8">
        {/* Creation Form Panel - Full Width */}
        <form
          onSubmit={handleSaveCoupon}
          className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm w-full"
        >
          <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3 flex items-center space-x-1.5">
            {editingCouponId ? (
              <Pencil size={14} className="text-[var(--agni)]" />
            ) : (
              <Plus size={14} className="text-[var(--agni)]" />
            )}
            <span>{editingCouponId ? "Edit Promo" : "Create New Promo"}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coupon Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Coupon Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MONSOON20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-[var(--agni)] font-mono font-bold placeholder-[var(--smoke)]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. ₹500 off on premium gear orders"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
              />
            </div>

            {/* Coupon Target */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Coupon Target
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setTargetValue("");
                }}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              >
                <option value="all">All Customers</option>
                <option value="first_time">First-Time Customers Only</option>
                <option value="customer">Specific Customer Mobile</option>
                <option value="category">Specific Product Category</option>
              </select>
            </div>

            {/* Conditional target values */}
            {targetType === "customer" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Target Customer Mobile
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 8888888888"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
                />
              </div>
            )}

            {targetType === "category" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Target Category
                </label>
                <select
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                >
                  <option value="">-- Select Category --</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Discount Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as any);
                  setDiscountValue("");
                }}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              >
                <option value="percentage">Percentage Discount (%)</option>
                <option value="flat">Flat Amount Discount (₹)</option>
                <option value="gift">Free Gift Campaign (Inventory Selection)</option>
              </select>
            </div>

            {/* Conditional discount value inputs */}
            {discountType === "percentage" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  placeholder="e.g. 15"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
                />
              </div>
            )}

            {discountType === "flat" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 500"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
                />
              </div>
            )}

            {discountType === "gift" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Select Free Gift Item
                </label>
                <select
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                >
                  <option value="">-- Choose Gift Product --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Minimum purchase requirement */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Minimum Order Value (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 2000 (0 for no limit)"
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
              />
            </div>

            {/* Usage Limit Overall */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Total Usage Limit
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 100 (Blank for unlimited)"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
              />
            </div>

            {/* Per User Limit */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                Usage Limit Per Customer
              </label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 1 (Blank for unlimited)"
                value={userLimit}
                onChange={(e) => setUserLimit(e.target.value)}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end items-center space-x-3 border-t border-[var(--steel)]/30">
            {editingCouponId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 border border-[var(--steel)] hover:bg-[var(--steel)]/30 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow"
            >
              {editingCouponId ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>

        {/* Coupon list layout - Full Width */}
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 shadow-sm space-y-4 w-full">
          <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3 flex items-center space-x-1.5">
            <Tag size={14} className="text-[var(--agni)]" />
            <span>Active Coupon Promotions</span>
          </h3>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 rounded-full border-2 border-neutral-700 border-t-[var(--agni)] animate-spin" />
              <p className="text-[10px] text-[var(--smoke)] uppercase tracking-widest animate-pulse font-bold">
                Loading promos...
              </p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[var(--steel)]/40 rounded-xl bg-[var(--carbon)]">
              <Tag size={32} className="mx-auto text-[var(--smoke)] mb-2" />
              <p className="text-xs text-[var(--smoke)] italic">
                No coupon codes active yet. Fill in the creation sheet to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((cpn) => {
                const Icon =
                  cpn.discountType === "percentage"
                    ? Percent
                    : cpn.discountType === "gift"
                      ? Gift
                      : Tag;
                const minVal = cpn.minPurchase / 100;

                return (
                  <div
                    key={cpn.id}
                    className="border border-[var(--steel)]/50 rounded-xl bg-[var(--obsidian)] p-4 relative flex flex-col justify-between hover:border-[var(--steel)] transition-all shadow-sm"
                  >
                    <div className="space-y-4">
                      {/* Code Badge */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-[var(--carbon)] text-white font-mono font-bold text-xs uppercase rounded-lg border border-[var(--steel)]/60 shadow-sm">
                          {cpn.code}
                        </span>

                        <div className="flex space-x-1.5 text-[var(--smoke)]">
                          <span title={cpn.discountType}><Icon size={14} /></span>
                          <span title={cpn.targetType}><Users size={14} /></span>
                        </div>
                      </div>

                      {/* Promo Description */}
                      <div>
                        <h4 className="text-xs font-sans font-bold text-white mb-1 leading-normal">
                          {formatDiscount(cpn)}
                        </h4>
                        <p className="text-[11px] text-[var(--smoke)] leading-normal">
                          {cpn.desc || "No description provided."}
                        </p>
                      </div>

                      {/* Applicability Info Badges */}
                      <div className="space-y-1.5 border-t border-[var(--steel)]/30 pt-3 text-[10px] text-[var(--silver)]">
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--smoke)]">
                            Target Segment:
                          </span>
                          <span className="font-bold text-white capitalize">
                            {formatTarget(cpn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-[var(--smoke)]">
                            Minimum Order:
                          </span>
                          <span className="font-bold text-white">
                            {minVal > 0
                              ? `₹${minVal.toLocaleString("en-IN")}`
                              : "None"}
                          </span>
                        </div>
                        {cpn.expiryDate && (
                          <div className="flex justify-between">
                            <span className="font-medium text-[var(--smoke)]">
                              Expiry Date:
                            </span>
                            <span className="font-bold text-red-400">
                              {cpn.expiryDate}
                            </span>
                          </div>
                        )}
                        {cpn.usageLimit && (
                          <div className="flex justify-between">
                            <span className="font-medium text-[var(--smoke)]">
                              Total Limit:
                            </span>
                            <span className="font-bold text-white">
                              {cpn.usageLimit} total
                            </span>
                          </div>
                        )}
                        {cpn.userLimit && (
                          <div className="flex justify-between">
                            <span className="font-medium text-[var(--smoke)]">
                              Limit Per User:
                            </span>
                            <span className="font-bold text-[var(--agni-light)]">
                              {cpn.userLimit} use(s)
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[var(--steel)]/20 pt-1.5 mt-1.5">
                          <span className="font-medium text-[var(--smoke)]">
                            Times Used:
                          </span>
                          <span className="font-bold text-[var(--gold)]">
                            {cpn.usedCount || 0} / {cpn.usageLimit || "∞"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-[var(--steel)]/20 mt-4">
                      <button
                        onClick={() => handleEditClick(cpn)}
                        className="p-1.5 text-[var(--smoke)] hover:text-white hover:bg-[var(--steel)]/30 rounded transition-all flex items-center space-x-1"
                        title="Edit coupon"
                      >
                        <Pencil size={14} />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(cpn.id)}
                        className="p-1.5 text-[var(--smoke)] hover:text-red-400 hover:bg-red-500/10 rounded transition-all flex items-center space-x-1"
                        title="Delete coupon"
                      >
                        <Trash2 size={14} />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
