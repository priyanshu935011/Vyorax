"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  User as UserIcon,
  ShoppingBag,
  Heart,
  MapPin,
  Award,
  Key,
  LogOut,
  CheckCircle,
  ArrowRight,
  Star,
  Wrench,
  Smartphone,
  Lock,
  Edit2,
} from "lucide-react";
import { useWishlistStore, useCartStore, usePincodeStore } from "@/lib/store";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";

type TabKey =
  | "overview"
  | "orders"
  | "wishlist"
  | "addresses"
  | "profile"
  | "loyalty"
  | "bookings";

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get("redirect"));
    }
  }, []);

  // Redirect admin users to admin panel
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [session, status, router]);

  // Login form states
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBirthday, setProfileBirthday] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(0);
  const [profileRewardClaimed, setProfileRewardClaimed] = useState(false);
  const [profileRewardPoints, setProfileRewardPoints] = useState(100);
  const [expirations, setExpirations] = useState<any[]>([]);

  // Interconnected OTP boxes states and refs
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOtpInput(otpValues.join(""));
  }, [otpValues]);

  // Load profile settings configuration
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const config = data.homepageConfig || {};
          const loyaltyConfig = config.loyaltyConfig || {};
          setProfileRewardPoints(Number(loyaltyConfig.profilePoints ?? 100));
        }
      } catch (e) {}
    }
    loadSettings();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Mobile navigation scroll assistance states
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const [scrollRatio, setScrollRatio] = useState(0);

  const handleTabsScroll = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setShowLeftFade(scrollLeft > 5);
    setShowRightFade(scrollLeft < maxScroll - 5);
    if (maxScroll > 0) {
      setScrollRatio(scrollLeft / maxScroll);
    } else {
      setScrollRatio(0);
    }
  };

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const checkScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setShowLeftFade(el.scrollLeft > 5);
      setShowRightFade(el.scrollLeft < maxScroll - 5);
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [status]);

  // Bookings state
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadBookings() {
      setBookingsLoading(true);
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          setServiceBookings(data);
        } else {
          loadSimulatedBookings();
        }
      } catch (err) {
        loadSimulatedBookings();
      } finally {
        setBookingsLoading(false);
      }
    }

    const loadSimulatedBookings = () => {
      const saved = localStorage.getItem("vega_sim_bookings");
      if (saved) {
        try {
          setServiceBookings(JSON.parse(saved));
        } catch (e) {
          setServiceBookings([]);
        }
      } else {
        setServiceBookings([]);
      }
    };

    loadBookings();
  }, [status]);

  // Profile Form States
  const [profileName, setProfileName] = useState(
    session?.user?.name || "Priyanshu Ranchi",
  );
  const [profilePhone, setProfilePhone] = useState("8888888888");

  // Computed local completion percentage for immediate UI feedback
  const computedCompletionPercent = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (profileName && profileName.trim().length > 0) filled++;
    if (profileEmail && profileEmail.trim().length > 0) filled++;
    if (session?.user?.phone || profilePhone) filled++;
    if (profileGender && profileGender.trim().length > 0) filled++;
    if (profileBirthday) filled++;
    return Math.round((filled / total) * 100);
  }, [
    profileName,
    profileEmail,
    profilePhone,
    profileGender,
    profileBirthday,
    session,
  ]);

  // Loyalty states
  const [vegaPoints, setVegaPoints] = useState(0);
  const [pointsTransactions, setPointsTransactions] = useState<any[]>([]);

  // Wishlist Zustand sync
  const wishlistIds = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const addItemToCart = useCartStore((state) => state.addItem);

  // Fetch wishlisted products from mock data list
  // In real implementation we filter MOCK_PRODUCTS by wishlistIds
  const wishlistProducts = MOCK_PRODUCTS.filter((p) =>
    wishlistIds.includes(p.id),
  );

  // Address simulation state
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      name: "Priyanshu Ranchi",
      street: "Flat 101, Lalpur Main Road",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834001",
      phone: "8888888888",
      isDefault: true,
    },
  ]);

  // Order history state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const dynamicTotalSpend = useMemo(() => {
    const activeStatuses = [
      "DELIVERED",
      "SHIPPED",
      "PROCESSING",
      "CONFIRMED",
      "OUT_FOR_DELIVERY",
    ];
    return orders
      .filter((o) => activeStatuses.includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadOrders() {
      setOrdersLoading(true);

      const simReviewsStr = localStorage.getItem("vega_sim_reviews");
      const simReviewedIds = new Set<string>();
      if (simReviewsStr) {
        try {
          const simReviews = JSON.parse(simReviewsStr);
          simReviews.forEach((r: any) => simReviewedIds.add(r.productId));
        } catch (e) {}
      }

      let dbOrders: any[] = [];
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          dbOrders = data.map((o: any) => ({
            ...o,
            items: o.items.map((i: any) => ({
              ...i,
              isReviewed: i.isReviewed || simReviewedIds.has(i.id),
            })),
          }));
        }
      } catch (err) {
        console.warn("DB offline. Using mock/localStorage orders fallback.");
      }

      // Merge with simulated orders from localStorage
      try {
        const simOrdersStr = localStorage.getItem("vega_sim_orders");
        if (simOrdersStr) {
          const simOrders = JSON.parse(simOrdersStr);
          // Filter simOrders for the current user's phone or email if logged in
          const userPhone = session?.user?.phone;
          const userEmail = session?.user?.email;
          const filteredSim = simOrders.filter(
            (o: any) =>
              (!userPhone && !userEmail) ||
              (userPhone && o.phone === userPhone) ||
              (userEmail && o.email?.toLowerCase() === userEmail.toLowerCase()),
          );

          // Merge lists and prevent duplicates
          const merged = [...dbOrders];
          for (const sOrd of filteredSim) {
            if (!merged.some((o) => o.id === sOrd.id)) {
              merged.push({
                id: sOrd.id,
                date: sOrd.date,
                total: sOrd.total,
                status: sOrd.status,
                items: sOrd.items.map((i: any) => ({
                  id: i.id || "prod-aero-x",
                  slug: i.slug || "giant-aero-x-carbon",
                  name: i.name,
                  qty: i.qty || i.quantity || 1,
                  image: i.image || "",
                  isReviewed: simReviewedIds.has(i.id || "prod-aero-x"),
                })),
              });
            }
          }
          if (merged.length > 0) {
            setOrders(merged);
            setOrdersLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Error parsing simulated orders", e);
      }

      if (dbOrders.length > 0) {
        setOrders(dbOrders);
      } else {
        const mockOrdersList = [
          {
            id: "VEGA-ORD-938210",
            date: "2026-06-05",
            total: 4775000,
            status: "DELIVERED",
            items: [
              {
                id: "prod-aero-x",
                slug: "giant-aero-x-carbon",
                name: "VEGA Aero-X Carbon Cycle",
                qty: 1,
                image:
                  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop",
                isReviewed: simReviewedIds.has("prod-aero-x"),
              },
              {
                id: "prod-aero-helmet",
                slug: "giro-aero-shield-helmet",
                name: "Aero Shield Helmet",
                qty: 1,
                image:
                  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=100&auto=format&fit=crop",
                isReviewed: simReviewedIds.has("prod-aero-helmet"),
              },
            ],
          },
          {
            id: "VEGA-ORD-104928",
            date: "2026-06-08",
            total: 2450000,
            status: "SHIPPED",
            items: [
              {
                id: "prod-ranchi-mtb",
                slug: "trek-ranchi-rider-mtb",
                name: "VEGA Ranchi Rider MTB",
                qty: 1,
                image:
                  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop",
                isReviewed: simReviewedIds.has("prod-ranchi-mtb"),
              },
            ],
          },
        ];
        setOrders(mockOrdersList);
      }
      setOrdersLoading(false);
    }

    const loadMockOrders = () => {
      setOrders([
        {
          id: "VEGA-ORD-938210",
          date: "2026-06-05",
          total: 4775000,
          status: "DELIVERED",
          items: [
            {
              name: "VEGA Aero-X Carbon Cycle",
              qty: 1,
              image:
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop",
            },
            {
              name: "Aero Shield Helmet",
              qty: 1,
              image:
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=100&auto=format&fit=crop",
            },
          ],
        },
        {
          id: "VEGA-ORD-104928",
          date: "2026-06-08",
          total: 2450000,
          status: "SHIPPED",
          items: [
            {
              name: "VEGA Ranchi Rider MTB",
              qty: 1,
              image:
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop",
            },
          ],
        },
      ]);
    };

    loadOrders();
  }, [status]);

  const loadSimulatedProfile = () => {
    const savedSimPoints = localStorage.getItem("vega_sim_points");
    const savedSimTxs = localStorage.getItem("vega_sim_transactions");
    const savedSimExpirations = localStorage.getItem("vega_sim_expirations");
    if (savedSimPoints) {
      setVegaPoints(Number(savedSimPoints));
    } else {
      setVegaPoints(0);
    }
    if (savedSimTxs) {
      try {
        setPointsTransactions(JSON.parse(savedSimTxs));
      } catch (e) {}
    } else {
      setPointsTransactions([
        {
          id: "tx-sim-1",
          amount: 50,
          type: "EARNED",
          reason: "Account Signup Bonus",
          createdAt: "2026-06-01T12:00:00.000Z",
        },
        {
          id: "tx-sim-2",
          amount: 200,
          type: "EARNED",
          reason: "Purchase Points - Order VEGA-ORD-938210",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ]);
    }
    if (savedSimExpirations) {
      try {
        setExpirations(JSON.parse(savedSimExpirations));
      } catch (e) {}
    } else {
      // Mock upcoming expirations (14 days and 30 days out)
      setExpirations([
        {
          id: "exp-sim-1",
          amount: 50,
          expiresAt: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "exp-sim-2",
          amount: 200,
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ]);
    }
    // Load simulated user details
    const savedName = localStorage.getItem("vega_sim_name");
    const savedPhone = localStorage.getItem("vega_sim_phone");
    const savedEmail = localStorage.getItem("vega_sim_email");
    const savedBirthday = localStorage.getItem("vega_sim_birthday");
    const savedSimGender = localStorage.getItem("vega_sim_gender");
    const savedSimClaimed = localStorage.getItem(
      "vega_sim_profile_reward_claimed",
    );
    if (savedName) setProfileName(savedName);
    if (savedPhone) setProfilePhone(savedPhone);
    if (savedEmail) setProfileEmail(savedEmail);
    if (savedBirthday) setProfileBirthday(savedBirthday);
    if (savedSimGender) setProfileGender(savedSimGender);
    if (savedSimClaimed) setProfileRewardClaimed(savedSimClaimed === "true");
  };

  // Load profile details from database
  useEffect(() => {
    if (status !== "authenticated") {
      loadSimulatedProfile();
      return;
    }

    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setProfileName(data.name);
          if (data.phone) setProfilePhone(data.phone);
          if (data.email) setProfileEmail(data.email);
          if (data.birthday) setProfileBirthday(data.birthday.split("T")[0]);
          if (data.gender) setProfileGender(data.gender);
          setVegaPoints(data.vegaPoints || 0);
          setProfileCompletionPercent(data.profileCompletionPercent || 0);
          setProfileRewardClaimed(data.profileRewardClaimed || false);
          setPointsTransactions(data.pointsTransactions || []);
          setExpirations(data.expirations || []);
        } else {
          loadSimulatedProfile();
        }
      } catch (err) {
        console.warn("Error loading profile from database");
        loadSimulatedProfile();
      }
    }

    loadProfile();
  }, [status]);

  // Loyalty history simulation / state placeholder
  // We use vegaPoints and pointsTransactions states

  // Handle phone input changes & auto-send OTP on 10 digits
  const handlePhoneChange = (val: string) => {
    if (isOtpSent) return;
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setPhoneInput(cleaned);
    if (cleaned.length === 10) {
      handleSendOtp(cleaned);
    }
  };

  // Handle sending verification OTP
  const handleSendOtp = (phoneVal?: string) => {
    const targetPhone = phoneVal || phoneInput;
    if (!targetPhone || targetPhone.trim().length < 10) {
      alert("Please enter a valid 10-digit mobile number first.");
      return;
    }
    setIsOtpSent(true);
    setOtpTimer(30);
    
    // Auto-focus first OTP box after a brief tick
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 150);

    alert(
      `[Sandbox Alert] Temporary Verification OTP sent to mobile number ${targetPhone}! Use any 6-digit code (e.g. 123456) to authenticate.`,
    );
  };

  // Unlock phone number input to let user edit it
  const handleEditPhone = () => {
    setIsOtpSent(false);
    setOtpValues(Array(6).fill(""));
    setOtpTimer(0);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  // OTP interconnected boxes input handlers
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = "";
      setOtpValues(newOtpValues);
      return;
    }

    const lastChar = cleaned.slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = lastChar;
    setOtpValues(newOtpValues);

    // Auto-focus next field
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const newOtpValues = pasteData.split("");
      setOtpValues(newOtpValues);
      otpRefs.current[5]?.focus();
    }
  };

  // Handle credentials login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) {
      alert("Please request an OTP first.");
      return;
    }
    if (!otpInput || otpInput.length < 6) {
      alert("Please enter a valid 6-digit verification code.");
      return;
    }
    setLoginLoading(true);
    try {
      const result = await signIn("credentials", {
        phone: phoneInput.trim(),
        otp: otpInput.trim(),
        redirect: false,
      });

      if (result?.error) {
        alert(
          "Authentication failed. Make sure to input the correct mobile number and any OTP.",
        );
      } else {
        // Successful login
        if (redirectUrl === "cart") {
          window.location.href = "/cart";
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      alert("Error logging in. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Sign out helper
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  const [profileSaving, setProfileSaving] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
          birthday: profileBirthday || null,
          gender: profileGender || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert("Profile details updated successfully!");
        if (data.user?.name) {
          setProfileName(data.user.name);
          await update({ name: data.user.name });
        }
        if (data.user?.phone) setProfilePhone(data.user.phone);
        if (data.user?.email) setProfileEmail(data.user.email);
        if (data.user?.birthday) {
          setProfileBirthday(data.user.birthday.split("T")[0]);
        } else {
          setProfileBirthday("");
        }
        if (data.user?.gender) setProfileGender(data.user.gender);
        if (data.user?.profileRewardClaimed)
          setProfileRewardClaimed(data.user.profileRewardClaimed);
        if (data.user?.profileCompletionPercent !== undefined) {
          setProfileCompletionPercent(data.user.profileCompletionPercent);
        }
        window.location.reload();
      } else {
        // Fallback simulation mode
        localStorage.setItem("vega_sim_name", profileName);
        localStorage.setItem("vega_sim_phone", profilePhone);
        localStorage.setItem("vega_sim_email", profileEmail);
        localStorage.setItem("vega_sim_birthday", profileBirthday);
        localStorage.setItem("vega_sim_gender", profileGender);

        if (computedCompletionPercent === 100 && !profileRewardClaimed) {
          const currentPoints = Number(
            localStorage.getItem("vega_sim_points") || 0,
          );
          const newPoints = currentPoints + profileRewardPoints;
          localStorage.setItem("vega_sim_points", String(newPoints));
          localStorage.setItem("vega_sim_profile_reward_claimed", "true");

          const simTxs = JSON.parse(
            localStorage.getItem("vega_sim_transactions") || "[]",
          );
          const newTx = {
            id: "tx-sim-profile-completion",
            amount: profileRewardPoints,
            type: "EARNED",
            reason: "Welcome reward for profile details completion",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem(
            "vega_sim_transactions",
            JSON.stringify([newTx, ...simTxs]),
          );
          setVegaPoints(newPoints);
          setPointsTransactions([newTx, ...simTxs]);
          setProfileRewardClaimed(true);
          alert(
            "Profile details updated successfully! Welcome reward points have been credited to your account.",
          );
        } else {
          alert("Profile details updated successfully!");
        }
      }
    } catch (error) {
      alert("Error updating profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Move wishlist item to cart helper
  const performMoveToCart = (p: any) => {
    addItemToCart({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images[0],
      stock: p.stock,
      sku: p.sku,
    });
    toggleWishlist(p.id); // remove from wishlist
    alert(`${p.name} moved to cart!`);
  };

  const handleMoveToCart = (p: any) => {
    const { status: pinStatus, verifiedPincode } = usePincodeStore.getState();

    if (pinStatus === "serviceable") {
      performMoveToCart(p);
    } else if (pinStatus === "unserviceable") {
      alert(
        `❌ We currently only deliver to Ranchi zones (834xxx/835xxx). Pincode ${verifiedPincode || ""} is out of our delivery area.`,
      );
    } else {
      usePincodeStore.setState({
        isModalOpen: true,
        pendingAddItem: () => performMoveToCart(p),
      });
    }
  };

  // Reorder items helper
  const handleReorder = (item: any) => {
    const performReorder = () => {
      addItemToCart({
        id: "prod-aero-x",
        name: item.name,
        slug: "vega-aero-x-carbon",
        price: 4500000,
        image: item.image,
        stock: 5,
        sku: "VEGA-CYC-AEROX",
      });
      alert("Item added to cart for reorder!");
    };

    const { status: pinStatus, verifiedPincode } = usePincodeStore.getState();

    if (pinStatus === "serviceable") {
      performReorder();
    } else if (pinStatus === "unserviceable") {
      alert(
        `❌ We currently only deliver to Ranchi zones (834xxx/835xxx). Pincode ${verifiedPincode || ""} is out of our delivery area.`,
      );
    } else {
      usePincodeStore.setState({
        isModalOpen: true,
        pendingAddItem: () => performReorder(),
      });
    }
  };

  // Rate & Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewRatingHover, setReviewRatingHover] = useState<number | null>(
    null,
  );
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBodyText, setReviewBodyText] = useState("");
  const [reviewSelectedTags, setReviewSelectedTags] = useState<string[]>([]);
  const [reviewMediaUrls, setReviewMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenReviewModal = (order: any) => {
    if (order.items && order.items.length > 0) {
      // Resolve product details
      const resolvedItems = order.items.map((item: any) => {
        if (item.id && item.slug) return item;
        // Fallback: match by name from catalog mock list
        const match = MOCK_PRODUCTS.find(
          (p) => p.name.toLowerCase() === item.name.toLowerCase(),
        );
        return {
          id: match ? match.id : "prod-aero-x",
          slug: match ? match.slug : "giant-aero-x-carbon",
          name: item.name,
          image: item.image,
          isReviewed: item.isReviewed || false,
        };
      });

      // Filter to only unreviewed products
      const unreviewedItems = resolvedItems.filter((i: any) => !i.isReviewed);

      if (unreviewedItems.length === 0) {
        alert("All products in this order have already been reviewed.");
        return;
      }

      setReviewOrder({ ...order, items: unreviewedItems });
      setSelectedReviewProduct(unreviewedItems[0]);
    }
    setReviewRating(5);
    setReviewTitle("");
    setReviewBodyText("");
    setReviewSelectedTags([]);
    setReviewMediaUrls([]);
    setIsReviewModalOpen(true);
  };

  const handleTogglePrefilledTag = (tag: string) => {
    if (reviewSelectedTags.includes(tag)) {
      setReviewSelectedTags(reviewSelectedTags.filter((t) => t !== tag));
    } else {
      setReviewSelectedTags([...reviewSelectedTags, tag]);
    }
  };

  const getPrefilledTags = (stars: number) => {
    switch (stars) {
      case 5:
        return [
          "Excellent Product",
          "Smooth Riding",
          "Fast Delivery",
          "Super Build Quality",
          "Highly Recommend",
        ];
      case 4:
        return [
          "Good Quality",
          "Comfortable Seat",
          "Satisfactory Gears",
          "Value for Money",
          "Looks great",
        ];
      case 3:
        return [
          "Average Experience",
          "Average Quality",
          "Assembly took time",
          "Packaging could be improved",
        ];
      case 2:
        return [
          "Disappointed",
          "Poor Suspension",
          "Brake issues",
          "Difficult Assembly",
          "Scratches on frame",
        ];
      case 1:
      default:
        return [
          "Terrible Quality",
          "Late Delivery",
          "Damaged product",
          "Defective parts",
          "Worst purchase",
        ];
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/cloudinary", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setReviewMediaUrls((prev) => [...prev, data.url]);
          }
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading file.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveUploadedMedia = (idx: number) => {
    setReviewMediaUrls(reviewMediaUrls.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewProduct) return;

    if (selectedReviewProduct.isReviewed) {
      alert("You have already reviewed this product.");
      return;
    }

    setIsSubmittingReview(true);
    const bodyText = [reviewSelectedTags.join(", "), reviewBodyText]
      .filter(Boolean)
      .join("\n\n");
    const generatedTitle =
      reviewSelectedTags[0] || `${reviewRating} Star Review`;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedReviewProduct.id,
          rating: reviewRating,
          title: generatedTitle,
          bodyText,
          images: reviewMediaUrls,
        }),
      });

      if (res.ok) {
        // Save to simulated reviews log for sandbox persistence
        try {
          const newSimReview = {
            productId: selectedReviewProduct.id,
            rating: reviewRating,
            title: generatedTitle,
            body: bodyText,
            images: reviewMediaUrls,
            verified: true,
            createdAt: new Date().toISOString(),
          };
          const currentSimReviews = JSON.parse(
            localStorage.getItem("vega_sim_reviews") || "[]",
          );
          localStorage.setItem(
            "vega_sim_reviews",
            JSON.stringify([newSimReview, ...currentSimReviews]),
          );
        } catch (e) {}

        alert("Review submitted successfully! It is now live.");
        setIsReviewModalOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(`Failed to submit review: ${data.error || "Server error"}`);
      }
    } catch (err) {
      alert("Error connecting to server. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // State: loading auth status check
  if (status === "loading") {
    return (
      <div className="bg-[var(--obsidian)] min-h-[85vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin" />
      </div>
    );
  }

  // --- RENDER LOGIN VIEW ---
  if (!session) {
    return (
      <div className="bg-[var(--obsidian)] h-[calc(100dvh-8rem)] md:h-auto md:min-h-[85vh] md:py-16 overflow-hidden flex items-center justify-center px-4 relative">
        {/* Subtle decorative background glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--agni)]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full glass-panel-glow border border-[var(--steel)]/60 rounded-3xl p-8 space-y-7 shadow-2xl relative overflow-hidden">
          {/* Subtle accent line on top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--agni)] via-[var(--gold)] to-[var(--agni)]" />

          <div className="text-center">
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-extrabold text-[var(--agni)]">
              RIDER SECURE GATEWAY
            </span>
            <h1 className="text-3xl font-display font-extrabold uppercase text-white mt-2 tracking-wider">
              SIGN IN TO VYORAX
            </h1>
            <p className="text-[11px] text-[var(--smoke)] mt-1.5 font-sans">
              Enter your mobile number to access your account dashboard
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {/* Phone Number Section */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] flex justify-between">
                <span>Mobile Number</span>
                {isOtpSent && <span className="text-[9px] text-[var(--forest)] font-sans lowercase font-semibold">● locked</span>}
              </label>
              
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[var(--smoke)]">
                  {isOtpSent ? (
                    <Lock size={15} className="text-[var(--smoke)]/70" />
                  ) : (
                    <Smartphone size={15} className="text-[var(--smoke)]/70" />
                  )}
                </div>

                <input
                  ref={phoneInputRef}
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit phone number"
                  value={phoneInput}
                  disabled={isOtpSent}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full bg-[var(--carbon)] border ${
                    isOtpSent ? "border-[var(--steel)]/40 text-[var(--smoke)] cursor-not-allowed" : "border-[var(--steel)] text-white focus:border-[var(--agni)] focus:shadow-[0_0_10px_var(--agni-glow)]"
                  } rounded-xl pl-10 pr-16 py-3.5 text-xs font-semibold placeholder-[var(--smoke)]/70 transition-all duration-200 outline-none`}
                />

                {isOtpSent && (
                  <button
                    type="button"
                    onClick={handleEditPhone}
                    className="absolute right-3 px-3 py-1.5 bg-neutral-900 border border-[var(--steel)]/60 text-white rounded-lg text-[9px] uppercase font-bold tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={9} />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* OTP Section (Interconnected Boxes) */}
            {isOtpSent && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3.5"
              >
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                    Verification OTP
                  </label>
                  <button
                    type="button"
                    disabled={otpTimer > 0}
                    onClick={() => handleSendOtp(phoneInput)}
                    className="text-[9px] uppercase font-bold text-[var(--agni)] hover:underline disabled:text-[var(--smoke)] disabled:no-underline font-sans"
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                  </button>
                </div>

                <div 
                  className="grid grid-cols-6 gap-2.5 sm:gap-3.5 justify-center py-1"
                  onPaste={handleOtpPaste}
                >
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-full aspect-[5/6] bg-[var(--carbon)] border border-[var(--steel)] rounded-xl text-center text-xl font-sans font-extrabold text-white placeholder-neutral-700 focus:border-[var(--agni)] focus:shadow-[0_0_10px_var(--agni-glow)] focus:outline-none transition-all duration-150"
                    />
                  ))}
                </div>
                <p className="text-[9px] text-[var(--smoke)] font-sans text-center mt-1">
                  We sent a 6-digit sandbox verification OTP to your phone.
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loginLoading || !isOtpSent || otpInput.length < 6}
              className="w-full py-4 bg-gradient-to-r from-[var(--agni)] to-[var(--agni-light)] hover:from-[var(--agni-light)] hover:to-orange-500 active:scale-[0.98] disabled:bg-neutral-900/40 disabled:border disabled:border-[var(--steel)]/30 disabled:text-neutral-500 disabled:shadow-none disabled:cursor-not-allowed text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 mt-2 shadow-lg"
            >
              {loginLoading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER LOGGED IN DASHBOARD VIEW ---
  const sidebarItems = [
    { key: "overview", label: "Overview", icon: UserIcon },
    { key: "orders", label: "My Orders", icon: ShoppingBag },
    { key: "bookings", label: "My Bookings", icon: Wrench },
    { key: "wishlist", label: "My Wishlist", icon: Heart },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "profile", label: "Profile", icon: Key },
    { key: "loyalty", label: "Vyorax Club", icon: Award },
  ];

  return (
    <div className="bg-[var(--obsidian)] min-h-screen pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        {/* <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase text-white tracking-wider mb-8 border-b border-[var(--steel)]/40 pb-6">
          Customer Arena
        </h1> */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SIDEBAR NAVIGATION (Lg 3cols) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-4 lg:p-6 flex flex-col">
            <div className="pb-4 mb-4 border-b border-[var(--steel)]/30 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[var(--agni)]/10 text-[var(--agni)] border border-[var(--agni)]/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {profileName?.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-sans font-bold text-white truncate">
                    {profileName}
                  </h4>
                  <span className="text-[10px] text-[var(--smoke)] uppercase font-mono">
                    {session.user.role} Rider
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="lg:hidden p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Style injection for horizontal bouncing arrow helper */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              @keyframes bounceHorizontal {
                0%, 100% { transform: translateX(0); }
                50% { transform: translateX(4px); }
              }
            `,
              }}
            />

            {/* Scrollable pill menu for tabs on mobile */}
            <div className="relative w-full lg:hidden mb-2">
              {/* Left Fade Overlay */}
              {showLeftFade && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--charcoal)] to-transparent pointer-events-none z-10 transition-opacity duration-300" />
              )}

              {/* Right Fade Overlay */}
              {showRightFade && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--charcoal)] to-transparent pointer-events-none z-10 transition-opacity duration-300" />
              )}

              {/* Scroll Container */}
              <div
                ref={tabsContainerRef}
                onScroll={handleTabsScroll}
                className="flex gap-2 overflow-x-auto no-scrollbar pb-2.5"
              >
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key as TabKey)}
                      className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-2 rounded-xl text-[11px] font-sans font-bold uppercase tracking-wider transition-all ${
                        activeTab === item.key
                          ? "bg-[var(--agni)] text-neutral-50 shadow-agni-glow"
                          : "bg-[var(--carbon)] text-[var(--silver)] hover:text-white"
                      }`}
                    >
                      <Icon size={13} />
                      <span>
                        {item.label}
                        {item.key === "profile" &&
                          ` (${computedCompletionPercent}%)`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scroll Assistance Label & Progress Bar */}
              <div className="flex justify-between items-center mt-1.5 px-1 text-[10px] text-[var(--smoke)] font-sans uppercase font-bold tracking-wider">
                <div className="flex items-center space-x-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--agni)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--agni)]"></span>
                  </span>
                  <span>Swipe to see options</span>
                  <span className="inline-block animate-[bounceHorizontal_1s_infinite] ml-1">
                    ➔
                  </span>
                </div>

                {/* Scroll Indicator Track */}
                <div className="w-16 h-1 bg-[var(--steel)]/60 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-[var(--agni)] rounded-full transition-transform duration-75"
                    style={{
                      width: "30%",
                      transform: `translateX(${scrollRatio * 233}%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Navigation (Lg only) */}
            <div className="hidden lg:flex flex-col gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as TabKey)}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all ${
                      activeTab === item.key
                        ? "bg-[var(--agni)] text-neutral-50 shadow-agni-glow"
                        : "hover:bg-[var(--carbon)] text-[var(--silver)] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </div>
                    {item.key === "profile" && (
                      <span
                        className={`text-[9px] lowercase font-sans font-bold ml-6 mt-0.5 ${activeTab === item.key ? "text-neutral-200" : "text-[var(--agni-light)]"}`}
                      >
                        {computedCompletionPercent}% completed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={handleSignOut}
              className="hidden lg:flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors pt-4 border-t border-[var(--steel)]/30 mt-4"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </aside>

          {/* MAIN TAB CONTENT CONTAINER (Lg 9cols) */}
          <div className="lg:col-span-9 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-4 sm:p-8 min-h-[480px]">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Greeting banner */}
                <div>
                  <h2 className="text-xl font-sans font-bold text-white flex items-center">
                    Hey {profileName} 👋
                  </h2>
                  <p className="text-xs text-[var(--silver)] font-sans mt-1">
                    Welcome back to the garage. View your performance credits
                    and order timelines below.
                  </p>
                </div>

                {/* KPI stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 text-center">
                    <ShoppingBag
                      size={18}
                      className="mx-auto text-[var(--agni)]"
                    />
                    <p className="text-2xl font-display font-bold text-white mt-2">
                      {orders.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--smoke)] mt-1 font-sans">
                      Total Orders
                    </p>
                  </div>
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 text-center">
                    <Award size={18} className="mx-auto text-[var(--agni)]" />
                    <p className="text-2xl font-display font-bold text-white mt-2">
                      {vegaPoints}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--smoke)] mt-1 font-sans">
                      Club Points
                    </p>
                  </div>
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 text-center">
                    <Heart size={18} className="mx-auto text-red-500" />
                    <p className="text-2xl font-display font-bold text-white mt-2">
                      {wishlistIds.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--smoke)] mt-1 font-sans">
                      Wishlist items
                    </p>
                  </div>
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 text-center">
                    <span className="text-lg font-bold text-[var(--forest)]">
                      ₹
                    </span>
                    <p className="text-xl font-display font-bold text-white mt-2">
                      {(dynamicTotalSpend / 100).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--smoke)] mt-1 font-sans">
                      Total Spent
                    </p>
                  </div>
                </div>

                {/* Recent Order Status Tracking banner card */}
                {orders.length > 0 && orders[0] && (
                  <div className="bg-[var(--obsidian)] border border-[var(--steel)]/50 rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-sans">
                      <span className="font-bold text-white">
                        Recent Order: {orders[0].id}
                      </span>
                      <span className="text-[var(--gold-light)] font-bold uppercase tracking-wider">
                        {orders[0].status}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 bg-[var(--carbon)] rounded-lg relative overflow-hidden flex-shrink-0 border border-[var(--steel)]/30">
                          {orders[0].items?.[0]?.image && (
                            <Image
                              src={orders[0].items[0].image}
                              alt="product"
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-sans font-bold text-white truncate max-w-[150px] sm:max-w-none">
                            {orders[0].items?.[0]?.name}
                          </h4>
                          <span className="text-[10px] text-[var(--smoke)] uppercase font-mono mt-0.5 block">
                            Date: {orders[0].date}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/order/${orders[0].id}`}
                        className="w-full sm:w-auto text-center px-4 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg transition-colors shadow-agni-glow"
                      >
                        Track Status
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  My Orders History
                </h3>

                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs border-b border-[var(--steel)]/30 pb-3 text-[var(--silver)] font-sans">
                        <div>
                          <span>ID: </span>
                          <strong className="text-white font-mono text-sm">
                            {order.id}
                          </strong>
                        </div>
                        <div className="mt-1 sm:mt-0 flex space-x-4">
                          <span>
                            Date:{" "}
                            <strong className="text-white">{order.date}</strong>
                          </span>
                          <span>
                            Total:{" "}
                            <strong className="text-white">
                              ₹{(order.total / 100).toLocaleString("en-IN")}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Item details */}
                      <div className="space-y-3">
                        {order.items.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center space-x-3 text-xs font-sans"
                          >
                            <div className="w-10 h-10 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <span className="text-white font-semibold flex-1 flex items-center flex-wrap gap-2">
                              {item.name}
                              {item.isReviewed && (
                                <span className="px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider bg-[var(--gold)]/10 text-[var(--gold-light)] border border-[var(--gold)]/20 rounded-md select-none inline-flex items-center gap-0.5">
                                  ★ Reviewed
                                </span>
                              )}
                            </span>
                            <span className="text-[var(--smoke)]">
                              Qty: {item.qty}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span
                          className={`px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-widest rounded border ${
                            order.status === "DELIVERED"
                              ? "bg-[var(--forest)]/10 text-emerald-400 border-emerald-500/20"
                              : "bg-[var(--gold)]/10 text-[var(--gold-light)] border-[var(--gold)]/20 animate-pulse"
                          }`}
                        >
                          {order.status}
                        </span>

                        <div className="flex space-x-2.5">
                          {order.status === "DELIVERED" ? (
                            <div className="flex space-x-2">
                              {order.items.some((i: any) => !i.isReviewed) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(order)}
                                  className="px-4 py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-white text-[10px] font-sans font-bold uppercase rounded tracking-wide transition-all"
                                >
                                  Rate & Review
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReorder(order.items[0])}
                                className="px-4 py-2 bg-[var(--charcoal)] border border-[var(--steel)] hover:border-white text-white text-[10px] font-sans font-bold uppercase rounded tracking-wide transition-all"
                              >
                                Reorder items
                              </button>
                              <Link
                                href={`/order/${order.id}`}
                                className="px-4 py-2 bg-[var(--charcoal)] border border-[var(--steel)] hover:border-white text-white text-[10px] font-sans font-bold uppercase rounded tracking-wide transition-all inline-flex items-center"
                              >
                                Order Details
                              </Link>
                            </div>
                          ) : (
                            <Link
                              href={`/order/${order.id}`}
                              className="px-4 py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-[10px] font-sans font-bold uppercase rounded tracking-wide"
                            >
                              Track Shipment
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  My Wishlist Saved Items
                </h3>

                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--smoke)] border border-dashed border-[var(--steel)]/60 rounded-xl">
                    No items saved in your wishlist. Heart products to save them
                    here!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div className="flex space-x-3.5 mb-4">
                          <div className="w-16 h-16 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0">
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-sans font-bold text-white truncate">
                              {p.name}
                            </h4>
                            <span className="text-[10px] text-[var(--smoke)] uppercase font-mono">
                              SKU: {p.sku}
                            </span>
                            <div className="text-xs font-display text-[var(--agni-light)] mt-1">
                              ₹{(p.price / 100).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2.5">
                          <button
                            onClick={() => handleMoveToCart(p)}
                            className="flex-grow py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-[10px] font-sans font-bold uppercase rounded tracking-wide transition-colors"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => toggleWishlist(p.id)}
                            className="px-3 py-2 border border-[var(--steel)] hover:border-red-500 text-[var(--silver)] hover:text-white rounded text-[10px] transition-colors"
                            title="Remove"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  Delivery Addresses
                </h3>

                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-start space-x-3 text-xs font-sans">
                        <MapPin
                          size={16}
                          className="text-[var(--agni)] mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">
                              {addr.name}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[8px] bg-[var(--gold)]/10 text-[var(--gold-light)] border border-[var(--gold)]/20 px-1.5 py-0.5 rounded uppercase font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--silver)] mt-1 leading-relaxed">
                            {addr.street},<br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-[var(--smoke)] mt-1.5 font-mono">
                            Mobile: {addr.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() =>
                            alert("Address edit dialog simulation")
                          }
                          className="flex-1 sm:flex-none px-3.5 py-2 border border-[var(--steel)] hover:border-white text-white text-[10px] font-sans font-bold uppercase rounded tracking-wide transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => alert("Address deleted")}
                          className="px-3.5 py-2 border border-[var(--steel)] hover:border-red-500 text-[var(--smoke)] hover:text-white rounded text-[10px] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROFILE DETAILS TAB */}
            {/* PROFILE DETAILS TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  Profile Details
                </h3>

                <div className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                  {/* Profile Completion Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-white">Rider Profile Strength</span>
                      <span
                        className={`font-mono ${computedCompletionPercent === 100 ? "text-emerald-400 font-black" : "text-[var(--agni-light)] font-black"}`}
                      >
                        {computedCompletionPercent}% Complete
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 border border-[var(--steel)]/30 rounded-full overflow-hidden relative">
                      <div
                        className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${computedCompletionPercent === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[var(--agni)] shadow-[0_0_8px_rgba(255,77,26,0.5)]"}`}
                        style={{ width: `${computedCompletionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward Promotion Banner */}
                  {computedCompletionPercent < 100 && !profileRewardClaimed && (
                    <div className="p-4 bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl flex flex-col gap-1">
                      <p className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                        Complete your profile to earn {profileRewardPoints}{" "}
                        Vyorax Club Points
                      </p>
                      <p className="text-[10px] text-[var(--smoke)] font-sans">
                        Fill in all details (Name, Email, Alternate Phone,
                        Birthday, Gender) to claim your welcome reward.
                      </p>
                    </div>
                  )}

                  {computedCompletionPercent === 100 &&
                    profileRewardClaimed && (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-2">
                        <span className="text-emerald-400 text-xs font-bold">
                          ✓
                        </span>
                        <p className="text-[10px] text-emerald-400 font-sans uppercase font-bold tracking-wider">
                          Profile reward claimed! Welcome to the elite tier,
                          Rider.
                        </p>
                      </div>
                    )}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Profile Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Primary Mobile Number
                        </label>
                        <input
                          type="tel"
                          disabled
                          value={session.user.phone || profilePhone}
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-[var(--smoke)] cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="Add email for billing notifications"
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Alternate Phone
                        </label>
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Birthday (for Birthday Bonus)
                        </label>
                        <input
                          type="date"
                          value={profileBirthday}
                          onChange={(e) => setProfileBirthday(e.target.value)}
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Gender
                        </label>
                        <select
                          value={profileGender}
                          onChange={(e) => setProfileGender(e.target.value)}
                          className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] cursor-pointer"
                        >
                          <option value="" disabled>
                            Select Gender
                          </option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 text-right">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-6 py-3.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-agni-glow"
                      >
                        {profileSaving ? "Saving..." : "Save Modifications"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* LOYALTY POINTS TAB */}
            {activeTab === "loyalty" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  Vyorax Club Points Overview
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <div className="bg-[var(--obsidian)] border border-[var(--agni)]/40 shadow-agni-glow rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--agni-light)] font-bold">
                        Vyorax Club Balance
                      </span>
                      <p className="text-4xl font-display font-extrabold text-white mt-2 glow-text-agni">
                        {vegaPoints} PTS
                      </p>
                      <p className="text-[10px] text-[var(--smoke)] mt-1 font-sans">
                        Equals: ₹{vegaPoints.toLocaleString("en-IN")} discount
                        credit on checkout
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          alert("Points can be redeemed at checkout!")
                        }
                        className="w-full px-4 py-2.5 bg-[var(--agni)] text-white font-sans font-bold text-xs uppercase rounded-lg tracking-wide hover:bg-[var(--agni-light)] transition-colors text-center"
                      >
                        How to Redeem
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Expirations Card */}
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-sans tracking-widest text-white font-bold block border-b border-[var(--steel)]/30 pb-2.5 mb-3">
                        Points Expiration Schedule
                      </span>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                        {expirations.length === 0 ? (
                          <p className="text-[11px] text-[var(--smoke)] italic font-sans py-4 text-center">
                            No upcoming expirations. All active points are safe!
                          </p>
                        ) : (
                          expirations.map((exp: any, i: number) => (
                            <div
                              key={exp.id || i}
                              className="flex items-center justify-between p-2.5 bg-[var(--obsidian)] border border-[var(--steel)]/30 rounded-lg text-xs"
                            >
                              <span className="text-[var(--agni-light)] font-sans font-bold flex items-center gap-1.5">
                                ⚠️{" "}
                                {exp.remainingAmount !== undefined
                                  ? exp.remainingAmount
                                  : exp.amount}{" "}
                                PTS
                              </span>
                              <span className="text-[var(--smoke)] font-mono text-[10px]">
                                expiring{" "}
                                {new Date(exp.expiresAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-sans tracking-wider font-bold text-white">
                    Vyorax Club Transactions
                  </h4>
                  <div className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl overflow-hidden text-xs">
                    {pointsTransactions.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[var(--smoke)] italic">
                        No points transactions recorded yet.
                      </p>
                    ) : (
                      pointsTransactions.map((tx: any, i: number) => {
                        const isPositive = tx.amount > 0;
                        return (
                          <div
                            key={tx.id || i}
                            className="p-4 flex justify-between border-b border-[var(--steel)]/40 last:border-0 hover:bg-[var(--charcoal)]/50 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-white">
                                {tx.reason || "Vyorax Club Points Transaction"}
                              </p>
                              <span className="text-[10px] text-[var(--smoke)] font-mono">
                                {
                                  new Date(tx.createdAt)
                                    .toISOString()
                                    .split("T")[0]
                                }
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                            >
                              {isPositive ? `+${tx.amount}` : tx.amount} PTS
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                  My Service & Repair Bookings
                </h3>

                {bookingsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin" />
                    <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider animate-pulse">
                      Loading bookings...
                    </p>
                  </div>
                ) : serviceBookings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--smoke)] font-sans">
                    No active service or repair bookings found. Visit our{" "}
                    <Link
                      href="/servicing"
                      className="text-[var(--agni)] hover:underline"
                    >
                      Servicing
                    </Link>{" "}
                    or{" "}
                    <Link
                      href="/repairing"
                      className="text-[var(--agni)] hover:underline"
                    >
                      Repairing
                    </Link>{" "}
                    page to book!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceBookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-sans"
                      >
                        <div className="space-y-2 flex-grow min-w-0">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono font-bold text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-white/5">
                              {b.id}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-sans font-bold tracking-widest px-2 py-0.5 rounded border ${
                                b.type === "SERVICING"
                                  ? "text-[var(--agni-light)] border-[var(--agni-light)]/20 bg-[var(--agni-glow)]"
                                  : "text-[var(--gold-light)] border-[var(--gold-light)]/20 bg-[var(--gold)]/5"
                              }`}
                            >
                              {b.type}
                            </span>
                            <span className="text-xs font-sans font-bold text-white uppercase tracking-wide">
                              {b.planName}
                            </span>
                          </div>

                          <div className="text-[var(--silver)] leading-relaxed space-y-0.5 max-w-lg">
                            <div>
                              <strong className="text-[var(--smoke)] uppercase font-bold text-[9px] tracking-wider">
                                Address:
                              </strong>{" "}
                              {b.address?.name}, {b.address?.street},{" "}
                              {b.address?.city}, {b.address?.pincode}
                            </div>
                            <div>
                              <strong className="text-[var(--smoke)] uppercase font-bold text-[9px] tracking-wider">
                                Pickup Contact:
                              </strong>{" "}
                              {b.phone}
                            </div>
                            <div className="text-[10px] text-[var(--smoke)]">
                              Booked on:{" "}
                              {new Date(b.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-end justify-between md:justify-center w-full md:w-auto md:text-right border-t border-[var(--steel)]/10 md:border-t-0 pt-3 md:pt-0">
                          <div className="text-sm font-sans font-black text-[var(--agni)]">
                            ₹{(b.price / 100).toLocaleString("en-IN")}
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {b.status || "BOOKED"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RATE & REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && reviewOrder && selectedReviewProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
            />
            {/* Centered Flex Container to prevent Framer Motion inline transform overrides */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="pointer-events-auto w-full max-w-lg bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-[var(--steel)]/50 flex items-center justify-between bg-[var(--obsidian)]">
                  <div className="flex items-center space-x-2 text-white">
                    <Star
                      className="text-[var(--gold)] fill-[var(--gold)]"
                      size={16}
                    />
                    <span className="text-sm font-sans font-bold uppercase tracking-wider">
                      Rate & Review Product
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="p-1 rounded-full text-[var(--silver)] hover:text-white hover:bg-[var(--carbon)] transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable Form */}
                <form
                  onSubmit={handleSubmitReview}
                  className="p-6 overflow-y-auto space-y-5 flex-1 no-scrollbar"
                >
                  {/* Product Selector if multiple products in order */}
                  {reviewOrder.items && reviewOrder.items.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                        Choose product to rate:
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                        {reviewOrder.items.map((item: any) => {
                          const isSelected =
                            selectedReviewProduct.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedReviewProduct(item);
                                setReviewSelectedTags([]);
                              }}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-left flex-shrink-0 transition-all text-xs font-sans font-bold ${
                                isSelected
                                  ? "bg-[var(--agni)]/10 border-[var(--agni)] text-white shadow-agni-glow"
                                  : "bg-[var(--carbon)] border-[var(--steel)]/60 text-[var(--silver)] hover:text-white"
                              }`}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-6 h-6 object-cover rounded animate-fadeIn"
                              />
                              <span className="truncate max-w-[120px]">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Product Card */}
                  <div className="flex items-center space-x-4 bg-[var(--obsidian)] border border-[var(--steel)]/40 p-4 rounded-xl">
                    <img
                      src={selectedReviewProduct.image}
                      alt={selectedReviewProduct.name}
                      className="w-12 h-12 object-cover rounded-lg border border-[var(--steel)]/30"
                    />
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--gold-light)] block">
                        Now Reviewing
                      </span>
                      <h4 className="text-xs font-sans font-bold text-white truncate mt-0.5">
                        {selectedReviewProduct.name}
                      </h4>
                    </div>
                  </div>

                  {/* Stars Rating Selector */}
                  <div className="space-y-2 text-center py-2 bg-[var(--carbon)]/30 border border-[var(--steel)]/20 rounded-xl">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                      Your Rating
                    </label>
                    <div className="flex justify-center space-x-2">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const isFilled =
                          reviewRatingHover !== null
                            ? starNum <= reviewRatingHover
                            : starNum <= reviewRating;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setReviewRating(starNum)}
                            onMouseEnter={() => setReviewRatingHover(starNum)}
                            onMouseLeave={() => setReviewRatingHover(null)}
                            className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                          >
                            <Star
                              className={
                                isFilled
                                  ? "text-[var(--gold)] fill-[var(--gold)]"
                                  : "text-[var(--steel)]/80"
                              }
                              size={28}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--gold-light)] block mt-1">
                      {reviewRating === 5
                        ? "Excellent!"
                        : reviewRating === 4
                          ? "Very Good"
                          : reviewRating === 3
                            ? "Average"
                            : reviewRating === 2
                              ? "Below Average"
                              : "Terrible"}
                    </span>
                  </div>

                  {/* Prefilled Star-specific Tag Options */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                      Popular highlights (click to select):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getPrefilledTags(reviewRating).map((tag) => {
                        const isSelected = reviewSelectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTogglePrefilledTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase border transition-all ${
                              isSelected
                                ? "bg-[var(--agni)] text-white border-[var(--agni)] shadow-agni-glow"
                                : "bg-[var(--carbon)] hover:bg-[var(--steel)]/30 text-[var(--silver)] border-[var(--steel)]/40"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Message Textarea (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                        Review Description
                      </label>
                      <span className="text-[9px] uppercase font-bold text-[var(--smoke)] font-sans">
                        Optional
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Tell us more details about the cycle, gears, suspension, or delivery experience..."
                      value={reviewBodyText}
                      onChange={(e) => setReviewBodyText(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)] leading-relaxed"
                    />
                  </div>

                  {/* Media Upload Area (Cloudinary) */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                      Add Photos or Videos
                    </label>

                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer flex items-center space-x-2 px-4 py-2.5 bg-[var(--carbon)] border border-[var(--steel)]/60 hover:border-white rounded-xl text-xs font-sans font-bold uppercase text-white hover:bg-neutral-800 transition-all select-none">
                        <span>📸 Select Files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="hidden"
                          disabled={isUploadingMedia || isSubmittingReview}
                        />
                      </label>

                      {isUploadingMedia && (
                        <div className="flex items-center space-x-2 text-xs text-[var(--gold)] animate-pulse font-sans">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
                          <span>Uploading to Cloudinary...</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Previews */}
                    {reviewMediaUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-2">
                        {reviewMediaUrls.map((url, idx) => {
                          const isVideo =
                            url
                              .toLowerCase()
                              .match(
                                /\.(mp4|webm|ogg|mov|avi|flv|mkv|3gp|wmv|m4v)(?:\?|$)/,
                              ) ||
                            url.includes("/video/upload/") ||
                            url.includes("/video/");
                          return (
                            <div
                              key={idx}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--steel)]/50 bg-[var(--obsidian)]"
                            >
                              {isVideo ? (
                                <div
                                  className="w-full h-full relative cursor-zoom-in"
                                  onClick={() => window.open(url, "_blank")}
                                >
                                  <video
                                    src={url}
                                    muted
                                    autoPlay
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white">
                                      <span className="text-[8px] pl-0.5">
                                        ▶
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={url}
                                  alt="Uploaded review thumbnail"
                                  className="w-full h-full object-cover animate-fadeIn"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedMedia(idx)}
                                className="absolute top-0 right-0 p-1 bg-red-600 hover:bg-red-700 text-white rounded-bl text-[8px] font-bold"
                                title="Delete media"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="flex space-x-3 pt-3 border-t border-[var(--steel)]/20">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="flex-1 py-3 border border-[var(--steel)] text-white hover:border-white text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview || isUploadingMedia}
                      className="flex-grow py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:opacity-50 text-white text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all shadow-agni-glow flex items-center justify-center space-x-1.5"
                    >
                      {isSubmittingReview ? (
                        <>
                          <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin inline-block" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Review</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
