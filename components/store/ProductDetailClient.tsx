"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, useWishlistStore, useCompareStore, usePincodeStore, useSettingsStore } from "@/lib/store";
import { 
  Heart, ShoppingCart, Star, HelpCircle, Truck, 
  MessageSquare, ShieldAlert, CheckCircle, ArrowRightLeft, Sparkles, Check, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StarRating from "@/components/shared/StarRating";
import { resolvePincodeToCity, calculateDeliveryDate } from "@/lib/delivery";

interface ProductDetailClientProps {
  product: any;
  allProducts: any[];
}

export default function ProductDetailClient({ product, allProducts }: ProductDetailClientProps) {
  const router = useRouter();
  // Store actions
  const addItemToCart = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const { toggleItem, hasItem } = useWishlistStore();
  const { products: compareList, addProduct: addToCompare, removeProduct: removeFromCompare, hasProduct: isComparing } = useCompareStore();

  const isWishlisted = hasItem(product.id);

  // Gallery State
  const [activeImage, setActiveImage] = useState(product.images[0]);

  // Sizing Quiz State
  const [isSizeFinderOpen, setIsSizeFinderOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizHeight, setQuizHeight] = useState(165); // cm (approx 5'5")
  const [quizUse, setQuizUse] = useState("");
  const [quizExp, setQuizExp] = useState("");
  const [recommendedSize, setRecommendedSize] = useState("");

  // EMI Calculator State
  const [activeEmiBank, setActiveEmiBank] = useState("hdfc");
  const { emiConfig } = useSettingsStore();
  const showEmiSection = emiConfig?.enabled !== false && product.price >= (emiConfig?.minAmount ?? 300000);

  useEffect(() => {
    if (emiConfig?.banks?.length > 0) {
      const firstEnabled = emiConfig.banks.find((b: any) => b.enabled);
      if (firstEnabled) {
        setActiveEmiBank(firstEnabled.id);
      }
    }
  }, [emiConfig]);

  // Pincode State
  const [pincodeInput, setPincodeInput] = useState("");
  const { verifiedPincode, status: cityStatus, deliveryMessage } = usePincodeStore();

  // Scroll Sticky Trigger State
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartRef = useRef<HTMLButtonElement>(null);

  // Persona State
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [focusedSpec, setFocusedSpec] = useState<string | null>(null);

  // Starter Kit Checked Items
  const [checkedKitItems, setCheckedKitItems] = useState<string[]>([]);
  const [bundleTotal, setBundleTotal] = useState(0);

  // Comparison State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareSearchQuery, setCompareSearchQuery] = useState("");
  const [comparisonSummary, setComparisonSummary] = useState("");
  const [isComparingLoading, setIsComparingLoading] = useState(false);

  // Reviews Sate
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // AI recommendations (Smart recommendations state)
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [aiRecsLoading, setAiRecsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [flyingItems, setFlyingItems] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number }[]>([]);

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !product?.id) return;

    try {
      const stored = localStorage.getItem("vega_recently_viewed");
      let list: string[] = stored ? JSON.parse(stored) : [];

      // Filter out current product id to ensure no duplicates
      list = list.filter((id) => id !== product.id);

      // Add current product id to the beginning of the list
      list.unshift(product.id);

      // Keep only last 10 entries
      if (list.length > 10) {
        list = list.slice(0, 10);
      }

      localStorage.setItem("vega_recently_viewed", JSON.stringify(list));

      // Resolve product details for recently viewed items (excluding current product)
      const resolvedList = list
        .filter((id) => id !== product.id)
        .map((id) => allProducts.find((p) => p.id === id))
        .filter(Boolean);

      setRecentlyViewed(resolvedList);
    } catch (e) {
      console.error("Failed to update recently viewed products:", e);
    }
  }, [product.id, allProducts]);

  const parsedSpecs = typeof product.specs === "string" ? JSON.parse(product.specs) : product.specs;
  const parsedSize = typeof product.cycleSize === "string" ? JSON.parse(product.cycleSize) : product.cycleSize;
  const parsedPersonas = typeof product.whoIsThisFor === "string" ? JSON.parse(product.whoIsThisFor) : product.whoIsThisFor;
  const parsedStarterKit = typeof product.starterKit === "string" ? JSON.parse(product.starterKit) : product.starterKit;

  // Initialize bundle check state
  useEffect(() => {
    if (parsedStarterKit && parsedStarterKit.length > 0) {
      const ids = parsedStarterKit.map((item: any) => item.id);
      setCheckedKitItems(ids);
    }
  }, [product.id]);

  // Update bundle total price
  useEffect(() => {
    if (parsedStarterKit) {
      const sum = parsedStarterKit
        .filter((item: any) => checkedKitItems.includes(item.id))
        .reduce((acc: number, item: any) => acc + item.price, 0);
      setBundleTotal(sum + product.price);
    }
  }, [checkedKitItems, product.id]);

  // Load last verified pincode or address default
  useEffect(() => {
    if (verifiedPincode) {
      setPincodeInput(verifiedPincode);
      checkPincodeDirect(verifiedPincode);
    }
  }, [product.id, verifiedPincode]);

  // Scroll Stickiness logic via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the original Add to Cart button scrolls OUT of view
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (addToCartRef.current) {
      observer.observe(addToCartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch AI recommendations
  useEffect(() => {
    async function fetchAiRecs() {
      setAiRecsLoading(true);
      try {
        const response = await fetch("/api/ai/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            browsingHistory: [product.id],
            cartItems: [],
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setAiRecs(data.accessories || []);
        } else {
          // Fallback to related products from DB
          setAiRecs(product.relatedProductsList || []);
        }
      } catch (error) {
        console.warn("AI Recs offline. Loading related items fallback.");
        setAiRecs(product.relatedProductsList || []);
      } finally {
        setAiRecsLoading(false);
      }
    }
    fetchAiRecs();
  }, [product.id]);

  // Size Finder Quiz Math
  const handleSizeQuizSubmit = () => {
    // 4'8" to 6'4" mapping
    const inches = quizHeight / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    
    let size = "M (17.5\" Frame)";
    if (quizHeight < 160) {
      size = "S (15.5\" Frame)";
    } else if (quizHeight > 178) {
      size = "L (19.5\" Frame)";
    }
    
    setRecommendedSize(size);
    setQuizStep(4);
  };

  // City direct checker
  const isCycle = useMemo(() => {
    if (!product) return false;
    if (product.cycleSize !== null && product.cycleSize !== undefined) return true;
    const catId = product.categoryId || "";
    if (catId.startsWith("cat-men") || catId.startsWith("cat-mtb") || catId.startsWith("cat-women") || catId.startsWith("cat-kids") || catId.startsWith("cat-electric") || catId.startsWith("cat-cycles")) {
      return true;
    }
    const slug = product.category?.slug || "";
    if (slug === "cycles" || slug === "electric-cycles" || slug === "mtb" || slug === "men" || slug === "women" || slug === "kids") {
      return true;
    }
    return false;
  }, [product]);

  // Pincode direct checker
  const checkPincodeDirect = async (pincode: string) => {
    if (!pincode || pincode.trim().length !== 6 || isNaN(Number(pincode))) {
      usePincodeStore.setState({ status: "unserviceable", deliveryMessage: "Please enter a valid 6-digit pincode." });
      return;
    }

    usePincodeStore.setState({ status: "checking", deliveryMessage: "" });

    const cleanPin = pincode.trim();
    const resolvedCity = resolvePincodeToCity(cleanPin);

    if (resolvedCity) {
      try {
        const response = await fetch(`/api/delivery/check?pincode=${cleanPin}`);
        const data = await response.json();
        
        if (data.serviceable) {
          const applicableFee = isCycle ? (data.deliveryFeeCycle ?? 50000) : (data.deliveryFeeStandard ?? 25000);
          const freeThreshold = data.freeShippingMin ?? 500000;
          
          const feeText = product.price >= freeThreshold 
            ? "FREE Delivery" 
            : `Delivery fee: ₹${(applicableFee / 100).toLocaleString("en-IN")}`;
            
          const msg = `✓ Deliverable to ${data.city || resolvedCity} ${cleanPin}. Delivers by ${data.deliveryDate} — ${feeText}`;
          localStorage.setItem("vega_verified_pincode", cleanPin);
          usePincodeStore.setState({ verifiedPincode: cleanPin, status: "serviceable", deliveryMessage: msg });
        } else {
          usePincodeStore.setState({ status: "unserviceable", deliveryMessage: data.message || `❌ Pincode ${cleanPin} is outside our delivery zone.` });
        }
      } catch (e) {
        // Offline fallback
        let deliveryDays = 2;
        
        const simSettingsStr = localStorage.getItem("vega_sim_settings");
        if (simSettingsStr) {
          try {
            const simSettings = JSON.parse(simSettingsStr);
            const cities = simSettings.homepageConfig?.deliveryCities;
            if (Array.isArray(cities)) {
              const matched = cities.find((c: any) => {
                const name = typeof c === "string" ? c : c.name || "";
                return name.trim().toLowerCase() === resolvedCity.toLowerCase();
              });
              if (matched) {
                deliveryDays = typeof matched === "string" ? 2 : matched.days ?? 2;
              }
            }
          } catch(err) {}
        }

        const formattedDate = calculateDeliveryDate(deliveryDays);
        const feeText = product.price >= 500000 ? "FREE Delivery" : `Delivery fee: ₹250`;
        const msg = `✓ Deliverable to ${resolvedCity} ${cleanPin}. Delivers by ${formattedDate} — ${feeText}`;
        localStorage.setItem("vega_verified_pincode", cleanPin);
        usePincodeStore.setState({ verifiedPincode: cleanPin, status: "serviceable", deliveryMessage: msg });
      }
    } else {
      usePincodeStore.setState({ 
        status: "unserviceable", 
        deliveryMessage: `❌ Out of delivery zone. Pincode ${cleanPin} is not serviceable.` 
      });
    }
  };

  // WhatsApp template compilation
  const getWhatsAppLink = () => {
    const text = `Hi, I want to order ${product.name} (₹${(product.price / 100).toLocaleString("en-IN")}) from VEGA Sports. Please confirm availability.`;
    return `https://wa.me/919999999999?text=${encodeURIComponent(text)}`;
  };

  // Fly-to-Cart Animation Trigger
  const triggerFlyToCartAnimation = (e?: React.MouseEvent) => {
    const dest = document.getElementById("header-cart-icon");
    if (!dest) {
      // Fallback: Open cart drawer directly if header icon is missing
      setIsOpen(true);
      return;
    }

    const destRect = dest.getBoundingClientRect();
    const endX = destRect.left + destRect.width / 2;
    const endY = destRect.top + destRect.height / 2;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (e && e.clientX && e.clientY) {
      startX = e.clientX;
      startY = e.clientY;
    } else if (e && e.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    const newFlyItem = {
      id: Date.now() + Math.random(),
      startX,
      startY,
      endX,
      endY,
    };

    setFlyingItems((prev) => [...prev, newFlyItem]);
  };

  // Add to cart helper
  const handleAddToCart = (e?: React.MouseEvent) => {
    if (cityStatus !== "serviceable") {
      usePincodeStore.setState({
        status: "unserviceable",
        deliveryMessage: !pincodeInput
          ? "⚠️ Please enter and check delivery pincode first."
          : "⚠️ Please verify a serviceable delivery pincode first."
      });
      document.getElementById("pincode-checker-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsAdding(true);
    addItemToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0],
      stock: product.stock,
      sku: product.sku,
      isCycle, // Pass isCycle flag
    }, 1, true);

    triggerFlyToCartAnimation(e);

    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  // Buy Now helper
  const handleBuyNow = () => {
    if (cityStatus !== "serviceable") {
      usePincodeStore.setState({
        status: "unserviceable",
        deliveryMessage: !pincodeInput
          ? "⚠️ Please enter and check delivery pincode first."
          : "⚠️ Please verify a serviceable delivery pincode first."
      });
      document.getElementById("pincode-checker-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsBuying(true);
    addItemToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0],
      stock: product.stock,
      sku: product.sku,
      isCycle, // Pass isCycle flag
    });
    router.push("/checkout");
  };

  // Add bundle to cart helper
  const handleAddBundleToCart = () => {
    if (cityStatus !== "serviceable") {
      usePincodeStore.setState({
        status: "unserviceable",
        deliveryMessage: !pincodeInput
          ? "⚠️ Please enter and check delivery pincode first."
          : "⚠️ Please verify a serviceable delivery pincode first."
      });
      document.getElementById("pincode-checker-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Add primary product
    handleAddToCart();
    // Add checked kit items
    if (parsedStarterKit) {
      const checkedAccessories = parsedStarterKit.filter((item: any) => checkedKitItems.includes(item.id));
      checkedAccessories.forEach((item: any) => {
        addItemToCart({
          id: item.id,
          name: item.name,
          slug: product.slug, // Keep product slug for context
          price: item.price,
          image: item.image,
          stock: 5,
          sku: item.sku || "VEGA-ACC",
          isCycle: false, // Accessories are not cycles
        });
      });
    }
    alert("Bundle added to cart successfully!");
  };

  // Toggle accessory checkbox in bundle list
  const toggleKitItem = (id: string) => {
    if (checkedKitItems.includes(id)) {
      setCheckedKitItems(checkedKitItems.filter((item) => item !== id));
    } else {
      setCheckedKitItems([...checkedKitItems, id]);
    }
  };

  // Trigger specs focus from persona card
  const handlePersonaClick = (idx: number, title: string) => {
    setActivePersona(idx);
    
    // Smooth scroll down to specs block
    const specsEl = document.getElementById("product-specs-section");
    if (specsEl) {
      specsEl.scrollIntoView({ behavior: "smooth" });
    }

    // Set highlighted specs based on persona
    if (title.includes("Commuter")) {
      setFocusedSpec("Frame");
    } else if (title.includes("Enduro") || title.includes("Trail")) {
      setFocusedSpec("Suspension");
    } else {
      setFocusedSpec("Gears");
    }
  };

  // EMI details calculation for bank
  const getEmiDetailsForBank = (bankId: string) => {
    if (!emiConfig) return [];
    const bank = emiConfig.banks?.find((b: any) => b.id === bankId);
    if (!bank || !bank.enabled) return [];

    const catOverride = emiConfig.categoryOverrides?.find((c: any) => c.categoryId === product.categoryId);
    const tenures = [3, 6, 9, 12, 18, 24];

    return tenures.map((months) => {
      let isNoCost = false;
      let interestRate = bank.interestRate || emiConfig.standardInterestRate || 14;

      if (catOverride) {
        if (catOverride.noCostEnabled && (catOverride.noCostMonths || []).includes(months)) {
          isNoCost = true;
          interestRate = 0;
        } else {
          interestRate = catOverride.interestRate ?? interestRate;
        }
      } else {
        if (bank.noCostEnabled && (emiConfig.noCostMonths || []).includes(months)) {
          isNoCost = true;
          interestRate = 0;
        }
      }

      const monthlyRate = interestRate / 12 / 100;
      let emi = 0;
      if (monthlyRate === 0) {
        emi = Math.round(product.price / months);
      } else {
        emi = Math.round(
          (product.price * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1)
        );
      }

      const totalCost = emi * months;
      const totalInterest = totalCost - product.price;

      return {
        months,
        interestRate,
        emi,
        totalInterest,
        totalCost,
        isNoCost,
      };
    });
  };

  // Run AI product comparison
  const triggerComparison = async (compProduct: any) => {
    addToCompare({
      id: compProduct.id,
      name: compProduct.name,
      slug: compProduct.slug,
      price: compProduct.price,
      image: compProduct.images[0],
      specs: compProduct.specs,
      brand: compProduct.brand || "Vyorax",
      assemblyDifficulty: compProduct.assemblyDifficulty || 1,
    });

    setIsComparingLoading(true);
    setComparisonSummary("");

    const updatedCompareList = [...compareList];
    if (!updatedCompareList.find((p) => p.id === compProduct.id)) {
      updatedCompareList.push({
        id: compProduct.id,
        name: compProduct.name,
        slug: compProduct.slug,
        price: compProduct.price,
        image: compProduct.images[0],
        specs: compProduct.specs,
        brand: compProduct.brand || "Vyorax",
        assemblyDifficulty: compProduct.assemblyDifficulty || 1,
      });
    }

    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: [
            {
              id: product.id,
              name: product.name,
              specs: parsedSpecs,
              price: product.price,
            },
            ...updatedCompareList.map((p) => ({
              id: p.id,
              name: p.name,
              specs: typeof p.specs === "string" ? JSON.parse(p.specs) : p.specs,
              price: p.price,
            })),
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonSummary(data.summary || "Comparison ready.");
      } else {
        setComparisonSummary("Could not generate AI summary. Compare spec tables side-by-side below.");
      }
    } catch (e) {
      setComparisonSummary("AI comparison summary offline. Compare spec tables side-by-side below.");
    } finally {
      setIsComparingLoading(false);
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    const list = product.reviews || [];
    if (ratingFilter === null) return list;
    return list.filter((r: any) => r.rating === ratingFilter);
  }, [product.reviews, ratingFilter]);

  return (
    <div className="bg-[var(--obsidian)] text-[var(--white)] pb-20 relative">
      
      {/* 1. SCROLL-STICKY HEADER ADD TO CART BAR */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-20 left-0 right-0 z-30 bg-[var(--charcoal)] border-b border-[var(--steel)] px-4 py-2.5 flex items-center justify-between shadow-2xl glass-panel"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 max-w-[50%]">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0 hidden sm:block">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-sans font-bold text-white truncate max-w-[120px] xs:max-w-[180px] sm:max-w-md">{product.name}</h4>
                <p className="text-[10px] sm:text-xs text-[var(--gold)] font-display">₹{(product.price / 100).toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <button
                onClick={handleWishlistToggle}
                className={`p-2 sm:p-2.5 rounded-full border transition-all ${
                  isWishlisted 
                    ? "border-[var(--agni)] text-[var(--agni)] bg-[var(--agni-glow)]" 
                    : "border-[var(--steel)] text-[var(--silver)] hover:text-[var(--agni)] hover:border-[var(--agni)]"
                }`}
                title="Wishlist"
              >
                <Heart size={14} className={isWishlisted ? "fill-[var(--agni)] text-[var(--agni)]" : "text-inherit"} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdding}
                className="px-3 sm:px-6 py-2 sm:py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:bg-[var(--steel)] text-neutral-50 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                {isAdding ? (
                  <span>Adding...</span>
                ) : product.stock === 0 ? (
                  <>
                    <span className="hidden xs:inline">Out of Stock</span>
                    <span className="xs:hidden">Out</span>
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Add to Cart</span>
                    <span className="xs:hidden">Add</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider font-mono text-[var(--smoke)] mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white transition-colors">Products</Link>
          <span>/</span>
          <span className="text-white font-bold">{product.name}</span>
        </div>

        {/* 2. HEADER DETAILS & GALLERY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          {/* LEFT: GALLERY (Lg 7cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Image Frame */}
            <div className="w-full aspect-[4/3] bg-[var(--charcoal)] rounded-2xl border border-[var(--steel)]/60 relative overflow-hidden flex items-center justify-center cursor-zoom-in group">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 800px"
              />

              {/* Zoom badge overlay */}
              <div className="absolute bottom-4 right-4 bg-[var(--obsidian)]/80 backdrop-blur border border-[var(--steel)] px-2.5 py-1 rounded text-[9px] uppercase tracking-widest text-[var(--silver)] font-sans">
                Pinch to Zoom
              </div>
            </div>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto no-scrollbar py-1">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-xl bg-[var(--charcoal)] relative overflow-hidden border flex-shrink-0 transition-all ${
                      activeImage === img
                        ? "border-[var(--agni)] scale-95 shadow-agni-glow"
                        : "border-[var(--steel)]/50 hover:border-[var(--silver)]"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${i}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: BUY BOX & PRODUCT DETAILS (Lg 5cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Brand & Stock Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-widest text-[var(--gold-light)] font-bold">
                  {product.brand || "Vyorax"}
                </span>
                
                {/* Stock badge */}
                {product.stock === 0 ? (
                  <span className="px-2.5 py-1 text-[9px] font-sans font-bold tracking-widest uppercase bg-red-600/20 text-red-500 rounded border border-red-500/20">
                    Out of Stock
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="px-2.5 py-1 text-[9px] font-sans font-bold tracking-widest uppercase bg-[var(--gold)]/20 text-[var(--gold-light)] rounded border border-[var(--gold)]/20 animate-pulse">
                    Only {product.stock} Left!
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[9px] font-sans font-bold tracking-widest uppercase bg-[var(--forest)]/20 text-emerald-400 rounded border border-emerald-500/20">
                    In Stock
                  </span>
                )}
              </div>

              {/* Title & Slogan */}
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-wide text-white leading-none">
                  {product.name}
                </h1>
                <p className="text-xs text-[var(--smoke)] uppercase font-mono mt-1.5">SKU: {product.sku}</p>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center space-x-2.5 border-b border-[var(--steel)]/30 pb-4">
                <StarRating rating={product.rating || 4.8} size={14} />
                <span className="text-xs text-[var(--silver)] font-sans font-semibold">
                  {product.rating || 4.8} ({product.reviews?.length || 2} Reviews)
                </span>
              </div>

              {/* Price Block */}
              <div>
                <div className="flex items-baseline space-x-4">
                  <span className="text-4xl font-display font-extrabold text-white glow-text-agni">
                    ₹{(product.price / 100).toLocaleString("en-IN")}
                  </span>
                  {product.comparePrice && (
                    <span className="text-lg font-display font-medium text-[var(--smoke)] line-through">
                      ₹{(product.comparePrice / 100).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--smoke)] mt-1 font-sans">
                  Prices inclusive of all taxes. Free shipping on orders above ₹5,000.
                </p>
              </div>

              {/* Short Description */}
              <p className="text-sm text-[var(--silver)] font-sans leading-relaxed">
                {product.shortDescription}
              </p>

              {/* FEATURE: Cycle Size Finder Trigger Button */}
              {parsedSize && (
                <div className="bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-sans font-bold text-white">Not sure about frame sizing?</h4>
                    <p className="text-[10px] text-[var(--smoke)]">Take our 30-second height & experience quiz.</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuizStep(1);
                      setIsSizeFinderOpen(true);
                    }}
                    className="w-full sm:w-auto text-center px-4 py-2 bg-[var(--charcoal)] border border-[var(--steel)] hover:border-[var(--agni)] text-[var(--gold-light)] hover:text-white text-xs font-sans font-bold tracking-wide uppercase transition-all rounded"
                  >
                    Find My Size →
                  </button>
                </div>
              )}

              {/* FEATURE: Pincode Checker */}
              <div id="pincode-checker-section" className="border-t border-[var(--steel)]/30 pt-6 space-y-3">
                <h4 className="text-xs uppercase font-sans tracking-wider font-bold text-white flex items-center space-x-2">
                  <Truck size={14} className="text-[var(--agni)]" />
                  <span>Check Delivery Pincode</span>
                </h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode (e.g. 834001)"
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value.replace(/\D/g, ""));
                      usePincodeStore.setState({ status: "idle", deliveryMessage: "" });
                    }}
                    className="bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-[var(--agni)] w-48 placeholder-[var(--smoke)] font-mono font-bold"
                  />
                  <button
                    onClick={() => checkPincodeDirect(pincodeInput)}
                    className="px-4 py-2 border border-[var(--steel)] hover:border-white rounded text-xs font-sans font-bold uppercase tracking-wider transition-colors"
                  >
                    Check
                  </button>
                </div>
                <p className="text-[10px] text-[var(--gold-light)] font-sans">
                  🚚 Free delivery on orders above ₹5,000 (Min purchase)
                </p>
                
                {/* Check Feedback Status */}
                {cityStatus !== "idle" && (
                  <p
                    className={`text-xs font-sans ${
                      cityStatus === "checking"
                        ? "text-[var(--silver)] animate-pulse"
                        : cityStatus === "serviceable"
                        ? "text-emerald-400 font-bold"
                        : "text-red-400"
                    }`}
                  >
                    {cityStatus === "checking" ? "Checking delivery coverage..." : deliveryMessage}
                  </p>
                )}
              </div>

              {/* FEATURE: EMI TABBED CALCULATOR */}
              {showEmiSection && emiConfig?.banks?.length > 0 && (
                <div className="border-t border-[var(--steel)]/30 pt-6 space-y-4">
                  <h4 className="text-xs uppercase font-sans tracking-wider font-bold text-white flex items-center space-x-1.5">
                    <CreditCard size={14} className="text-[var(--agni)]" />
                    <span>Affordable Easy Installment Plans (EMI)</span>
                  </h4>
                  
                  {/* Bank Tab Row */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[var(--steel)]/20">
                    {emiConfig.banks.filter((b: any) => b.enabled).map((bank: any) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setActiveEmiBank(bank.id)}
                        className={`px-4 py-2 text-[10px] font-sans font-bold uppercase rounded-lg border whitespace-nowrap transition-all ${
                          activeEmiBank === bank.id
                            ? "bg-[var(--agni)]/15 border-[var(--agni)] text-white shadow-agni-glow"
                            : "bg-[var(--carbon)] border-[var(--steel)]/60 text-[var(--silver)] hover:text-white"
                        }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>

                  {/* Plans Table */}
                  <div className="bg-[var(--carbon)] rounded-xl border border-[var(--steel)]/60 overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left font-sans text-[11px]">
                        <thead className="bg-[var(--obsidian)]/65 border-b border-[var(--steel)]/40 text-[9px] font-bold uppercase tracking-wider text-[var(--smoke)]">
                          <tr>
                            <th className="p-3">Tenure</th>
                            <th className="p-3">Interest Rate</th>
                            <th className="p-3 text-right">Monthly EMI</th>
                            <th className="p-3 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--steel)]/20">
                          {getEmiDetailsForBank(activeEmiBank).map((plan: any) => (
                            <tr key={plan.months} className="hover:bg-[var(--obsidian)]/20 transition-colors">
                              <td className="p-3 font-semibold text-white">
                                {plan.months} Months
                              </td>
                              <td className="p-3">
                                {plan.isNoCost ? (
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--gold)]/20 text-[var(--gold-light)] border border-[var(--gold)]/20 text-[8px] font-bold uppercase tracking-wide">
                                    No Cost EMI
                                  </span>
                                ) : (
                                  <span className="text-[var(--silver)]">{plan.interestRate}% p.a.</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-bold text-white font-mono">
                                ₹{(plan.emi / 100).toLocaleString("en-IN")}/mo
                              </td>
                              <td className="p-3 text-right text-[var(--smoke)] font-mono">
                                ₹{(plan.totalCost / 100).toLocaleString("en-IN")}
                                <span className="block text-[8px] text-[var(--smoke)]/80 mt-0.5">
                                  Incl. ₹{(plan.totalInterest / 100).toLocaleString("en-IN")} interest
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-[var(--steel)]/30 pt-6 flex flex-col sm:flex-row gap-4">
                {/* Primary Add to Cart */}
                <button
                  ref={addToCartRef}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || isAdding}
                  className="flex-1 flex items-center justify-center space-x-2 py-4 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:bg-[var(--steel)] text-neutral-50 text-xs font-bold tracking-widest uppercase rounded transition-colors group"
                >
                  {isAdding ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={14} className="transform group-hover:scale-110 transition-transform" />
                      <span>{product.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
                    </>
                  )}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistToggle}
                  className={`px-6 py-4 border-2 rounded transition-all flex items-center justify-center space-x-2 group ${
                    isWishlisted 
                      ? "border-[var(--agni)] text-[var(--agni)] bg-[var(--agni-glow)]" 
                      : "border-[var(--steel)] text-[var(--silver)] hover:border-[var(--agni)] hover:text-[var(--agni)]"
                  }`}
                >
                  <Heart size={16} className={isWishlisted ? "fill-[var(--agni)] text-[var(--agni)]" : "text-[var(--silver)] group-hover:text-[var(--agni)] transition-colors"} />
                  <span className="text-xs uppercase font-bold tracking-wider">{isWishlisted ? "Saved" : "Save"}</span>
                </button>
              </div>

              {/* FEATURE: WhatsApp Quick Order */}
              <div className="pt-2 text-center">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--gold-light)] hover:text-white hover:underline transition-colors inline-flex items-center space-x-1.5 font-bold font-sans"
                >
                  <MessageSquare size={14} className="text-green-400" />
                  <span>Order instantly via WhatsApp</span>
                </a>
              </div>

              {/* Product Sku Metadata */}
              <div className="pt-6 border-t border-[var(--steel)]/30 grid grid-cols-2 gap-4 text-xs font-sans text-[var(--smoke)]">
                <div>
                  <span>Category:</span>{" "}
                  <strong className="text-white capitalize">{product.categoryName}</strong>
                </div>
                <div>
                  <span>Difficulty:</span>{" "}
                  <strong className="text-white">
                    {product.assemblyDifficulty === 1
                      ? "Ready to Ride"
                      : product.assemblyDifficulty <= 3
                      ? "Some Assembly"
                      : "Expert Needed"}
                  </strong>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 3. FEATURE: WHO IS THIS CYCLE FOR (PERSONA CARDS) */}
        {parsedPersonas && parsedPersonas.length > 0 && (
          <section className="border-t border-[var(--steel)]/40 py-16">
            <div className="text-center mb-10">
              <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Rider profiles</span>
              <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
                WHO IS THIS MACHINE FOR?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {parsedPersonas.map((persona: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handlePersonaClick(idx, persona.title)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    activePersona === idx
                      ? "bg-[var(--carbon)] border-[var(--agni)] shadow-agni-glow"
                      : "bg-[var(--charcoal)] border-[var(--steel)]/60 hover:border-[var(--steel)]"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl bg-[var(--obsidian)] p-3 rounded-2xl relative select-none">
                      {persona.avatar}
                    </span>
                    <div>
                      <h4 className="text-lg font-sans font-bold text-white group-hover:text-[var(--agni-light)] transition-colors">
                        {persona.title}
                      </h4>
                      <p className="text-xs text-[var(--silver)] leading-relaxed mt-2">
                        {persona.desc}
                      </p>
                    </div>
                  </div>
                  
                  {/* Accessories highlighting */}
                  {persona.accessories?.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[var(--steel)]/30 flex items-center justify-between text-[10px] font-sans text-[var(--smoke)] uppercase font-bold tracking-wider">
                      <span>Top accessory setup</span>
                      <span className="text-[var(--gold)] flex items-center">
                        View Spec Focus <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. ASSEMBLY ESTIMATED DIFFICULTY */}
        <section className="border-t border-[var(--steel)]/40 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Delivery Details</span>
            <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5 mb-4">
              ASSEMBLY DIFFICULTY RATING
            </h2>
            <p className="text-sm text-[var(--silver)] font-sans leading-relaxed mb-6">
              All Vyorax cycles are shipped 85% pre-assembled in heavy duty cargo boxes to ensure safety. The box includes a complete tool-kit with hexagonal keys and instructions. Sizing adjustments take minutes.
            </p>
            
            {/* Visual Level indicator */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-sans text-[var(--silver)]">
                <span>Assembly level</span>
                <span className="text-white font-bold">
                  {product.assemblyDifficulty} / 5 (
                  {product.assemblyDifficulty === 1
                    ? "Easy"
                    : product.assemblyDifficulty <= 3
                    ? "Moderate"
                    : "Pro"}
                  )
                </span>
              </div>
              <div className="w-full h-2.5 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-full flex overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 border-r border-[var(--obsidian)] last:border-0 ${
                      i < (product.assemblyDifficulty || 1) ? "bg-[var(--agni)]" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6">
            <h4 className="text-sm font-sans font-bold text-white mb-4">What's required?</h4>
            <ul className="space-y-3 text-xs font-sans text-[var(--silver)]">
              <li className="flex items-center space-x-2.5">
                <Check size={14} className="text-[var(--forest)] flex-shrink-0" />
                <span>Fix front wheel & handlebar (Hex keys included)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check size={14} className="text-[var(--forest)] flex-shrink-0" />
                <span>Thread pedals carefully (L / R labeled threads)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check size={14} className="text-[var(--forest)] flex-shrink-0" />
                <span>Inflate tyres to recommended PSI (indicated on sidewalls)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Check size={14} className="text-[var(--forest)] flex-shrink-0" />
                <span>Adjust saddle/seatpost height (quick-release clamp)</span>
              </li>
            </ul>
            <div className="mt-6 border-t border-[var(--steel)]/30 pt-4 text-center">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--gold)] hover:text-white font-bold font-sans transition-colors"
              >
                Book Ranchi assembly service (WhatsApp) →
              </a>
            </div>
          </div>
        </section>

        {/* 5. FEATURE: STARTER KIT / ACCESSORIES BUNDLING */}
        {parsedStarterKit && parsedStarterKit.length > 0 && (
          <section className="border-t border-[var(--steel)]/40 py-16">
            <div className="text-center mb-10">
              <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Rider kits</span>
              <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
                COMPLETE THE SETUP
              </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Accessory checkboxes list */}
              <div className="lg:col-span-8 space-y-4">
                {parsedStarterKit.map((item: any) => {
                  const isChecked = checkedKitItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleKitItem(item.id)}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-[var(--carbon)] border-[var(--agni)]/60"
                          : "bg-[var(--charcoal)] border-[var(--steel)]/60 hover:border-[var(--steel)]"
                      }`}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        {/* Checkbox circle */}
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                            isChecked
                              ? "bg-[var(--agni)] border-[var(--agni)] text-neutral-50"
                              : "border-[var(--steel)]"
                          }`}
                        >
                          {isChecked && <Check size={12} className="text-white" />}
                        </div>

                        {/* Image */}
                        <div className="w-14 h-14 bg-[var(--obsidian)] rounded overflow-hidden relative flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="60px"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-sans font-bold text-white truncate">{item.name}</h4>
                          <span className="text-[10px] text-[var(--smoke)] uppercase font-mono">SKU: {item.id}</span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-display font-bold text-white">
                          ₹{(item.price / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Running Total Card summary */}
              <div className="lg:col-span-4 bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-5">
                <h4 className="text-xs uppercase font-sans tracking-wider font-bold text-white">
                  Bundle Summary
                </h4>
                
                <div className="space-y-3 text-xs font-sans text-[var(--silver)]">
                  <div className="flex justify-between">
                    <span>{product.name}</span>
                    <span className="font-mono text-white">₹{(product.price / 100).toLocaleString("en-IN")}</span>
                  </div>
                  {parsedStarterKit
                    .filter((item: any) => checkedKitItems.includes(item.id))
                    .map((item: any) => (
                      <div key={item.id} className="flex justify-between text-[var(--smoke)]">
                        <span className="truncate max-w-[200px]">{item.name}</span>
                        <span className="font-mono text-white">₹{(item.price / 100).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  
                  <div className="flex justify-between border-t border-[var(--steel)]/30 pt-3 text-sm font-sans font-bold text-white">
                    <span>Total Bundle</span>
                    <span className="font-mono text-[var(--agni)]">
                      ₹{(bundleTotal / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddBundleToCart}
                  className="w-full py-3.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 6. FEATURE: PRODUCT SPEC COMPARISON SEARCH DRAWER */}
        <section id="product-specs-section" className="border-t border-[var(--steel)]/40 py-16">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-10">
            <div>
              <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Comparison</span>
              <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
                COMPARE WITH ANOTHER CYCLE
              </h2>
            </div>
            
            {/* Open search dialog button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="mt-4 md:mt-0 px-6 py-2.5 border border-[var(--steel)] hover:border-white text-white text-xs font-sans font-bold uppercase tracking-wider rounded transition-colors flex items-center space-x-2"
            >
              <ArrowRightLeft size={14} />
              <span>Select Cycle to Compare</span>
            </button>
          </div>

          {/* AI stream output */}
          {compareList.length > 0 && (
            <div className="mb-10 bg-[var(--charcoal)] border border-[var(--gold)]/40 shadow-gold-glow rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-sans tracking-wider font-bold text-[var(--gold-light)] flex items-center space-x-2">
                <Sparkles size={14} className="animate-pulse" />
                <span>AI Comparison Summary (Claude)</span>
              </h4>
              
              <div className="text-xs font-sans text-[var(--silver)] leading-relaxed italic">
                {isComparingLoading ? (
                  <span className="animate-pulse flex items-center space-x-1.5">
                    <span>Analyzing cycle geometry & specs...</span>
                  </span>
                ) : (
                  comparisonSummary || "Claude AI is ready to compare. Select a cycle to stream summary."
                )}
              </div>
            </div>
          )}

          {/* SIDE-BY-SIDE SPECIFICATION TABLE */}
          <div className="w-full overflow-x-auto no-scrollbar border border-[var(--steel)]/60 rounded-2xl bg-[var(--charcoal)]">
            <table className="w-full min-w-[600px] text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--steel)]/80 bg-[var(--carbon)]">
                  <th className="p-4 font-bold text-white uppercase tracking-wider">Specifications</th>
                  <th className="p-4 font-bold text-[var(--agni)] uppercase tracking-wider w-[240px]">
                    {product.name}
                  </th>
                  {compareList.map((comp) => (
                    <th key={comp.id} className="p-4 font-bold text-white uppercase tracking-wider w-[240px] relative">
                      <span>{comp.name}</span>
                      <button
                        onClick={() => removeFromCompare(comp.id)}
                        className="absolute top-2 right-2 text-[var(--smoke)] hover:text-white"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--steel)]/40">
                {Object.keys(parsedSpecs).map((specKey) => (
                  <tr
                    key={specKey}
                    className={`hover:bg-[var(--carbon)]/30 transition-colors ${
                      focusedSpec === specKey ? "bg-[var(--agni-glow)]/40 font-bold" : ""
                    }`}
                  >
                    <td className="p-4 font-bold text-[var(--silver)] border-r border-[var(--steel)]/30">
                      {specKey}
                    </td>
                    <td className="p-4 text-white border-r border-[var(--steel)]/30 font-semibold">
                      {parsedSpecs[specKey]}
                    </td>
                    {compareList.map((comp) => {
                      const otherSpecs = typeof comp.specs === "string" ? JSON.parse(comp.specs) : comp.specs;
                      return (
                        <td key={comp.id} className="p-4 text-[var(--chalk)] border-r border-[var(--steel)]/30">
                          {otherSpecs[specKey] || "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. SMART RECOMMENDATIONS (AI-POWERED) */}
        <section className="border-t border-[var(--steel)]/40 py-16">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Accessories</span>
            <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
              COMPLETE YOUR SETUP
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {aiRecsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl border border-[var(--steel)]/40 skeleton-glow" />
              ))
            ) : aiRecs.length > 0 ? (
              aiRecs.slice(0, 4).map((rec: any) => {
                // If it is custom structured recommendation or product card data
                const isProduct = rec.price !== undefined;
                const emi = isProduct ? Math.round((rec.price * 1.12) / 12) : 19900;
                
                return (
                  <Link
                    key={rec.id}
                    href={rec.slug ? `/products/${rec.slug}` : `/products`}
                    className="group bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden p-4 hover:border-[var(--agni)]/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full rounded bg-[var(--obsidian)] relative overflow-hidden mb-4">
                      <Image
                        src={rec.image || rec.images?.[0] || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop"}
                        alt={rec.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="180px"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-bold text-white group-hover:text-[var(--agni-light)] transition-colors truncate">
                        {rec.name}
                      </h4>
                      <p className="text-[10px] text-[var(--smoke)] uppercase font-mono mt-0.5">SKU: {rec.sku || rec.id}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--steel)]/30 flex items-center justify-between">
                      <span className="text-sm font-display font-bold text-white">
                        ₹{((rec.price || 199900) / 100).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-sans font-bold text-[var(--agni)] group-hover:translate-x-1 transition-transform">
                        Add +
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="col-span-full text-center text-xs text-[var(--smoke)]">No recommendations available.</p>
            )}
          </div>
        </section>

        {/* 8. REVIEWS SECTION */}
        <section className="border-t border-[var(--steel)]/40 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Rating breakdown summary (Lg 4cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Rider feedback</span>
                <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
                  RIDER REVIEWS
                </h2>
              </div>
              
              {/* Star breakdown box */}
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-display font-extrabold text-white">{product.rating || 4.8}</span>
                  <div>
                    <StarRating rating={product.rating || 4.8} size={14} />
                    <span className="text-[10px] text-[var(--smoke)] uppercase font-mono mt-0.5">Based on {product.reviews?.length || 2} ratings</span>
                  </div>
                </div>

                {/* Filter tags by star */}
                <div className="pt-4 border-t border-[var(--steel)]/30 space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] font-sans">Filter by star rating:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setRatingFilter(null)}
                      className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase transition-colors ${
                        ratingFilter === null
                          ? "bg-[var(--agni)] text-neutral-50"
                          : "bg-[var(--carbon)] hover:bg-[var(--steel)] text-[var(--silver)] border border-[var(--steel)]/50"
                      }`}
                    >
                      All Stars
                    </button>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <button
                        key={s}
                        onClick={() => setRatingFilter(s)}
                        className={`px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase transition-colors ${
                          ratingFilter === s
                            ? "bg-[var(--agni)] text-neutral-50"
                            : "bg-[var(--carbon)] hover:bg-[var(--steel)] text-[var(--silver)] border border-[var(--steel)]/50"
                        }`}
                      >
                        {s} ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* List of reviews (Lg 8cols) */}
            <div className="lg:col-span-8 space-y-6">
              {filteredReviews.length === 0 ? (
                <div className="p-8 border border-dashed border-[var(--steel)]/60 rounded-2xl text-center text-xs text-[var(--smoke)]">
                  No reviews match your selected rating filter.
                </div>
              ) : (
                filteredReviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[var(--charcoal)] border border-[var(--steel)]/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--steel)] flex items-center justify-center font-bold text-xs uppercase text-white font-sans">
                          {(rev.userName || rev.guestName || "U").substring(0, 1)}
                        </div>
                        <div>
                          <h4 className="text-xs font-sans font-bold text-white">
                            {rev.userName || rev.guestName || "Verified Rider"}
                          </h4>
                          <span className="text-[10px] text-[var(--smoke)] font-mono">
                            {new Date(rev.createdAt || Date.now()).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <StarRating rating={rev.rating} size={12} />
                    </div>

                    <div>
                      <h5 className="text-xs font-sans font-bold text-white flex items-center space-x-2">
                        {rev.verified && (
                          <span className="text-[9px] bg-[var(--forest)]/20 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase mr-1.5 select-none">
                            Verified Buy
                          </span>
                        )}
                        <span>{rev.title}</span>
                      </h5>
                      <p className="text-xs text-[var(--silver)] leading-relaxed mt-2 font-sans">
                        {rev.body}
                      </p>
                      
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {rev.images.map((url: string, index: number) => {
                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|flv|mkv|3gp|wmv|m4v)(?:\?|$)/) || url.includes("/video/upload/") || url.includes("/video/");
                             return (
                              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--steel)]/30 bg-[var(--obsidian)]">
                                {isVideo ? (
                                  <div className="w-full h-full relative cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
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
                                        <span className="text-[8px] pl-0.5">▶</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    src={url} 
                                    alt={`Review media ${index + 1}`} 
                                    className="w-full h-full object-cover cursor-zoom-in" 
                                    onClick={() => window.open(url, '_blank')} 
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </section>

        {/* 8.5. RECENTLY VIEWED PRODUCTS */}
        {recentlyViewed.length > 0 && (
          <section className="border-t border-[var(--steel)]/40 py-16">
            <div className="text-center mb-10">
              <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Your history</span>
              <h2 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5">
                RECENTLY VIEWED
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {recentlyViewed.slice(0, 4).map((item: any) => {
                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden p-4 hover:border-[var(--agni)]/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full rounded bg-[var(--obsidian)] relative overflow-hidden mb-4">
                      <Image
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop"}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="180px"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-sans font-bold text-white group-hover:text-[var(--agni-light)] transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[var(--smoke)] uppercase font-mono mt-0.5">SKU: {item.sku || item.id}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--steel)]/30 flex items-center justify-between">
                      <span className="text-sm font-display font-bold text-white">
                        ₹{((item.price) / 100).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-sans font-bold text-[var(--agni)] group-hover:translate-x-1 transition-transform">
                        View Product →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* 9. SIZE FINDER SLIDE OVER QUIZ DRAWER */}
      <AnimatePresence>
        {isSizeFinderOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeFinderOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[var(--charcoal)] border-l border-[var(--steel)] p-6 flex flex-col justify-between shadow-2xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--steel)]/60 mb-6">
                  <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-white">Sizing Finder Quiz</h3>
                  <button onClick={() => setIsSizeFinderOpen(false)} className="text-[var(--silver)] hover:text-white">
                    ✕
                  </button>
                </div>

                {/* Progress bar steps */}
                <div className="flex space-x-1.5 mb-8">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`h-1.5 flex-1 rounded-full ${
                        quizStep >= stepNum ? "bg-[var(--agni)]" : "bg-[var(--steel)]"
                      }`}
                    />
                  ))}
                </div>

                {/* Step 1: Height Slider */}
                {quizStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-sans font-bold text-white">What's your height?</h4>
                      <p className="text-xs text-[var(--smoke)]">Slide to select your height value in cm.</p>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                      <input
                        type="range"
                        min="140"
                        max="200"
                        value={quizHeight}
                        onChange={(e) => setQuizHeight(parseInt(e.target.value))}
                        className="w-full accent-[var(--agni)]"
                      />
                      <div className="text-center">
                        <span className="text-3xl font-display font-extrabold text-white">
                          {quizHeight} cm
                        </span>
                        <p className="text-[10px] text-[var(--smoke)] font-mono uppercase mt-1">
                          Approx: {Math.floor((quizHeight / 2.54) / 12)}'
                          {Math.round((quizHeight / 2.54) % 12)}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Use Case Cards */}
                {quizStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-sans font-bold text-white">What is your primary use-case?</h4>
                      <p className="text-xs text-[var(--smoke)]">Select one card that represents your trails.</p>
                    </div>

                    <div className="space-y-3 pt-4">
                      {[
                        { key: "commute", title: "Daily commute", desc: "Streets, asphalt, college and work runs." },
                        { key: "weekend", title: "Weekend rides", desc: "Long distance ring roads, highway loops." },
                        { key: "offroad", title: "Off-road trails", desc: "Hills, gravel, forests, Jonha trail zones." },
                      ].map((item) => (
                        <div
                          key={item.key}
                          onClick={() => setQuizUse(item.key)}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                            quizUse === item.key
                              ? "bg-[var(--carbon)] border-[var(--agni)]"
                              : "bg-[var(--obsidian)] border-[var(--steel)]/60 hover:border-[var(--steel)]"
                          }`}
                        >
                          <h5 className="text-xs font-sans font-bold text-white">{item.title}</h5>
                          <p className="text-[10px] text-[var(--silver)] mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Experience Level */}
                {quizStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-sans font-bold text-white">Your experience level?</h4>
                      <p className="text-xs text-[var(--smoke)]">Helps customize steering setup.</p>
                    </div>

                    <div className="space-y-3 pt-4">
                      {[
                        { key: "beg", title: "Beginner", desc: "Casual riding, looking for maximum comfort." },
                        { key: "int", title: "Intermediate", desc: "Regular rider, understands balance & gears." },
                        { key: "pro", title: "Pro", desc: "Offroad racer or endurance cyclist." },
                      ].map((item) => (
                        <div
                          key={item.key}
                          onClick={() => setQuizExp(item.key)}
                          className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                            quizExp === item.key
                              ? "bg-[var(--carbon)] border-[var(--agni)]"
                              : "bg-[var(--obsidian)] border-[var(--steel)]/60 hover:border-[var(--steel)]"
                          }`}
                        >
                          <h5 className="text-xs font-sans font-bold text-white">{item.title}</h5>
                          <p className="text-[10px] text-[var(--silver)] mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Results */}
                {quizStep === 4 && (
                  <div className="space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--forest)]/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-base font-sans font-bold text-white">Your Size Match Available</h4>
                      <p className="text-xs text-[var(--smoke)]">Based on height and terrain analysis.</p>
                    </div>
                    
                    <div className="bg-[var(--obsidian)] p-6 rounded-2xl border border-[var(--steel)]/60 my-6">
                      <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--gold)] font-bold">Recommended size</span>
                      <p className="text-3xl font-display font-extrabold text-white mt-2 glow-text-agni">
                        {recommendedSize}
                      </p>
                      <p className="text-[10px] text-[var(--smoke)] font-mono mt-1">Confidence score: 98%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer footer navigation */}
              <div className="pt-6 border-t border-[var(--steel)]/60 flex space-x-3">
                {quizStep > 1 && quizStep < 4 && (
                  <button
                    onClick={() => setQuizStep(quizStep - 1)}
                    className="flex-1 py-2.5 border border-[var(--steel)] text-white text-xs font-sans font-bold uppercase tracking-wider rounded"
                  >
                    Back
                  </button>
                )}
                {quizStep < 3 ? (
                  <button
                    disabled={quizStep === 2 && !quizUse}
                    onClick={() => setQuizStep(quizStep + 1)}
                    className="flex-grow py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded disabled:opacity-50"
                  >
                    Next Step
                  </button>
                ) : quizStep === 3 ? (
                  <button
                    disabled={!quizExp}
                    onClick={handleSizeQuizSubmit}
                    className="flex-grow py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded"
                  >
                    Match Sizing
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleAddToCart();
                      setIsSizeFinderOpen(false);
                    }}
                    className="flex-grow py-3 bg-[var(--agni)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded"
                  >
                    Add Size to Cart
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 10. PRODUCT SPEC COMPARISON SEARCH MODAL */}
      <AnimatePresence>
        {isCompareOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompareOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed inset-x-4 top-[10vh] bottom-[10vh] md:max-w-xl md:mx-auto z-50 bg-[var(--charcoal)] border border-[var(--steel)] rounded-2xl shadow-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--steel)]/60 mb-6">
                  <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-white">Select Product to Compare</h3>
                  <button onClick={() => setIsCompareOpen(false)} className="text-[var(--silver)] hover:text-white">
                    ✕
                  </button>
                </div>

                {/* Search in comparison list */}
                <input
                  type="text"
                  placeholder="Type product name (e.g. Ranchi Rider, Urban Swift)..."
                  value={compareSearchQuery}
                  onChange={(e) => setCompareSearchQuery(e.target.value)}
                  className="w-full bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-[var(--smoke)] mb-6"
                />

                {/* Matchings List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
                  {allProducts
                    .filter((p) => p.id !== product.id && p.name.toLowerCase().includes(compareSearchQuery.toLowerCase()))
                    .map((p) => {
                      const selected = isComparing(p.id);
                      return (
                        <div
                          key={p.id}
                          className="p-3 bg-[var(--obsidian)] border border-[var(--steel)]/30 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded bg-[var(--carbon)] relative overflow-hidden flex-shrink-0">
                              <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                            </div>
                            <span className="text-xs font-sans font-bold text-white truncate">{p.name}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              if (selected) {
                                removeFromCompare(p.id);
                              } else {
                                triggerComparison(p);
                              }
                              setIsCompareOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded text-[10px] font-sans font-bold uppercase transition-colors ${
                              selected
                                ? "bg-red-900/40 text-red-400 border border-red-500/20"
                                : "bg-[var(--agni)] text-neutral-50 hover:bg-[var(--agni-light)]"
                            }`}
                          >
                            {selected ? "Remove" : "Compare"}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--steel)]/60 text-center">
                <span className="text-[10px] text-[var(--smoke)] font-sans">You can compare up to 3 cycles at once.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--charcoal)] border-t border-[var(--steel)]/80 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] flex gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:hidden">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className="flex-1 flex items-center justify-center space-x-2 py-3.5 border border-[var(--steel)] text-[var(--white)] hover:bg-[var(--steel)]/20 disabled:opacity-40 disabled:border-transparent text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all"
        >
          {isAdding ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <ShoppingCart size={14} />
              <span>{product.stock === 0 ? "Out of Stock" : "Add to Cart"}</span>
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={product.stock === 0 || isBuying}
          className="flex-1 flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-[var(--agni)] to-[var(--agni-light)] text-neutral-50 font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[var(--agni)]/10 hover:shadow-[var(--agni)]/30 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {isBuying ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard size={14} />
              <span>Buy Now</span>
            </>
          )}
        </button>
      </div>

      {/* Flying Elements Renderer */}
      {flyingItems.map((item) => (
        <motion.div
          key={item.id}
          initial={{
            x: item.startX - 28,
            y: item.startY - 28,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: [
              item.startX - 28,
              (item.startX + item.endX) / 2 - 28,
              item.endX - 28,
            ],
            y: [
              item.startY - 28,
              Math.min(item.startY, item.endY) - 150 - 28,
              item.endY - 28,
            ],
            scale: [1, 0.6, 0.15],
            opacity: [1, 0.9, 0],
          }}
          transition={{
            duration: 0.85,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            // Remove from list
            setFlyingItems((prev) => prev.filter((fi) => fi.id !== item.id));

            // Trigger bounce reaction on the header cart button
            const cartIcon = document.getElementById("header-cart-icon");
            if (cartIcon) {
              cartIcon.classList.add("animate-bounce-subtle");
              setTimeout(() => {
                cartIcon.classList.remove("animate-bounce-subtle");
              }, 400);
            }

            // Open the cart drawer
            setIsOpen(true);
          }}
          className="fixed left-0 top-0 w-14 h-14 rounded-full border-2 border-[var(--agni)] shadow-2xl overflow-hidden bg-[var(--obsidian)] z-50 pointer-events-none flex items-center justify-center"
        >
          <div className="w-10 h-10 relative">
            <Image
              src={product.images[0]}
              alt="flying item"
              fill
              className="object-contain animate-pulse"
              sizes="40px"
            />
          </div>
        </motion.div>
      ))}

    </div>
  );

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    toggleItem(product.id);
  }
}
