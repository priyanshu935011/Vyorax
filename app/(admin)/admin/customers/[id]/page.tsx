"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  MapPin,
  Heart,
  User,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Search,
  DollarSign,
  Tag,
  CircleDollarSign,
  AlertTriangle,
  Gift,
} from "lucide-react";

type TabKey =
  | "orders"
  | "cart"
  | "services"
  | "warranty"
  | "addresses"
  | "loyalty";

interface CustomerDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const router = useRouter();
  const customerId = decodeURIComponent(params.id);

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const [searchQuery, setSearchQuery] = useState("");

  // Loyalty states
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustType, setAdjustType] = useState<"MANUAL_ADD" | "MANUAL_SUB">(
    "MANUAL_ADD",
  );
  const [adjustExpiryDays, setAdjustExpiryDays] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  async function handleAdjustPoints(e: React.FormEvent) {
    e.preventDefault();
    if (
      !adjustAmount ||
      isNaN(Number(adjustAmount)) ||
      Number(adjustAmount) <= 0
    ) {
      alert("Please enter a valid positive points amount.");
      return;
    }

    setIsAdjusting(true);
    const expiresAt = adjustType === "MANUAL_ADD" && adjustExpiryDays
      ? new Date(Date.now() + Number(adjustExpiryDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    try {
      const res = await fetch(`/api/admin/customers/${params.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(adjustAmount),
          type: adjustType,
          reason: adjustReason.trim() || undefined,
          expiresAt
        }),
      });

      if (res.ok) {
        if (isSimulationMode) {
          // Update simulated customer points
          const simCustStr = localStorage.getItem("vega_sim_customers") || "[]";
          const simCust = JSON.parse(simCustStr);
          const pointsDiff = adjustType === "MANUAL_ADD" ? Number(adjustAmount) : -Number(adjustAmount);
          
          const updatedCust = simCust.map((c: any) => {
            if (c.phone === profile.phone || c.id === profile.id || c.email === profile.email) {
              const currentPts = Number(c.vegaPoints || 0);
              let nextPts = currentPts + pointsDiff;
              if (nextPts < 0) nextPts = 0;
              return { ...c, vegaPoints: nextPts };
            }
            return c;
          });
          localStorage.setItem("vega_sim_customers", JSON.stringify(updatedCust));

          // Log simulated transaction
          const simTxsStr = localStorage.getItem("vega_sim_transactions") || "[]";
          const simTxs = JSON.parse(simTxsStr);
          simTxs.unshift({
            id: `tx-sim-adjust-${Date.now()}`,
            userId: profile.id,
            amount: pointsDiff,
            remainingAmount: pointsDiff > 0 ? pointsDiff : 0,
            type: adjustType,
            reason: adjustReason.trim() || "Manual adjustment by administrator",
            expiresAt,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem("vega_sim_transactions", JSON.stringify(simTxs));

          // Sync active user vega_sim_points if it matches current page profile phone
          if (profile.phone === "8888888888") {
            const activeCust = updatedCust.find((c: any) => c.phone === "8888888888");
            if (activeCust) {
              localStorage.setItem("vega_sim_points", activeCust.vegaPoints.toString());
            }
          }
        }

        alert("Points adjusted successfully!");
        setAdjustAmount("");
        setAdjustReason("");
        setAdjustExpiryDays("");
        loadCustomerDetails();
      } else {
        const errText = await res.text();
        alert(`Failed to adjust points: ${errText}`);
      }
    } catch (error) {
      console.error("Failed to adjust points:", error);
      alert("Failed to adjust points due to a network error.");
    } finally {
      setIsAdjusting(false);
    }
  }

  useEffect(() => {
    loadCustomerDetails();
  }, [params.id]);

  async function loadCustomerDetails() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${params.id}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        setIsSimulationMode(false);
      } else {
        loadSimulatedDetails();
      }
    } catch (e) {
      console.warn("Details API failed. Falling back to local simulation.");
      loadSimulatedDetails();
    } finally {
      setIsLoading(false);
    }
  }

  const loadSimulatedDetails = () => {
    setIsSimulationMode(true);

    // 1. Gather all simulated data from localStorage
    const simOrders = JSON.parse(
      localStorage.getItem("vega_sim_orders") || "[]",
    );
    const simBookings = JSON.parse(
      localStorage.getItem("vega_sim_bookings") || "[]",
    );
    const simClaims = JSON.parse(
      localStorage.getItem("vega_sim_warranty_claims") || "[]",
    );

    // We assume the customerId is either user ID or email
    const email = customerId.includes("@")
      ? customerId.toLowerCase()
      : "customer@vegasports.in";

    // 2. Filter records matching this email
    const filteredOrders = simOrders.filter(
      (o: any) => o.email?.toLowerCase() === email,
    );
    const filteredBookings = simBookings.filter(
      (b: any) => b.phone === "8888888888" || b.email?.toLowerCase() === email,
    );
    const filteredClaims = simClaims.filter((c: any) => {
      // Find matching order first
      const ord = simOrders.find((o: any) => o.id === c.orderId);
      return ord && ord.email?.toLowerCase() === email;
    });

    // Mock cart and wishlist items
    const mockCart = [
      {
        id: "cart-sim-1",
        quantity: 1,
        product: {
          id: "mock-p-1",
          name: "VEGA Aero-X Carbon Cycle",
          sku: "VEGA-CYC-AEROX",
          price: 4500000,
          images: [
            "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
          ],
        },
      },
    ];

    const mockWishlist = [
      {
        id: "wish-sim-1",
        product: {
          id: "mock-p-2",
          name: "Aero Shield Helmet",
          sku: "VEGA-ACC-HELM",
          price: 249900,
          images: [
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop",
          ],
        },
      },
    ];

    // Mock Profile Details
    const savedSimName = localStorage.getItem("vega_sim_name");
    const savedSimPhone = localStorage.getItem("vega_sim_phone");
    const savedSimEmail = localStorage.getItem("vega_sim_email");
    const savedSimBirthday = localStorage.getItem("vega_sim_birthday");
    const savedSimGender = localStorage.getItem("vega_sim_gender");
    const savedSimClaimed = localStorage.getItem("vega_sim_profile_reward_claimed");

    const mockProfile = {
      id: customerId,
      name: savedSimName || (email === "customer@vegasports.in" ? "Priyanshu Ranchi" : email.split("@")[0]),
      email: savedSimEmail || email,
      phone: savedSimPhone || "8888888888",
      birthday: savedSimBirthday || null,
      gender: savedSimGender || null,
      profileRewardClaimed: savedSimClaimed === "true",
      profileCompletionPercent: 0,
      joined: "2026-06-01",
      isGuest: email !== "customer@vegasports.in",
      addresses: [
        {
          id: "addr-sim-1",
          name: savedSimName || "Priyanshu Ranchi",
          street: "Flat 101, Lalpur Main Road",
          city: "Ranchi",
          state: "Jharkhand",
          pincode: "834001",
          phone: savedSimPhone || "8888888888",
        },
      ],
    };

    let filled = 0;
    const total = 5;
    if (mockProfile.name && mockProfile.name.trim().length > 0) filled++;
    if (mockProfile.email && mockProfile.email.trim().length > 0) filled++;
    if (mockProfile.phone && mockProfile.phone.trim().length > 0) filled++;
    if (mockProfile.gender && mockProfile.gender.trim().length > 0) filled++;
    if (mockProfile.birthday) filled++;
    mockProfile.profileCompletionPercent = Math.round((filled / total) * 100);

    const totalSpent = filteredOrders.reduce(
      (sum: number, o: any) => sum + o.total,
      0,
    );

    setData({
      profile: mockProfile,
      orders: filteredOrders.map((o: any) => ({
        id: o.id,
        createdAt: new Date(o.date + "T12:00:00Z").toISOString(),
        total: o.total,
        status: o.status,
        items: o.items.map((i: any) => ({
          id: `item-${i.name}`,
          quantity: i.qty || i.quantity || 1,
          price: i.price || 0,
          product: {
            name: i.name,
            images: [i.image || ""],
            sku: i.sku || "N/A",
          },
        })),
      })),
      bookings: filteredBookings,
      warrantyClaims: filteredClaims,
      cartItems: mockCart,
      wishlistItems: mockWishlist,
      analytics: {
        totalSpent,
        ordersCount: filteredOrders.length,
        bookingsCount: filteredBookings.length,
        claimsCount: filteredClaims.length,
        cartCount: mockCart.length,
        wishlistCount: mockWishlist.length,
      },
    });
  };

  // Memoized Tab Lists Filtered by Search Query
  const filteredTabContent = useMemo(() => {
    if (!data) return [];
    const query = searchQuery.trim().toLowerCase();

    switch (activeTab) {
      case "orders":
        return data.orders.filter(
          (o: any) =>
            o.id.toLowerCase().includes(query) ||
            o.status.toLowerCase().includes(query) ||
            o.items.some((item: any) =>
              item.product.name.toLowerCase().includes(query),
            ),
        );
      case "services":
        return data.bookings.filter(
          (b: any) =>
            b.planName.toLowerCase().includes(query) ||
            b.status.toLowerCase().includes(query) ||
            b.type.toLowerCase().includes(query),
        );
      case "warranty":
        return data.warrantyClaims.filter(
          (c: any) =>
            c.id.toLowerCase().includes(query) ||
            c.productName.toLowerCase().includes(query) ||
            c.serialNo.toLowerCase().includes(query) ||
            c.status.toLowerCase().includes(query),
        );
      default:
        return [];
    }
  }, [activeTab, searchQuery, data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--obsidian)] flex items-center justify-center p-8 rounded-2xl">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--steel)]/60 border-t-[var(--agni)] animate-spin mx-auto" />
          <p className="text-xs uppercase font-bold text-[var(--smoke)] tracking-wider">
            Loading Customer Portfolio...
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen bg-[var(--obsidian)] p-8 rounded-2xl space-y-4 text-center">
        <AlertTriangle size={32} className="mx-auto text-red-500" />
        <h2 className="text-lg font-sans font-bold text-[var(--chalk)]">
          Customer Portfolio Not Found
        </h2>
        <p className="text-xs text-[var(--smoke)]">
          We could not load details for this customer registry entry.
        </p>
        <button
          onClick={() => router.push("/admin/customers")}
          className="px-4 py-2 bg-[var(--agni)] text-white text-xs font-bold uppercase rounded-lg"
        >
          Back to Registry
        </button>
      </div>
    );
  }

  const { profile, analytics, cartItems, wishlistItems } = data;

  return (
    <div className="space-y-8 bg-[var(--obsidian)] border border-[var(--steel)]/60 p-6 md:p-8 rounded-2xl min-h-screen text-[var(--white)]">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--steel)]/50 pb-6 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/admin/customers")}
            className="p-2 bg-[var(--carbon)] hover:bg-[var(--steel)] rounded-lg text-[var(--smoke)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wide">
                {profile.name}
              </h1>
              {profile.isGuest ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[var(--carbon)] text-[var(--smoke)] border border-[var(--steel)]/60 uppercase font-bold tracking-wider">
                  Guest checkout
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[var(--agni-glow)] text-[var(--agni-light)] border border-[var(--agni)]/30 uppercase font-bold tracking-wider">
                  Registered Member
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--smoke)] font-sans mt-0.5">
              Rider ID: {profile.id}
            </p>
          </div>
        </div>

        {isSimulationMode && (
          <span className="text-[9px] bg-[var(--gold)]/10 text-[var(--gold-light)] border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Sandbox Offline Mode
          </span>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <CircleDollarSign
            size={20}
            className="text-[var(--agni)] absolute right-4 top-4"
          />
          <p className="text-[10px] uppercase tracking-wider text-[var(--smoke)] font-bold font-sans">
            Total Spent
          </p>
          <p className="text-xl font-display font-extrabold text-white mt-2">
            ₹{(analytics.totalSpent / 100).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <ShoppingBag
            size={18}
            className="text-[var(--gold)] absolute right-4 top-4"
          />
          <p className="text-[10px] uppercase tracking-wider text-[var(--smoke)] font-bold font-sans">
            Orders History
          </p>
          <p className="text-xl font-display font-extrabold text-white mt-2">
            {analytics.ordersCount} Order(s)
          </p>
        </div>

        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <Wrench size={18} className="text-blue-500 absolute right-4 top-4" />
          <p className="text-[10px] uppercase tracking-wider text-[var(--smoke)] font-bold font-sans">
            Servicing Bookings
          </p>
          <p className="text-xl font-display font-extrabold text-white mt-2">
            {analytics.bookingsCount} Booking(s)
          </p>
        </div>

        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <ShieldCheck
            size={18}
            className="text-green-600 absolute right-4 top-4"
          />
          <p className="text-[10px] uppercase tracking-wider text-[var(--smoke)] font-bold font-sans">
            Warranty Claims
          </p>
          <p className="text-xl font-display font-extrabold text-white mt-2">
            {analytics.claimsCount} Claim(s)
          </p>
        </div>

        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <Gift
            size={18}
            className="text-[var(--agni)] absolute right-4 top-4"
          />
          <p className="text-[10px] uppercase tracking-wider text-[var(--smoke)] font-bold font-sans">
            Vyorax Club Points
          </p>
          <p className="text-xl font-display font-extrabold text-white mt-2">
            {profile.vegaPoints ?? 0} pts
          </p>
        </div>
      </div>

      {/* Profile Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Profile Card (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-sans font-bold uppercase text-white tracking-wider border-b border-[var(--steel)]/40 pb-3 flex items-center space-x-1.5">
            <User size={14} className="text-[var(--agni)]" />
            <span>Profile Contact Sheet</span>
          </h3>

          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center space-x-3">
              <Mail className="text-[var(--smoke)] flex-shrink-0" size={14} />
              <div className="min-w-0">
                <p className="text-[var(--smoke)] font-medium">Email Address</p>
                <p className="text-[var(--chalk)] font-bold font-mono break-all mt-0.5">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="text-[var(--smoke)] flex-shrink-0" size={14} />
              <div>
                <p className="text-[var(--smoke)] font-medium">Phone Number</p>
                <p className="text-[var(--chalk)] font-bold font-mono mt-0.5">
                  {profile.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="text-[var(--smoke)] flex-shrink-0" size={14} />
              <div>
                <p className="text-[var(--smoke)] font-medium">Birthday</p>
                <p className="text-[var(--chalk)] font-bold mt-0.5 font-mono">
                  {profile.birthday || "Not Provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="text-[var(--smoke)] flex-shrink-0" size={14} />
              <div>
                <p className="text-[var(--smoke)] font-medium">Gender</p>
                <p className="text-[var(--chalk)] font-bold mt-0.5 capitalize">
                  {profile.gender || "Not Specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="text-[var(--smoke)] flex-shrink-0" size={14} />
              <div>
                <p className="text-[var(--smoke)] font-medium">Member Since</p>
                <p className="text-[var(--chalk)] font-bold mt-0.5 font-mono">
                  {profile.joined}
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--steel)]/40 pt-4 space-y-3">
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[var(--smoke)] mb-1">
                  <span>Profile Strength</span>
                  <span className="font-mono text-[var(--chalk)] font-black">{profile.profileCompletionPercent || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300 ${profile.profileCompletionPercent === 100 ? "bg-[var(--forest)]/100" : "bg-[var(--gold)]/100"}`}
                    style={{ width: `${profile.profileCompletionPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="text-[var(--smoke)] uppercase font-bold">Reward Claimed:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide border ${profile.profileRewardClaimed ? "bg-[var(--forest)]/10 border-[var(--forest)]/20 text-emerald-400" : "bg-[var(--carbon)] border-[var(--steel)]/60 text-[var(--smoke)]"}`}>
                  {profile.profileRewardClaimed ? "Yes (Claimed)" : "No (Unclaimed)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Layout (8 cols) */}
        <div className="lg:col-span-8 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm flex flex-col space-y-6">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 pb-3 border-b border-[var(--steel)]/60 ">
            {[
              { key: "orders", label: "Orders List", icon: ShoppingBag },
              {
                key: "cart",
                label: `Cart & Wishlist (${analytics.cartCount + analytics.wishlistCount})`,
                icon: ShoppingCart,
              },
              { key: "services", label: "Servicing & Repair", icon: Wrench },
              { key: "warranty", label: "Warranty Claims", icon: ShieldCheck },
              { key: "addresses", label: "Saved Addresses", icon: MapPin },
              { key: "loyalty", label: "Vyorax Club Points", icon: Gift },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as TabKey);
                    setSearchQuery("");
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all border ${
                    isSelected
                      ? "bg-[var(--agni)] border-[var(--agni)] text-white shadow-sm shadow-[var(--agni)]/10"
                      : "bg-[var(--charcoal)] hover:bg-[var(--charcoal)] border-[var(--steel)]/60 text-[var(--smoke)]"
                  }`}
                  style={{ color: isSelected ? "white" : "" }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar helper within tabs */}
          {["orders", "services", "warranty"].includes(activeTab) && (
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search inside ${activeTab}...`}
                className="w-full bg-[var(--carbon)] border border-[var(--steel)]/80 rounded-lg px-4 py-2 pl-9 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
              />
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-[var(--smoke)]"
              />
            </div>
          )}

          {/* TAB CONTENTS */}
          <div className="min-h-[250px]">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {filteredTabContent.length === 0 ? (
                  <p className="text-xs text-[var(--smoke)] italic text-center py-12">
                    No orders registered for this customer.
                  </p>
                ) : (
                  filteredTabContent.map((order: any) => (
                    <div
                      key={order.id}
                      className="border border-[var(--steel)]/60 rounded-xl p-4 bg-[var(--carbon)] space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] border-b border-[var(--steel)]/60/60 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[var(--silver)] font-mono text-xs font-bold">
                            {order.id}
                          </span>
                          <span className="bg-neutral-200 text-[var(--smoke)] px-2 py-0.5 rounded font-bold font-sans">
                            {
                              new Date(order.createdAt)
                                .toISOString()
                                .split("T")[0]
                            }
                          </span>
                        </div>
                        <span className="text-[var(--agni-light)]">
                          {order.status}
                        </span>
                      </div>

                      {/* Items row */}
                      <div className="space-y-3">
                        {order.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-xs font-sans"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-[var(--chalk)] truncate">
                                {item.product?.name || "Product SKU Lookup"}
                              </p>
                              <p className="text-[10px] text-[var(--smoke)] font-mono mt-0.5">
                                SKU: {item.product?.sku || "N/A"}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <span className="text-[var(--smoke)] font-medium">
                                Qty {item.quantity}
                              </span>
                              <span className="text-[var(--chalk)] font-bold ml-3">
                                ₹
                                {(
                                  (item.price * item.quantity) /
                                  100
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total and Actions */}
                      <div className="flex justify-between items-center border-t border-[var(--steel)]/60/60 pt-3 text-xs font-sans font-bold uppercase tracking-wider">
                        <span>
                          Total Paid: ₹
                          {(order.total / 100).toLocaleString("en-IN")}
                        </span>
                        <Link
                          href={`/admin/orders?search=${order.id}`}
                          className="inline-flex items-center space-x-1.5 text-[var(--agni)] hover:text-orange-500 font-bold"
                        >
                          <span>Manage Order</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cart & Wishlist Tab */}
            {activeTab === "cart" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Cart */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] border-b border-[var(--steel)]/40 pb-2 flex items-center space-x-1.5">
                    <ShoppingCart size={12} className="text-[var(--agni)]" />
                    <span>Active Shopping Cart</span>
                  </h4>
                  {cartItems.length === 0 ? (
                    <p className="text-xs text-[var(--smoke)] italic py-6 text-center">
                      Cart is currently empty.
                    </p>
                  ) : (
                    cartItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border border-[var(--steel)]/60 rounded-xl p-3 bg-[var(--carbon)] shadow-sm text-xs font-sans"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--chalk)] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-[var(--smoke)] font-mono mt-0.5">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold text-[var(--silver)] flex-shrink-0 ml-4">
                          ₹
                          {(
                            (item.product.price * item.quantity) /
                            100
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Wishlist */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] border-b border-[var(--steel)]/40 pb-2 flex items-center space-x-1.5">
                    <Heart size={12} className="text-red-500" />
                    <span>Saved Wishlist Items</span>
                  </h4>
                  {wishlistItems.length === 0 ? (
                    <p className="text-xs text-[var(--smoke)] italic py-6 text-center">
                      No items wishlisted.
                    </p>
                  ) : (
                    wishlistItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border border-[var(--steel)]/60 rounded-xl p-3 bg-[var(--carbon)] shadow-sm text-xs font-sans"
                      >
                        <p className="font-bold text-[var(--chalk)] truncate">
                          {item.product.name}
                        </p>
                        <span className="font-bold text-[var(--silver)] flex-shrink-0 ml-4">
                          ₹{(item.product.price / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Services & Repairs Tab */}
            {activeTab === "services" && (
              <div className="space-y-4">
                {filteredTabContent.length === 0 ? (
                  <p className="text-xs text-[var(--smoke)] italic text-center py-12">
                    No servicing bookings registered.
                  </p>
                ) : (
                  filteredTabContent.map((booking: any) => (
                    <div
                      key={booking.id}
                      className="border border-[var(--steel)]/60 rounded-xl p-4 bg-[var(--carbon)] space-y-3 shadow-sm text-xs font-sans"
                    >
                      <div className="flex justify-between items-center font-bold uppercase tracking-wider text-[10px] text-[var(--smoke)] border-b border-[var(--steel)]/60/60 pb-2">
                        <span>
                          {booking.type} Booking: {booking.id}
                        </span>
                        <span className="text-[var(--agni)]">
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="font-bold text-[var(--chalk)]">
                            {booking.planName}
                          </p>
                          <p className="text-[var(--smoke)] mt-1">
                            Contact Phone: {booking.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[var(--chalk)]">
                            ₹{(booking.price / 100).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-[var(--smoke)] font-mono mt-1">
                            Booked:{" "}
                            {
                              new Date(booking.createdAt)
                                .toISOString()
                                .split("T")[0]
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Warranty Claims Tab */}
            {activeTab === "warranty" && (
              <div className="space-y-4">
                {filteredTabContent.length === 0 ? (
                  <p className="text-xs text-[var(--smoke)] italic text-center py-12">
                    No warranty claims filed by this customer.
                  </p>
                ) : (
                  filteredTabContent.map((claim: any) => (
                    <div
                      key={claim.id}
                      className="border border-[var(--steel)]/60 rounded-xl p-4 bg-[var(--carbon)] space-y-3 shadow-sm text-xs font-sans"
                    >
                      <div className="flex justify-between items-center font-bold uppercase tracking-wider text-[10px] text-[var(--smoke)] border-b border-[var(--steel)]/60/60 pb-2">
                        <span>Claim ID: {claim.id}</span>
                        <span className="text-[var(--gold)]">
                          {claim.status}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--chalk)]">
                          {claim.productName}
                        </p>
                        <p className="text-[var(--smoke)] mt-1 font-mono text-[10px]">
                          Serial No: {claim.serialNo}
                        </p>
                        <p className="text-[var(--smoke)] mt-2 bg-[var(--charcoal)] p-2.5 rounded-lg border border-[var(--steel)]/60/60">
                          <strong>Issue Details:</strong> {claim.issueDesc}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-[var(--steel)]/60/60 pt-2.5 text-[10px] text-[var(--smoke)] uppercase font-bold tracking-wider">
                        <span>Associated Order: {claim.orderId}</span>
                        <Link
                          href="/admin/warranty"
                          className="text-[var(--agni)] hover:text-orange-500"
                        >
                          Review in Claims panel
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.addresses.length === 0 ? (
                  <p className="text-xs text-[var(--smoke)] italic text-center py-12 md:col-span-2">
                    No addresses stored.
                  </p>
                ) : (
                  profile.addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      className="border border-[var(--steel)]/60 rounded-xl p-4 bg-[var(--carbon)] space-y-2 shadow-sm text-xs font-sans relative"
                    >
                      <MapPin
                        size={14}
                        className="text-[var(--agni)] absolute right-4 top-4"
                      />
                      <p className="font-bold text-[var(--chalk)]">{addr.name}</p>
                      <p className="text-[var(--smoke)] mt-1 leading-relaxed">
                        {addr.street}
                      </p>
                      <p className="text-[var(--smoke)]">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      {addr.phone && (
                        <p className="text-[var(--smoke)] font-mono text-[10px] mt-2">
                          Phone: {addr.phone}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Loyalty (Vyorax Club Points) Tab */}
            {activeTab === "loyalty" && (
              <div className="space-y-6">
                {/* Points Balance Banner */}
                <div className="bg-gradient-to-r from-orange-500/10 via-neutral-100 to-transparent border border-[var(--steel)]/60 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-xs font-sans font-bold uppercase text-[var(--smoke)] tracking-wider">
                      Active Balance
                    </h4>
                    <p className="text-3xl font-display font-extrabold text-[var(--agni)] mt-1.5">
                      {profile.vegaPoints ?? 0}{" "}
                      <span className="text-xs font-sans font-normal text-[var(--smoke)] uppercase tracking-widest">
                        Vyorax Club Points
                      </span>
                    </p>
                  </div>
                  <div className="text-xs text-[var(--smoke)] font-sans leading-relaxed max-w-sm">
                    Vyorax Club Points are awarded automatically on cycles (2%),
                    accessories (5%), and service bookings (5%). Points can be
                    redeemed at checkout (max 10% of order value).
                  </div>
                </div>

                {/* Expirations Calendar */}
                {profile.expirations && profile.expirations.length > 0 && (
                  <div className="bg-[var(--gold)]/10/50 border border-amber-200 rounded-xl p-5 space-y-3">
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-amber-800 flex items-center space-x-1.5">
                      <Calendar size={12} />
                      <span>Points Expiry Calendar (Active Schedules)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {profile.expirations.map((exp: any, idx: number) => (
                        <div key={idx} className="bg-[var(--carbon)] border border-[var(--gold)]/20 rounded-lg p-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-[var(--gold-light)]">{exp.remainingAmount} pts</span>
                            <span className="text-[8px] text-[var(--smoke)] block uppercase font-bold tracking-wider mt-0.5">Expires</span>
                          </div>
                          <div className="text-right text-[10px] font-medium text-[var(--smoke)]">
                            {new Date(exp.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Adjustments Panel */}
                {!profile.isGuest && (
                  <form
                    onSubmit={handleAdjustPoints}
                    className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-5 space-y-4"
                  >
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] border-b border-[var(--steel)]/60/60 pb-2 flex items-center space-x-1.5">
                      <Gift size={12} className="text-[var(--agni)]" />
                      <span>Manual Points Adjustment</span>
                    </h4>

                    <div className={`grid grid-cols-1 ${adjustType === "MANUAL_ADD" ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-4`}>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Points Amount
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3 py-2 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Action Type
                        </label>
                        <select
                          value={adjustType}
                          onChange={(e: any) => {
                            setAdjustType(e.target.value);
                            setAdjustExpiryDays("");
                          }}
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3 py-2 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] font-sans font-bold"
                        >
                          <option value="MANUAL_ADD">Add Points (+)</option>
                          <option value="MANUAL_SUB">Deduct Points (-)</option>
                        </select>
                      </div>

                      {adjustType === "MANUAL_ADD" && (
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                            Expiry (Days)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={adjustExpiryDays}
                            onChange={(e) => setAdjustExpiryDays(e.target.value)}
                            placeholder="Never expires"
                            className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3 py-2 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] font-mono font-bold"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Adjustment Reason
                        </label>
                        <input
                          type="text"
                          required
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          placeholder="e.g. Goodwill gesture"
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3 py-2 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        type="submit"
                        disabled={isAdjusting}
                        className="px-4 py-2 bg-[var(--agni)] hover:bg-orange-600 disabled:bg-neutral-300 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                      >
                        {isAdjusting ? "Processing..." : "Apply Adjustment"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Transactions Ledger */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] border-b border-[var(--steel)]/40 pb-2">
                    Points Transactions Ledger
                  </h4>

                  {!profile.pointsTransactions ||
                  profile.pointsTransactions.length === 0 ? (
                    <p className="text-xs text-[var(--smoke)] italic text-center py-8">
                      No points transactions recorded for this customer.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[var(--steel)]/60 text-[var(--smoke)] uppercase text-[9px] tracking-wider font-bold">
                            <th className="py-2.5">Date</th>
                            <th className="py-2.5">Type</th>
                            <th className="py-2.5">Amount</th>
                            <th className="py-2.5">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {profile.pointsTransactions.map((tx: any) => {
                            const isPositive = tx.amount > 0;
                            return (
                              <tr
                                key={tx.id}
                                className="text-[var(--silver)] hover:bg-[var(--carbon)]/50"
                              >
                                <td className="py-2.5 font-mono text-[var(--smoke)]">
                                  {
                                    new Date(tx.createdAt)
                                      .toISOString()
                                      .split("T")[0]
                                  }
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                      tx.type === "EARNED"
                                        ? "bg-[var(--forest)]/10 text-emerald-700 border border-[var(--forest)]/20"
                                        : tx.type === "REDEEMED"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : tx.type === "CANCEL_REFUND"
                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                            : "bg-[var(--gold)]/10 text-[var(--gold-light)] border border-amber-200"
                                    }`}
                                  >
                                    {tx.type.replace("MANUAL_", "")}
                                  </span>
                                </td>
                                <td
                                  className={`py-2.5 font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-600"}`}
                                >
                                  {isPositive ? `+${tx.amount}` : tx.amount} pts
                                </td>
                                 <td
                                   className="py-2.5 text-[var(--smoke)] max-w-xs truncate"
                                   title={tx.reason}
                                 >
                                   <div>
                                     <span>{tx.reason || "N/A"}</span>
                                     {tx.expiresAt && tx.amount > 0 && (
                                       <span className="block text-[9px] mt-0.5">
                                         {tx.remainingAmount > 0 ? (
                                           <span className="text-amber-600 font-bold uppercase tracking-wider">
                                             ⚠️ Expires: {new Date(tx.expiresAt).toLocaleDateString("en-IN")} ({tx.remainingAmount} active)
                                           </span>
                                         ) : (
                                           <span className="text-[var(--smoke)] uppercase tracking-wider font-bold">
                                             Consumed / Expired
                                           </span>
                                         )}
                                       </span>
                                     )}
                                   </div>
                                 </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
