"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Check,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Eye,
  Layout,
  Wrench,
  Settings,
  BarChart,
  ShoppingBag,
  MessageSquare,
} from "lucide-react";
import { MOCK_SLIDES, DEFAULT_HOMEPAGE_CONFIG } from "@/lib/mockData";

type TabName = "layout" | "slides" | "bento" | "stats" | "brands";

export default function AdminHomepageConfigPage() {
  const [activeTab, setActiveTab] = useState<TabName>("layout");
  const [config, setConfig] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Slides Form States
  const [slideFormId, setSlideFormId] = useState<string | null>(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideSubtitle, setSlideSubtitle] = useState("");
  const [slideDesc, setSlideDesc] = useState("");
  const [slideImage, setSlideImage] = useState("");
  const [slideCtaText, setSlideCtaText] = useState("");
  const [slideCtaHref, setSlideCtaHref] = useState("");
  const [slideAccent, setSlideAccent] = useState("var(--agni)");
  const [slideBgGradient, setSlideBgGradient] = useState(
    "from-orange-600/20 via-neutral-900/5 to-transparent",
  );
  const [slideOrder, setSlideOrder] = useState<number>(0);
  const [slideIsActive, setSlideIsActive] = useState(true);

  // Brands Form States
  const [brandEditIdx, setBrandEditIdx] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [brandHref, setBrandHref] = useState("");

  // Load configuration and slides on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load homepage config
        const configRes = await fetch("/api/admin/homepage");
        let activeConfig = null;
        if (configRes.ok) {
          activeConfig = await configRes.json();
        }

        // Load slides
        const slidesRes = await fetch("/api/admin/slides");
        let loadedSlides = null;
        if (slidesRes.ok) {
          loadedSlides = await slidesRes.json();
        }

        if (activeConfig) {
          setConfig(activeConfig);
          setIsSimulationMode(false);
        } else {
          loadSimulationConfig();
        }

        if (loadedSlides) {
          setSlides(loadedSlides);
        } else {
          loadSimulationSlides();
        }
      } catch (error) {
        console.warn(
          "DB offline or unauthorized. Falling back to local/mock simulation.",
        );
        loadSimulationConfig();
        loadSimulationSlides();
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const loadSimulationConfig = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_homepage_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        setConfig(DEFAULT_HOMEPAGE_CONFIG);
      }
    } else {
      setConfig(DEFAULT_HOMEPAGE_CONFIG);
      localStorage.setItem(
        "vega_sim_homepage_config",
        JSON.stringify(DEFAULT_HOMEPAGE_CONFIG),
      );
    }
  };

  const loadSimulationSlides = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_slides");
    if (saved) {
      try {
        setSlides(JSON.parse(saved));
      } catch (e) {
        setSlides(MOCK_SLIDES);
      }
    } else {
      setSlides(MOCK_SLIDES);
      localStorage.setItem("vega_sim_slides", JSON.stringify(MOCK_SLIDES));
    }
  };

  // Save full layout configuration
  const handleSaveConfig = async (updatedConfig: any) => {
    setConfig(updatedConfig);
    if (isSimulationMode) {
      localStorage.setItem(
        "vega_sim_homepage_config",
        JSON.stringify(updatedConfig),
      );
      alert("Simulated homepage config updated locally!");
    } else {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/homepage", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ homepageConfig: updatedConfig }),
        });
        if (res.ok) {
          alert("Homepage configuration saved to database successfully!");
        } else {
          alert(
            "Failed to save homepage config. Falling back to local preview.",
          );
          localStorage.setItem(
            "vega_sim_homepage_config",
            JSON.stringify(updatedConfig),
          );
        }
      } catch (e: any) {
        alert("Failed to save. Offline mode: saved to local preview.");
        localStorage.setItem(
          "vega_sim_homepage_config",
          JSON.stringify(updatedConfig),
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Slides CRUD Helpers
  const handleEditSlideClick = (slide: any) => {
    setSlideFormId(slide.id);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideDesc(slide.desc);
    setSlideImage(slide.image);
    setSlideCtaText(slide.ctaText);
    setSlideCtaHref(slide.ctaHref);
    setSlideAccent(slide.accent || "var(--agni)");
    setSlideBgGradient(
      slide.bgGradient || "from-orange-600/20 via-neutral-900/5 to-transparent",
    );
    setSlideOrder(Number(slide.order) || 0);
    setSlideIsActive(slide.isActive !== undefined ? slide.isActive : true);
  };

  const handleCancelSlideEdit = () => {
    setSlideFormId(null);
    setSlideTitle("");
    setSlideSubtitle("");
    setSlideDesc("");
    setSlideImage("");
    setSlideCtaText("");
    setSlideCtaHref("");
    setSlideAccent("var(--agni)");
    setSlideBgGradient("from-orange-600/20 via-neutral-900/5 to-transparent");
    setSlideOrder(0);
    setSlideIsActive(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: slideFormId,
      title: slideTitle.trim(),
      subtitle: slideSubtitle.trim(),
      desc: slideDesc.trim(),
      image: slideImage.trim(),
      ctaText: slideCtaText.trim(),
      ctaHref: slideCtaHref.trim(),
      accent: slideAccent.trim(),
      bgGradient: slideBgGradient.trim(),
      order: Number(slideOrder),
      isActive: slideIsActive,
    };

    if (isSimulationMode) {
      let updatedList = [...slides];
      if (slideFormId) {
        updatedList = updatedList.map((s) =>
          s.id === slideFormId ? { ...s, ...payload } : s,
        );
        alert("Slide simulated update successfully!");
      } else {
        const newSlide = {
          ...payload,
          id: `slide-sim-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        updatedList.push(newSlide);
        alert("New slide simulated creation successful!");
      }
      updatedList.sort((a, b) => a.order - b.order);
      setSlides(updatedList);
      localStorage.setItem("vega_sim_slides", JSON.stringify(updatedList));
      handleCancelSlideEdit();
    } else {
      setIsLoading(true);
      try {
        const method = slideFormId ? "PUT" : "POST";
        const res = await fetch("/api/admin/slides", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const savedSlide = await res.json();
          let updatedList = [...slides];
          if (slideFormId) {
            updatedList = updatedList.map((s) =>
              s.id === slideFormId ? savedSlide : s,
            );
            alert("Slide updated successfully!");
          } else {
            updatedList.push(savedSlide);
            alert("New slide created successfully!");
          }
          updatedList.sort((a, b) => a.order - b.order);
          setSlides(updatedList);
          handleCancelSlideEdit();
        } else {
          alert("Failed to save slide database record.");
        }
      } catch (err: any) {
        alert("Failed to save slide: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteSlide = async (slide: any) => {
    if (!confirm(`Are you sure you want to delete the slide "${slide.title}"?`))
      return;

    if (isSimulationMode) {
      const updatedList = slides.filter((s) => s.id !== slide.id);
      setSlides(updatedList);
      localStorage.setItem("vega_sim_slides", JSON.stringify(updatedList));
      alert("Slide simulated deletion completed.");
    } else {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/slides?id=${slide.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setSlides(slides.filter((s) => s.id !== slide.id));
          alert("Slide removed successfully from database.");
        } else {
          alert("Failed to delete slide.");
        }
      } catch (err: any) {
        alert("Failed to delete slide: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!config) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-[var(--carbon)] min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--steel)]/60 border-t-[var(--agni)] animate-spin" />
        <p className="text-xs text-[var(--smoke)] font-sans uppercase font-bold tracking-widest animate-pulse">
          Loading Homepage Configurations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[var(--obsidian)] border border-[var(--steel)]/60 p-6 md:p-8 rounded-2xl min-h-screen text-[var(--white)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--steel)]/50 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-wide">
            Homepage Manager
          </h1>
          <p className="text-xs text-[var(--smoke)] font-sans mt-1">
            Configure layout sections, edit stats, brands, collections, and
            manage slider image banners.
          </p>
        </div>
        {isSimulationMode && (
          <div className="flex items-center space-x-2 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-xl px-4 py-2 text-xs text-[var(--gold-light)] font-sans">
            <ShieldAlert size={14} className="text-amber-500 flex-shrink-0" />
            <span className="font-bold">
              Preview Mode: Saved to local storage
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--steel)]/60 overflow-x-auto gap-2">
        {(
          [
            { id: "layout", label: "Layout Sections", icon: Layout },
            { id: "slides", label: "Hero Banners", icon: ImageIcon },
            { id: "bento", label: "Bento Collections", icon: Sliders },
            { id: "stats", label: "Stats Bar", icon: BarChart },
            { id: "brands", label: "Partner Brands", icon: Sparkles },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-sans font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? "border-[var(--agni)] text-[var(--agni)] font-extrabold"
                  : "border-transparent text-[var(--smoke)] hover:text-white hover:border-[var(--steel)]/80"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* 1. LAYOUT TOGGLES */}
        {activeTab === "layout" && (
          <div className="space-y-6">
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/40 pb-3 mb-6">
                Active Layout Sections
              </h3>
              <p className="text-xs text-[var(--smoke)] font-sans mb-6">
                Toggle which sections are visible on the storefront homepage
                landing page.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    key: "showSlider",
                    label: "Hero Slider Banner",
                    desc: "Top slideshow displaying active promotional slides.",
                  },
                  {
                    key: "showBento",
                    label: "Bento Categories Grid",
                    desc: "Interactive grid of product arenas and shop collections.",
                  },
                  {
                    key: "showBrands",
                    label: "Shop by Brand",
                    desc: "Carousel listing premium brand partners.",
                  },
                  {
                    key: "showShowcase",
                    label: "Hot Picks Showroom",
                    desc: "Highlighted detail slider for trending products.",
                  },
                  {
                    key: "showServices",
                    label: "Workshop & Servicing",
                    desc: "Highlight servicing bookings and repairs.",
                  },
                  {
                    key: "showProducts",
                    label: "Featured Products",
                    desc: "Showcases items flagged as featured in database.",
                  },
                  {
                    key: "showStats",
                    label: "Corporate Stats Bar",
                    desc: "Highlights cycle delivery stats, rates, and rating.",
                  },
                  {
                    key: "showTestimonials",
                    label: "Customer Diaries",
                    desc: "Auto-playing testimonial review cards.",
                  },
                  {
                    key: "showSocial",
                    label: "Instagram Social Gallery",
                    desc: "Grid showcasing social feeds/posts.",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start p-4 border border-[var(--steel)]/60 rounded-xl hover:bg-[var(--carbon)] transition-all cursor-pointer select-none group"
                  >
                    <input
                      type="checkbox"
                      checked={config[item.key] !== false}
                      onChange={(e) => {
                        const updated = {
                          ...config,
                          [item.key]: e.target.checked,
                        };
                        handleSaveConfig(updated);
                      }}
                      className="w-4 h-4 rounded mt-1 text-[var(--agni)] border-[var(--steel)]/80 focus:ring-[var(--agni)]"
                    />
                    <div className="ml-3">
                      <span className="text-xs font-sans font-bold uppercase text-[var(--chalk)] tracking-wide group-hover:text-white">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[var(--smoke)] block mt-1 leading-normal">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. HERO SLIDES CRUD */}
        {activeTab === "slides" && (
          <div className="space-y-8">
            {/* Visual Live Preview */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--steel)]/40 pb-3">
                <Eye size={16} className="text-[var(--agni)]" />
                <h3 className="text-sm font-sans font-bold uppercase text-white">
                  Live Banner Preview
                </h3>
              </div>
              <div
                className="relative min-h-[250px] rounded-xl overflow-hidden border border-[var(--steel)]/60 flex items-center p-8 bg-cover bg-center transition-all duration-500"
                style={{
                  backgroundImage: `url(${slideImage || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1600"})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-neutral-900/30" />
                <div className="relative z-10 max-w-lg space-y-3.5">
                  <span
                    className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded bg-black/60 border border-white/10"
                    style={{
                      color: slideAccent || "var(--agni)",
                      borderColor: `${slideAccent}33`,
                    }}
                  >
                    {slideSubtitle || "SUBTITLE PREVIEW CONTENT"}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
                    {slideTitle || "Slide Title Preview"}
                  </h2>
                  <p className="text-xs md:text-sm text-neutral-300 font-sans max-w-sm line-clamp-3">
                    {slideDesc ||
                      "Provide a short description highlighting discount offers, products features, or launch events that will capture buyer attention."}
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded text-xs uppercase font-bold tracking-wider text-black transition-transform active:scale-95 duration-200"
                    style={{ backgroundColor: slideAccent || "var(--agni)" }}
                  >
                    {slideCtaText || "Explore"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form */}
              <div className="lg:col-span-5 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center space-x-2 border-b border-[var(--steel)]/40 pb-3">
                  <Sliders size={16} className="text-[var(--agni)]" />
                  <h3 className="text-sm font-sans font-bold uppercase text-white">
                    {slideFormId
                      ? "Edit Slider Banner"
                      : "Create Slider Banner"}
                  </h3>
                </div>

                <form onSubmit={handleSaveSlide} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                      Slide Title
                    </label>
                    <input
                      type="text"
                      required
                      value={slideTitle}
                      onChange={(e) => setSlideTitle(e.target.value)}
                      placeholder="e.g. Giant Aero-X & Trek MTBs"
                      className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                      Slide Subtitle
                    </label>
                    <input
                      type="text"
                      required
                      value={slideSubtitle}
                      onChange={(e) => setSlideSubtitle(e.target.value)}
                      placeholder="e.g. UP TO 20% OFF ON GLOBAL PERFORMANCE CYCLES"
                      className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                      Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={slideDesc}
                      onChange={(e) => setSlideDesc(e.target.value)}
                      placeholder="Slide description details..."
                      className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                      Banner Image URL
                    </label>
                    <input
                      type="text"
                      required
                      value={slideImage}
                      onChange={(e) => setSlideImage(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        required
                        value={slideCtaText}
                        onChange={(e) => setSlideCtaText(e.target.value)}
                        placeholder="e.g. Explore"
                        className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                        CTA Button Link
                      </label>
                      <input
                        type="text"
                        required
                        value={slideCtaHref}
                        onChange={(e) => setSlideCtaHref(e.target.value)}
                        placeholder="e.g. /products?category=cycles"
                        className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                        Accent Color
                      </label>
                      <input
                        type="text"
                        value={slideAccent}
                        onChange={(e) => setSlideAccent(e.target.value)}
                        placeholder="e.g. var(--agni) or #FF4500"
                        className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                        BG Gradient Class
                      </label>
                      <input
                        type="text"
                        value={slideBgGradient}
                        onChange={(e) => setSlideBgGradient(e.target.value)}
                        placeholder="Tailwind gradient classes"
                        className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                        Display Order
                      </label>
                      <input
                        type="number"
                        required
                        value={slideOrder}
                        onChange={(e) => setSlideOrder(Number(e.target.value))}
                        placeholder="e.g. 0"
                        className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end pb-2.5">
                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={slideIsActive}
                          onChange={(e) => setSlideIsActive(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--agni)] border-[var(--steel)]/80 focus:ring-[var(--agni)] cursor-pointer"
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--smoke)]">
                          Slide Active
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-grow px-4 py-2.5 bg-[var(--agni)] hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow"
                    >
                      {slideFormId ? "Update Slide" : "Create Slide"}
                    </button>
                    {slideFormId && (
                      <button
                        type="button"
                        onClick={handleCancelSlideEdit}
                        className="px-4 py-2.5 bg-[var(--carbon)] hover:bg-[var(--steel)] border border-[var(--steel)]/80 text-[var(--silver)] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--steel)]/40 pb-3">
                  <div className="flex items-center space-x-2">
                    <ImageIcon size={16} className="text-[var(--agni)]" />
                    <h3 className="text-sm font-sans font-bold uppercase text-white">
                      Slider Banners ({slides.length})
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {slides.map((slide) => (
                    <div
                      key={slide.id}
                      className={`border ${
                        slideFormId === slide.id
                          ? "border-[var(--agni)] bg-[var(--agni)]/10/20"
                          : "border-[var(--steel)]/60 hover:border-[var(--steel)]/80"
                      } rounded-xl p-4 transition-all flex space-x-4`}
                    >
                      <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-[var(--carbon)] border border-[var(--steel)]/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/80 px-1 rounded text-[8px] font-mono text-white">
                          Ord: {slide.order}
                        </div>
                      </div>

                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[var(--chalk)] truncate">
                              {slide.title}
                            </h4>
                            {slide.isActive ? (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                                title="Active"
                              />
                            ) : (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-neutral-300 inline-block"
                                title="Inactive"
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--smoke)] line-clamp-1 mt-0.5">
                            {slide.desc}
                          </p>
                          <span className="text-[8px] font-mono text-[var(--smoke)] mt-1 block">
                            cta: [{slide.ctaText}] ➔ {slide.ctaHref}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--steel)]/40 mt-2">
                          <div className="flex items-center space-x-3">
                            <span
                              className="text-[8px] uppercase tracking-wider font-bold"
                              style={{ color: slide.accent }}
                            >
                              Accent
                            </span>
                            <span
                              className="text-[8px] font-mono text-[var(--smoke)] truncate max-w-[120px]"
                              title={slide.bgGradient}
                            >
                              BG: {slide.bgGradient}
                            </span>
                          </div>

                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditSlideClick(slide)}
                              className="p-1.5 hover:bg-[var(--carbon)] rounded text-[var(--smoke)] hover:text-[var(--chalk)] transition-colors"
                              title="Edit Banner"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                              title="Delete Banner"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {slides.length === 0 && (
                    <div className="py-12 text-center text-xs text-[var(--smoke)] font-sans">
                      No slides found. Create one using the form on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. BENTO GRID COLLECTIONS */}
        {activeTab === "bento" && (
          <div className="space-y-6">
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/40 pb-3 mb-2">
                  Bento Grid Collections (Rider Collections)
                </h3>
                <p className="text-xs text-[var(--smoke)] font-sans">
                  Modify details for the 4 core collections featured in the
                  Bento Arena grid on the homepage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(config.collections || []).map((col: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-[var(--steel)]/60 rounded-xl p-5 bg-[var(--carbon)]/50 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-[var(--steel)]/60 pb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[var(--agni)]">
                        Arena 0{idx + 1}
                      </span>
                      <span className="text-[9px] bg-neutral-200 text-[var(--smoke)] px-2 py-0.5 rounded font-mono font-bold">
                        {col.gridSpan || "Default Span"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Collection Name
                        </label>
                        <input
                          type="text"
                          value={col.name}
                          onChange={(e) => {
                            const newCols = [...config.collections];
                            newCols[idx] = {
                              ...newCols[idx],
                              name: e.target.value,
                            };
                            handleSaveConfig({
                              ...config,
                              collections: newCols,
                            });
                          }}
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                          Description
                        </label>
                        <textarea
                          value={col.desc}
                          rows={2}
                          onChange={(e) => {
                            const newCols = [...config.collections];
                            newCols[idx] = {
                              ...newCols[idx],
                              desc: e.target.value,
                            };
                            handleSaveConfig({
                              ...config,
                              collections: newCols,
                            });
                          }}
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                            Target Link
                          </label>
                          <input
                            type="text"
                            value={col.href}
                            onChange={(e) => {
                              const newCols = [...config.collections];
                              newCols[idx] = {
                                ...newCols[idx],
                                href: e.target.value,
                              };
                              handleSaveConfig({
                                ...config,
                                collections: newCols,
                              });
                            }}
                            className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                            Photo URL
                          </label>
                          <input
                            type="text"
                            value={col.image}
                            onChange={(e) => {
                              const newCols = [...config.collections];
                              newCols[idx] = {
                                ...newCols[idx],
                                image: e.target.value,
                              };
                              handleSaveConfig({
                                ...config,
                                collections: newCols,
                              });
                            }}
                            className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. STATS BAR CONFIG */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/40 pb-3 mb-2">
                  Corporate Stats Metrics
                </h3>
                <p className="text-xs text-[var(--smoke)] font-sans">
                  Edit the 4 core metrics highlighted in the homepage stats bar.
                  Make sure to keep the text short.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(config.stats || []).map((stat: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-[var(--steel)]/60 rounded-xl p-4 bg-[var(--carbon)]/50 space-y-3"
                  >
                    <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[var(--smoke)]">
                      Metric 0{idx + 1}
                    </span>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[var(--smoke)]">
                          Stat Value
                        </label>
                        <input
                          type="text"
                          value={stat.number}
                          onChange={(e) => {
                            const newStats = [...config.stats];
                            newStats[idx] = {
                              ...newStats[idx],
                              number: e.target.value,
                            };
                            handleSaveConfig({ ...config, stats: newStats });
                          }}
                          placeholder="e.g. 500+"
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] font-bold focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[var(--smoke)]">
                          Stat Label
                        </label>
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...config.stats];
                            newStats[idx] = {
                              ...newStats[idx],
                              label: e.target.value,
                            };
                            handleSaveConfig({ ...config, stats: newStats });
                          }}
                          placeholder="e.g. Cycles Delivered"
                          className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. PARTNER BRANDS CATALOG */}
        {activeTab === "brands" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-5 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-2 border-b border-[var(--steel)]/40 pb-3">
                <Sparkles size={16} className="text-[var(--agni)]" />
                <h3 className="text-sm font-sans font-bold uppercase text-white">
                  {brandEditIdx !== null
                    ? "Edit Partner Brand"
                    : "Add Partner Brand"}
                </h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const payload = {
                    name: brandName.trim(),
                    logo: brandLogo.trim().toUpperCase(),
                    desc: brandDesc.trim(),
                    href: brandHref.trim(),
                  };

                  let list = [...(config.brands || [])];
                  if (brandEditIdx !== null) {
                    list[brandEditIdx] = payload;
                    alert("Partner brand updated successfully!");
                  } else {
                    list.push(payload);
                    alert("New brand added to catalog successfully!");
                  }

                  handleSaveConfig({ ...config, brands: list });

                  // Reset
                  setBrandEditIdx(null);
                  setBrandName("");
                  setBrandLogo("");
                  setBrandDesc("");
                  setBrandHref("");
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Trek"
                    className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                    Logo Short Text (4 letters max)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    placeholder="e.g. TREK"
                    className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                    Tagline / Short Desc
                  </label>
                  <input
                    type="text"
                    required
                    value={brandDesc}
                    onChange={(e) => setBrandDesc(e.target.value)}
                    placeholder="e.g. Premium Mountain & Road Bikes"
                    className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                    Catalog Catalog Link (relative/absolute)
                  </label>
                  <input
                    type="text"
                    required
                    value={brandHref}
                    onChange={(e) => setBrandHref(e.target.value)}
                    placeholder="e.g. /products?brand=Trek"
                    className="w-full bg-[var(--charcoal)] border border-[var(--steel)]/80 rounded-lg px-3.5 py-2.5 text-xs text-[var(--chalk)] focus:outline-none focus:border-[var(--agni)] placeholder-neutral-400"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-grow px-4 py-2.5 bg-[var(--agni)] hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow"
                  >
                    {brandEditIdx !== null ? "Update Brand" : "Add Brand"}
                  </button>
                  {brandEditIdx !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrandEditIdx(null);
                        setBrandName("");
                        setBrandLogo("");
                        setBrandDesc("");
                        setBrandHref("");
                      }}
                      className="px-4 py-2.5 bg-[var(--carbon)] hover:bg-[var(--steel)] border border-[var(--steel)]/80 text-[var(--silver)] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--steel)]/40 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-[var(--agni)]" />
                  <h3 className="text-sm font-sans font-bold uppercase text-white">
                    Brands Catalog ({config.brands?.length || 0})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(config.brands || []).map((brand: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border ${
                      brandEditIdx === idx
                        ? "border-[var(--agni)] bg-[var(--agni)]/10/20"
                        : "border-[var(--steel)]/60 hover:border-[var(--steel)]/80"
                    } rounded-xl p-4 flex flex-col justify-between h-40 bg-[var(--carbon)]/20`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-[var(--carbon)] border border-[var(--steel)]/60 text-[var(--smoke)] flex items-center justify-center font-display font-bold text-[10px]">
                        {brand.logo ? brand.logo.substring(0, 4) : "LOGO"}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setBrandEditIdx(idx);
                            setBrandName(brand.name);
                            setBrandLogo(brand.logo);
                            setBrandDesc(brand.desc);
                            setBrandHref(brand.href);
                          }}
                          className="p-1 hover:bg-[var(--carbon)] rounded text-[var(--smoke)] hover:text-[var(--chalk)] transition-colors"
                          title="Edit Brand"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              !confirm(
                                `Are you sure you want to remove "${brand.name}"?`,
                              )
                            )
                              return;
                            const list = (config.brands || []).filter(
                              (_: any, i: number) => i !== idx,
                            );
                            handleSaveConfig({ ...config, brands: list });
                          }}
                          className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mt-3">
                      <h4 className="text-xs font-sans font-bold text-[var(--chalk)] uppercase tracking-wide truncate">
                        {brand.name}
                      </h4>
                      <p className="text-[10px] text-[var(--smoke)] line-clamp-1 leading-normal">
                        {brand.desc}
                      </p>
                      <span className="text-[8px] font-mono text-[var(--smoke)] block truncate mt-1">
                        link: {brand.href}
                      </span>
                    </div>
                  </div>
                ))}

                {(config.brands || []).length === 0 && (
                  <div className="col-span-2 py-12 text-center text-xs text-[var(--smoke)] font-sans">
                    No brands found in your catalog. Add one on the left.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
