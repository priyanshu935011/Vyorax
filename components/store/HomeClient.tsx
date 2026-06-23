"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";
import { useCartStore, usePincodeStore } from "@/lib/store";
import { MOCK_SLIDES, DEFAULT_HOMEPAGE_CONFIG } from "@/lib/mockData";
import {
  ArrowDown,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ShieldAlert,
  Award,
  MapPin,
  CheckCircle,
  Truck,
  HelpCircle,
  Search,
  Percent,
  Heart,
  Wrench,
  Clock,
  Settings,
} from "lucide-react";

interface HomeClientProps {
  featuredProducts: any[];
  initialSlides?: any[];
  initialConfig?: any;
}

export default function HomeClient({
  featuredProducts,
  initialSlides,
  initialConfig,
}: HomeClientProps) {
  const [config, setConfig] = useState<any>(() => {
    return initialConfig || DEFAULT_HOMEPAGE_CONFIG;
  });

  const [slides, setSlides] = useState<any[]>(() => {
    const initial =
      initialSlides && initialSlides.length > 0 ? initialSlides : MOCK_SLIDES;
    const active = initial.filter((s: any) => s.isActive !== false);
    return active.length > 0
      ? active
      : MOCK_SLIDES.filter((s: any) => s.isActive);
  });

  // Testimonials auto-play state
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [searchVal, setSearchVal] = useState("");

  const [selectedColor, setSelectedColor] = useState("orange"); // "orange", "grey", "teal"
  const [cartAdding, setCartAdding] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch Swiping Refs & Event Handlers
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (slides.length === 0) return;
    const diff = touchStartX.current - touchEndX.current;

    // Swipe left (next slide)
    if (diff > 50) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
    // Swipe right (prev slide)
    if (diff < -50) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }

    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Load config & slides on mount to sync with localStorage simulation data if offline
  useEffect(() => {
    let activeConfig = initialConfig || DEFAULT_HOMEPAGE_CONFIG;
    const savedConfig = localStorage.getItem("vega_sim_homepage_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed && typeof parsed === "object") {
          activeConfig = { ...activeConfig, ...parsed };
        }
      } catch (e) {
        console.warn("Failed to parse simulated homepage config");
      }
    }
    setConfig(activeConfig);

    const savedSlides = localStorage.getItem("vega_sim_slides");
    let loadedSlides =
      initialSlides && initialSlides.length > 0 ? initialSlides : MOCK_SLIDES;

    if (savedSlides) {
      try {
        const parsed = JSON.parse(savedSlides);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedSlides = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse simulated slides from localStorage");
      }
    }

    const active = loadedSlides
      .filter((s: any) => s.isActive !== false)
      .sort(
        (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0),
      );

    setSlides(
      active.length > 0 ? active : MOCK_SLIDES.filter((s: any) => s.isActive),
    );
  }, [initialSlides, initialConfig]);

  // Reset current slide if index goes out of bounds
  useEffect(() => {
    if (slides.length > 0 && currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides, currentSlide]);

  useEffect(() => {
    if (isHovered || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  const bikeImages: Record<string, string> = {
    orange:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop",
    grey: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800&auto=format&fit=crop",
    teal: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=800&auto=format&fit=crop",
  };

  const performAddFeaturedToCart = () => {
    setCartAdding(true);
    addItem(
      {
        id: "prod-aero-x",
        name: "Giant Aero-X Carbon Hybrid",
        slug: "giant-aero-x-carbon",
        price: 4500000,
        image: bikeImages[selectedColor],
        sku: "GIANT-CYC-AEROX",
        stock: 4,
      },
      1,
    );
    setTimeout(() => {
      setCartAdding(false);
      alert("Giant Aero-X Carbon Hybrid added to cart!");
    }, 500);
  };

  const handleAddFeaturedToCart = () => {
    const { status, verifiedPincode } = usePincodeStore.getState();

    if (status === "serviceable") {
      performAddFeaturedToCart();
    } else if (status === "unserviceable") {
      alert(
        `❌ We currently only deliver to Ranchi zones (834xxx/835xxx). Pincode ${verifiedPincode || ""} is out of our delivery area.`,
      );
    } else {
      // New user, prompt modal
      usePincodeStore.setState({
        isModalOpen: true,
        pendingAddItem: () => performAddFeaturedToCart(),
      });
    }
  };

  const testimonials = config.testimonials || [
    {
      quote:
        "Riding the Giant Aero-X Carbon around Ranchi's Ring Road is an absolute dream. It is lighter than road bikes twice its price. The engineering quality is unmatched.",
      author: "Vikram Sen",
      city: "Ranchi, Jharkhand",
      rating: 5,
    },
    {
      quote:
        "The Bowflex adjustable dumbbells are perfect for my home gym setup. Weight changes take 1 second and plates don't rattle. Highly impressed by Bowflex quality.",
      author: "Aditi Roy",
      city: "Jamshedpur, Jharkhand",
      rating: 5,
    },
    {
      quote:
        "My Trek Ranchi Rider MTB has excellent grip on muddy monsoon trails. The mechanical disc brakes give me absolute confidence down Patratu Valley roads.",
      author: "Rahul Oraon",
      city: "Ranchi, Jharkhand",
      rating: 5,
    },
  ];

  // Shop by Brand categories list
  const brandList = config.brands || [
    {
      name: "Trek",
      logo: "TREK",
      desc: "Premium Mountain & Road Bikes",
      href: "/products?brand=Trek",
    },
    {
      name: "Giant",
      logo: "GIANT",
      desc: "High-Performance Carbon Hybrids",
      href: "/products?brand=Giant",
    },
    {
      name: "Specialized",
      logo: "SPECIALIZED",
      desc: "Sleek City & Commuter Cycles",
      href: "/products?brand=Specialized",
    },
    {
      name: "Yonex",
      logo: "YONEX",
      desc: "Japanese Graphite Rackets",
      href: "/products?brand=Yonex",
    },
    {
      name: "Bowflex",
      logo: "BOWFLEX",
      desc: "Adjustable Dial Weights",
      href: "/products?brand=Bowflex",
    },
    {
      name: "Giro",
      logo: "GIRO",
      desc: "Aerodynamic Protective Helmets",
      href: "/products?brand=Giro",
    },
  ];

  // Featured retail products showroom
  const [activeShowcase, setActiveShowcase] = useState(0);
  const showcaseProducts = [
    {
      brand: "Giant",
      name: "Aero-X Carbon Hybrid",
      desc: "Premium carbon-alloy performance hybrid cycle. Features Shimano 1x11 speed derailleur, Shimano MT200 hydraulic disc brakes, and SR Suntour suspension fork. Delivering road bike speed with rugged durability.",
      price: 4500000,
      image:
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop",
      slug: "giant-aero-x-carbon",
      specs: [
        "Giant Carbon Alloy Frame",
        "Shimano Deore 1x11 Gears",
        "Shimano Hydraulic Brakes",
      ],
    },
    {
      brand: "Trek",
      name: "Ranchi Rider MTB",
      desc: "Alpha Silver Aluminum mountain bike crafted for rough roads and trails. Outfitted with high-traction Bontrager tyres, Tektro mechanical disc brakes, and Shimano 24-speed gears to conquer patratu trails.",
      price: 2450000,
      image:
        "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=800&auto=format&fit=crop",
      slug: "trek-ranchi-rider-mtb",
      specs: [
        "Alpha Silver Aluminum Frame",
        "Shimano Altus 24 Gears",
        'Bontrager 29" All-Terrain Tyres',
      ],
    },
    {
      brand: "Bowflex",
      name: "SelectTech Adjustable Dumbbells",
      desc: "Replace 15 pairs of traditional weights with a single dial-selector pair. Changes dumbbells instantly from 2.5 kg up to 24 kg per hand. Finished with premium thermoplastic rubber shield.",
      price: 1199900,
      image:
        "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=800&auto=format&fit=crop",
      slug: "bowflex-selecttech-dumbbells",
      specs: [
        "2.5kg to 24kg Dial System",
        "Replaces 15 Dumbbell Sets",
        "Knurled Steel Handle Base",
      ],
    },
    {
      brand: "Yonex",
      name: "Carbon Pro Badminton Racket",
      desc: "Japanese high modulus carbon graphite frame for lightning-fast swings and explosive smashes. Built light at 82 grams with high tension support up to 30 lbs, ideal for net play and attack.",
      price: 349900,
      image:
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop",
      slug: "yonex-carbon-pro-badminton",
      specs: [
        "Japanese Carbon Graphite",
        "Lightweight 82g (4U) Frame",
        "Tension Capacity: 30 lbs",
      ],
    },
  ];

  const categories = config.collections || [
    {
      name: "Performance Cycles",
      displayName: "Cycles",
      desc: "Premium hybrid, road, and trail MTBs from Giant, Trek, and Specialized.",
      href: "/products?category=cycles",
      image:
        "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=400&auto=format&fit=crop",
      gridSpan: "lg:col-span-2 lg:row-span-2",
    },
    {
      name: "Strength & Fitness",
      displayName: "Fitness",
      desc: "Space-saving Bowflex adjustable selector dumbbells and training gears.",
      href: "/products?category=fitness",
      image:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop",
      gridSpan: "lg:col-span-2 lg:row-span-1",
    },
    {
      name: "Racquet Sports",
      displayName: "Sports",
      desc: "High-tension graphite Yonex rackets and court accessories.",
      href: "/products?category=sports",
      image:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=400&auto=format&fit=crop",
      gridSpan: "lg:col-span-1 lg:row-span-1",
    },
    {
      name: "Rider Accessories",
      displayName: "Gear",
      desc: "Cateye lights, Giro helmets, Topeak pumps, and Kryptonite locks.",
      href: "/products?category=accessories",
      image:
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=400&auto=format&fit=crop",
      gridSpan: "lg:col-span-1 lg:row-span-1",
    },
    {
      name: "Electric Cycles",
      displayName: "E-Cycles",
      desc: "Smart electric power-assisted cycles.",
      href: "/products?category=electric-cycles",
      image:
        "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?q=80&w=400&auto=format&fit=crop",
      gridSpan: "lg:col-span-1 lg:row-span-1",
    },
  ];

  // Auto-play testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const activeSlide = slides[currentSlide] || {
    title: "",
    subtitle: "",
    desc: "",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1600&auto=format&fit=crop",
    ctaText: "Explore",
    ctaHref: "#",
    bgGradient: "from-orange-600/20 via-neutral-900/5 to-transparent",
    accent: "var(--agni)",
  };
  return (
    <div className="bg-[var(--obsidian)] overflow-x-hidden text-neutral-800 dark:text-neutral-100 pb-10">
      {/* 1. BLOOM STYLE ROUNDED HERO CAROUSEL */}
      {config.showSlider !== false && (
        <section className="relative w-full overflow-hidden pt-4 pb-6 bg-[var(--obsidian)]">
          {/* Mobile version (Peeking layout) */}
          <div className="md:hidden flex space-x-4 overflow-x-auto snap-x snap-mandatory px-5 py-2 no-scrollbar">
            {slides.map((slide: any, idx: number) => (
              <div
                key={slide.id || idx}
                className="w-[82vw] flex-shrink-0 snap-center relative aspect-[10/11] rounded-[2.5rem] overflow-hidden bg-neutral-900 border border-[var(--steel)]/60 shadow-lg"
              >
                <Image
                  src={slide.image}
                  alt={slide.subtitle}
                  fill
                  className="object-cover brightness-[0.75]"
                  sizes="85vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 z-10 space-y-4">
                  <h3
                    className="text-2xl font-display font-extrabold uppercase leading-[1.05] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{ color: "white" }}
                  >
                    {slide.subtitle}
                  </h3>
                  <div className="pt-1">
                    <Link
                      href={slide.ctaHref}
                      className="inline-block bg-[#ffffff] text-[#000000] hover:bg-[#f3f4f6] font-sans font-extrabold text-[11px] px-6 py-2.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {slide.ctaText || "Add to Cart"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop version (Wide screen carousel) */}
          <div className="hidden md:block max-w-7xl mx-auto px-8 relative">
            <div
              className="relative w-full h-[460px] rounded-[3rem] overflow-hidden bg-neutral-900 border border-[var(--steel)]/40 shadow-xl"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full flex items-center"
                >
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.subtitle}
                    fill
                    className="object-cover brightness-[0.7] saturate-[0.85]"
                    priority
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${activeSlide.bgGradient}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

                  {/* Desktop Content */}
                  <div className="relative z-10 w-full px-20 text-left">
                    <div className="max-w-xl space-y-5">
                      <span
                        className="inline-block px-3 py-0.5 rounded border text-[9px] uppercase font-sans font-bold tracking-widest text-white"
                        style={{
                          color: "white",
                          borderColor: activeSlide.accent,
                          backgroundColor: `${activeSlide.accent}20`,
                        }}
                      >
                        {activeSlide.title}
                      </span>
                      <h1
                        className="text-4xl md:text-5xl font-display font-extrabold uppercase leading-[1.05] text-white tracking-wide"
                        style={{ color: "white" }}
                      >
                        {activeSlide.subtitle}
                      </h1>
                      <p
                        className="text-xs sm:text-sm text-white font-sans leading-relaxed max-w-lg"
                        style={{ color: "white" }}
                      >
                        {activeSlide.desc}
                      </p>
                      <div className="pt-2">
                        <Link
                          href={activeSlide.ctaHref}
                          className="inline-flex items-center px-6 py-2.5 text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                          style={{
                            backgroundColor: activeSlide.accent,
                            color: "white",
                          }}
                        >
                          {activeSlide.ctaText}
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex space-x-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? "w-6"
                        : "bg-white/30 hover:bg-white/60"
                    }`}
                    style={{
                      backgroundColor:
                        i === currentSlide
                          ? slides[i]?.accent || "var(--agni)"
                          : undefined,
                    }}
                    title={`Go to Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Arrows */}
            <button
              onClick={() =>
                setCurrentSlide(
                  (prev) => (prev - 1 + slides.length) % slides.length,
                )
              }
              className="absolute left-12 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-[var(--steel)]/60 bg-neutral-100 text-black hover:bg-neutral-100 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % slides.length)
              }
              className="absolute right-12 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full border border-[var(--steel)]/60 bg-neutral-100 text-black hover:bg-neutral-100 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      )}

      {/* 2. CAPSULE CATEGORIES SCROLL */}
      {config.showBento !== false && (
        <section className="py-8 md:py-12 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6 px-1">
            <div>
              <span className="text-[10px] uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">
                Rider Arenas
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-wide uppercase text-[var(--agni)] mt-0.5">
                CATEGORIES
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs font-sans font-bold text-[var(--silver)] hover:text-[var(--agni)] hover:underline transition-all"
            >
              View all
            </Link>
          </div>

          {/* Mobile version: Horizontal scroll of rounded cards (reduced border radius) */}
          <div className="md:hidden flex space-x-4 overflow-x-auto no-scrollbar pb-3">
            {categories.map((cat: any, i: number) => (
              <Link
                key={cat.name || i}
                href={cat.href || "#"}
                className="flex flex-col items-center flex-shrink-0 w-[72px]"
              >
                {/* Rounded container with reduced border radius */}
                <div className="w-[72px] h-[96px] rounded-2xl bg-[var(--carbon)] border border-[var(--steel)]/60 overflow-hidden relative transition-all duration-300 active:scale-95">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
                <span className="text-[10px] font-sans font-bold text-center mt-2 leading-tight capitalize tracking-normal text-[var(--silver)]">
                  {cat.displayName || cat.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop version: Full-width grid of large rounded cards (reduced border radius) */}
          <div className="hidden md:grid grid-cols-5 gap-6 w-full">
            {categories.map((cat: any, i: number) => (
              <Link
                key={cat.name || i}
                href={cat.href || "#"}
                className="flex flex-col items-center w-full group"
              >
                {/* Large rounded container with reduced border radius */}
                <div className="w-full h-36 lg:h-44 rounded-2xl bg-[var(--carbon)] border border-[var(--steel)]/60 overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-[var(--agni)]/60 group-hover:shadow-md">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 20vw, 15vw"
                  />
                </div>
                <span className="text-xs lg:text-sm font-sans font-bold text-center mt-3 leading-tight capitalize tracking-normal text-[var(--silver)] group-hover:text-[var(--white)] transition-colors">
                  {cat.displayName || cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. NEW ITEMS / ARRIVALS */}
      {config.showProducts !== false && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10 md:py-16 bg-[var(--charcoal)] border-t border-[var(--steel)]/40"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 text-left">
              <div>
                <span className="text-[10px] uppercase font-sans tracking-[0.25em] font-bold text-[var(--agni)]">
                  Latest Releases
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-wide uppercase text-[var(--agni)] mt-0.5">
                  NEW ITEMS
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-sans font-bold text-[var(--silver)] hover:text-[var(--agni)] hover:underline transition-all"
              >
                View all
              </Link>
            </div>

            {/* Responsive grid: 2 columns on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.slice(0, 4).map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    isFeatured: product.isFeatured || idx === 1,
                  }}
                  variant="arched"
                />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 4. RIDER SERVICES & WORKSHOP */}
      {config.showServices !== false && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10 md:py-16 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 border-t border-[var(--steel)]/40"
        >
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-sans tracking-[0.25em] font-bold text-[var(--agni)]">
              Workshop & Doorstep Care
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-wide uppercase text-[var(--white)] mt-1">
              Rider Services & Ranchi Workshop
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-2 max-w-2xl mx-auto">
              Jharkhand's most trusted servicing and repairing hub. From premium
              tuning to specialized component overhauls, our Shimano-certified
              workshop has Ranchi covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Servicing */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-[var(--agni)]/30 hover:shadow-agni-glow transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--agni)]/5 blur-3xl rounded-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 bg-orange-600/10 text-[var(--agni)] rounded-xl">
                    <Wrench size={24} />
                  </span>
                  <span className="text-sm font-sans font-bold text-[var(--gold)]">
                    Starts at ₹799
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--white)] uppercase tracking-wider mb-3 group-hover:text-[var(--agni-light)] transition-colors">
                  Professional Cycle Servicing
                </h3>
                <p className="text-xs text-[var(--silver)] font-sans leading-relaxed mb-6">
                  Keep your ride running flawlessly. Choose from our General
                  Care, Deep Tuning, or Elite Overhaul packages. Includes deep
                  cleaning, chemical drivetrain baths, wheel truing, and
                  complete component safety checks.
                </p>
                <ul className="space-y-2.5 mb-8">
                  <li className="flex items-start space-x-2.5 text-xs text-[var(--silver)]">
                    <span className="text-[var(--agni)] mt-0.5">📍</span>
                    <span>Free Doorstep Pickup & Drop in Ranchi</span>
                  </li>
                  <li className="flex items-start space-x-2.5 text-xs text-[var(--silver)]">
                    <span className="text-[var(--agni)] mt-0.5">🛠️</span>
                    <span>15-Point Safety & Performance Audit</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/servicing"
                className="w-full text-center py-3 px-6 bg-[var(--agni)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all hover:bg-orange-500 shadow-md"
              >
                Book Cycle Servicing
              </Link>
            </div>

            {/* Column 2: Repairing */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-[var(--gold)]/30 hover:shadow-gold-glow transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl rounded-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 bg-amber-600/10 text-[var(--gold)] rounded-xl">
                    <Settings size={24} />
                  </span>
                  <span className="text-sm font-sans font-bold text-[var(--gold)]">
                    Starts at ₹499
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--white)] uppercase tracking-wider mb-3 group-hover:text-[var(--gold-light)] transition-colors">
                  Certified Cycle Repairing
                </h3>
                <p className="text-xs text-[var(--silver)] font-sans leading-relaxed mb-6">
                  Targeted fixes for specific issues. From hydraulic brake
                  bleeding and rotor straightening to drivetrain tuning, wheel
                  truing, and component replacements. Handled by
                  Shimano-certified mechanics.
                </p>
                <ul className="space-y-2.5 mb-8">
                  <li className="flex items-start space-x-2.5 text-xs text-[var(--silver)]">
                    <span className="text-[var(--gold)] mt-0.5">🔧</span>
                    <span>Shimano Certified Mechanics</span>
                  </li>
                  <li className="flex items-start space-x-2.5 text-xs text-[var(--silver)]">
                    <span className="text-[var(--gold)] mt-0.5">⚙️</span>
                    <span>Genuine Spares & Accessories</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/repairing"
                className="w-full text-center py-3 px-6 bg-transparent border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all shadow-md"
              >
                Explore Repair Packages
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* 5. SHOP PREMIUM BRANDS */}
      {config.showBrands !== false && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-10 md:py-16 bg-[var(--charcoal)] border-t border-[var(--steel)]/40"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs uppercase font-sans tracking-[0.25em] font-bold text-[var(--agni)]">
                Brand Hub
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-wide uppercase text-[var(--white)] mt-1">
                SHOP PREMIUM BRANDS
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-2 max-w-xl mx-auto">
                Select a global brand to explore their specialized range of
                high-performance gear in our store.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {brandList.map((brand: any) => (
                <Link
                  key={brand.name}
                  href={brand.href}
                  className="bg-[var(--obsidian)] border border-[var(--steel)]/50 hover:border-[var(--agni)]/40 hover:shadow-agni-glow rounded-xl p-6 flex flex-col justify-between items-center text-center transition-all duration-300 h-44 hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full border border-[var(--steel)]/50 text-[var(--gold)] flex items-center justify-center font-display font-bold text-sm group-hover:border-[var(--agni)]/30 group-hover:text-white transition-colors">
                    {brand.logo.substring(0, 4)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-sans font-bold text-[var(--white)] tracking-wide uppercase group-hover:text-[var(--agni-light)] transition-colors">
                      {brand.name}
                    </h4>
                    <p className="text-[9px] text-neutral-400 font-sans leading-tight">
                      {brand.desc}
                    </p>
                  </div>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-[var(--agni)] group-hover:text-white transition-colors">
                    View Catalog →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 6. STATS BAR */}
      {config.showStats !== false && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="hidden md:block py-14 bg-[var(--obsidian)] border-t border-[var(--steel)]/40"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {(
                config.stats || [
                  { number: "500+", label: "Cycles Delivered" },
                  { number: "4.9★", label: "Customer Rating" },
                  { number: "2-Day", label: "Ranchi Delivery" },
                  { number: "10+", label: "Global Brands Sold" },
                ]
              ).map((stat: any, idx: number) => {
                const colors = [
                  "text-[var(--agni)]",
                  "text-[var(--gold)]",
                  "text-[var(--white)]",
                  "text-[var(--white)]",
                ];
                const colorClass = colors[idx] || "text-[var(--white)]";
                return (
                  <div key={idx}>
                    <p
                      className={`text-3xl md:text-4xl font-display font-bold ${colorClass}`}
                    >
                      {stat.number}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-sans text-neutral-400 mt-1.5">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* 7. TESTIMONIALS CAROUSEL */}
      {config.showTestimonials !== false && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden md:block py-16 max-w-4xl mx-auto px-5 text-center"
        >
          <span className="text-xs uppercase font-sans tracking-[0.25em] font-bold text-[var(--agni)]">
            Rider Diaries
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold uppercase text-[var(--white)] mt-1.5 mb-10">
            WHAT RIDER'S SAY
          </h2>

          <div className="min-h-[260px] flex flex-col justify-between items-center py-2 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="flex justify-center text-[var(--gold)] space-x-1">
                  {Array.from({
                    length: testimonials[activeTestimonial]?.rating || 5,
                  }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className="fill-[var(--gold)] text-[var(--gold)]"
                    />
                  ))}
                </div>
                <p className="text-base sm:text-lg md:text-xl font-sans italic text-[var(--chalk)] leading-relaxed max-w-2xl mx-auto">
                  "{testimonials[activeTestimonial]?.quote}"
                </p>
                <div>
                  <p className="text-sm font-sans font-bold text-[var(--white)]">
                    {testimonials[activeTestimonial]?.author}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">
                    {testimonials[activeTestimonial]?.city}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex space-x-2 pt-8">
              {testimonials.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? "bg-[var(--agni)] w-6"
                      : "bg-[var(--steel)]"
                  }`}
                  title={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 8. INSTAGRAM SOCIAL FEED */}
      {config.showSocial !== false && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-12 md:py-16 bg-[var(--charcoal)] border-t border-[var(--steel)]/40"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs uppercase font-sans tracking-[0.25em] font-bold text-[var(--silver)]">
                Join the Community
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-extrabold uppercase text-[var(--white)] mt-1">
                @VYORAX.IN
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=400&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=400&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=400&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=400&auto=format&fit=crop",
              ].map((imgUrl, i) => (
                <div
                  key={i}
                  className="group aspect-square relative rounded-xl overflow-hidden border border-[var(--steel)]/30 cursor-pointer"
                >
                  <Image
                    src={imgUrl}
                    alt={`Vyorax Social Feed ${i}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Star
                      className="text-white transform scale-90 group-hover:scale-100 transition-transform duration-300"
                      size={20}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
