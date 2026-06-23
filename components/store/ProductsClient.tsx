"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import { Grid, List, SlidersHorizontal, RotateCcw, Search, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/lib/store";

interface ProductsClientProps {
  initialProducts: any[];
  categories: any[];
}

export default function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { emiConfig } = useSettingsStore();

  // Read URL params
  const activeCategory = searchParams.get("category") || "all";
  const activeSegment = searchParams.get("segment") || "all";
  const activeSort = searchParams.get("sort") || "featured";
  const minPriceParam = searchParams.get("minPrice") || "0";
  const maxPriceParam = searchParams.get("maxPrice") || "50000"; // in Rupees
  const onlyInStock = searchParams.get("inStock") === "true";
  const searchQ = searchParams.get("q") || "";

  // Local state for UI toggles
  const [isListView, setIsListView] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(searchQ);

  // Get unique brands
  const brands = useMemo(() => {
    const list = initialProducts.map((p) => p.brand).filter(Boolean);
    return Array.from(new Set(list)) as string[];
  }, [initialProducts]);

  const activeBrand = searchParams.get("brand") || "all";

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category Filter
    if (activeCategory !== "all") {
      const parentCat = categories.find((c) => c.slug.toLowerCase() === activeCategory.toLowerCase());
      const childCategories = parentCat
        ? categories.filter((c) => c.parentId === parentCat.id)
        : [];
      const allowedSlugs = [
        activeCategory.toLowerCase(),
        ...childCategories.map((c) => c.slug.toLowerCase()),
      ];
      result = result.filter(
        (p) => allowedSlugs.includes(p.categorySlug?.toLowerCase())
      );
    }

    // Segment Filter
    if (activeSegment !== "all") {
      result = result.filter(
        (p) => p.tags?.some((t: string) => t?.toLowerCase() === activeSegment.toLowerCase()) ||
               p.name?.toLowerCase()?.includes(activeSegment.toLowerCase()) ||
               p.description?.toLowerCase()?.includes(activeSegment.toLowerCase())
      );
    }

    // Brand Filter
    if (activeBrand !== "all") {
      result = result.filter((p) => p.brand?.toLowerCase() === activeBrand.toLowerCase());
    }

    // Price Filter (convert parameters from Rupees to Paise for comparison)
    const minPaise = parseInt(minPriceParam) * 100;
    const maxPaise = parseInt(maxPriceParam) * 100;
    result = result.filter((p) => p.price >= minPaise && p.price <= maxPaise);

    // In Stock Filter
    if (onlyInStock) {
      result = result.filter((p) => p.stock > 0);
    }

    // Search query Filter
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase()?.includes(q) ||
          p.shortDescription?.toLowerCase()?.includes(q) ||
          p.tags?.some((t: string) => t?.toLowerCase()?.includes(q))
      );
    }

    // Sort operations
    if (activeSort === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSort === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // "featured" retains original DB/mock order

    return result;
  }, [initialProducts, activeCategory, activeSegment, activeBrand, minPriceParam, maxPriceParam, onlyInStock, searchQ, activeSort]);

  // URL Helper
  const setURLParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "" || (key === "inStock" && value === "false")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchVal("");
    router.push(pathname);
  };

  return (
    <div className="bg-[var(--obsidian)] min-h-screen text-[var(--white)] pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--steel)]/40 pb-8 mb-8">
          <div>
            <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Rider Store</span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase text-white mt-1">
              THE VEGA GARAGE
            </h1>
          </div>
          
          {/* Search Box */}
          <div className="mt-4 md:mt-0 relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search cycles, gear..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setURLParam("q", searchVal)}
              className="w-full bg-[var(--charcoal)] border border-[var(--steel)] rounded-lg px-4 py-2.5 pl-10 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-[var(--smoke)]" />
          </div>
        </div>

        {/* Toolbar (Mobile filter toggle + View mode + Sorting) */}
        <div className="flex items-center justify-between bg-[var(--charcoal)] border border-[var(--steel)]/50 rounded-xl p-4 mb-8">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center space-x-2 text-xs font-sans font-bold tracking-wider uppercase text-white hover:text-[var(--agni)]"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          {/* Desktop Summary info */}
          <div className="hidden md:block text-xs font-sans text-[var(--silver)]">
            Showing <strong className="text-white">{filteredProducts.length}</strong> of{" "}
            {initialProducts.length} products
          </div>

          <div className="flex items-center space-x-4">
            {/* Sorting Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--smoke)] font-bold">Sort By</span>
              <select
                value={activeSort}
                onChange={(e) => setURLParam("sort", e.target.value)}
                className="bg-[var(--obsidian)] border border-[var(--steel)] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">New Releases</option>
              </select>
            </div>

            {/* Grid/List Toggle */}
            <div className="hidden sm:flex items-center border border-[var(--steel)] rounded overflow-hidden">
              <button
                onClick={() => setIsListView(false)}
                className={`p-2 transition-colors ${
                  !isListView ? "bg-[var(--agni)] text-neutral-50" : "hover:bg-[var(--carbon)] text-[var(--silver)]"
                }`}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setIsListView(true)}
                className={`p-2 transition-colors ${
                  isListView ? "bg-[var(--agni)] text-neutral-50" : "hover:bg-[var(--carbon)] text-[var(--silver)]"
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
            {/* Categories */}
            <div className="border-b border-[var(--steel)]/30 pb-6">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white mb-4">Category</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setURLParam("category", "all")}
                  className={`block text-xs font-sans text-left transition-colors ${
                    activeCategory === "all" ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                  }`}
                >
                  All Categories
                </button>
                {categories.filter(c => !c.parentId).map((cat) => {
                  const subCats = categories.filter(c => c.parentId === cat.id);
                  return (
                    <div key={cat.id} className="space-y-1">
                      <button
                        onClick={() => setURLParam("category", cat.slug)}
                        className={`block text-xs font-sans text-left transition-colors capitalize ${
                          activeCategory === cat.slug ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                        }`}
                      >
                        {cat.name}
                      </button>
                      {subCats.length > 0 && (
                        <div className="pl-3 border-l border-[var(--steel)]/25 space-y-1 py-0.5 ml-1">
                          {subCats.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setURLParam("category", sub.slug)}
                              className={`block text-[11px] font-sans text-left transition-colors capitalize ${
                                activeCategory === sub.slug ? "text-[var(--agni)] font-bold" : "text-[var(--smoke)] hover:text-white"
                              }`}
                            >
                              ↳ {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Segments */}
            <div className="border-b border-[var(--steel)]/30 pb-6">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white mb-4">Segment</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setURLParam("segment", "all")}
                  className={`block text-xs font-sans text-left transition-colors ${
                    activeSegment === "all" ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                  }`}
                >
                  All Segments
                </button>
                {["men", "women", "kids"].map((seg) => (
                  <button
                    key={seg}
                    onClick={() => setURLParam("segment", seg)}
                    className={`block text-xs font-sans text-left transition-colors capitalize ${
                      activeSegment === seg ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter (Rupees slider) */}
            <div className="border-b border-[var(--steel)]/30 pb-6">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white mb-4">Price Range</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={maxPriceParam}
                  onChange={(e) => setURLParam("maxPrice", e.target.value)}
                  className="w-full accent-[var(--agni)]"
                />
                <div className="flex items-center justify-between text-xs font-mono text-[var(--silver)]">
                  <span>₹0</span>
                  <span className="text-white font-bold">Up to ₹{parseInt(maxPriceParam).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div className="border-b border-[var(--steel)]/30 pb-6">
                <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white mb-4">Brand</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setURLParam("brand", "all")}
                    className={`block text-xs font-sans text-left transition-colors ${
                      activeBrand === "all" ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setURLParam("brand", brand)}
                      className={`block text-xs font-sans text-left transition-colors capitalize ${
                        activeBrand === brand ? "text-[var(--agni)] font-bold" : "text-[var(--silver)] hover:text-white"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In Stock toggle */}
            <div className="pb-6">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white mb-4">Availability</h3>
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-sans text-[var(--silver)] hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setURLParam("inStock", e.target.checked ? "true" : "false")}
                  className="rounded border-[var(--steel)] bg-[var(--charcoal)] text-[var(--agni)] focus:ring-0 focus:ring-offset-0"
                />
                <span>Exclude Out of Stock</span>
              </label>
            </div>

            {/* Reset Filters */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-2 py-2.5 border border-[var(--steel)] hover:border-white rounded text-xs font-sans font-bold tracking-wider uppercase transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </aside>

          {/* PRODUCTS LISTING CONTAINER */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--steel)]/60 rounded-2xl">
                <span className="text-4xl mb-4">🔍</span>
                <h3 className="text-lg font-sans font-bold mb-1">No products match your filters</h3>
                <p className="text-sm text-[var(--smoke)] max-w-xs mb-6">
                  Try adjusting your price range, search query, or checking other categories.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-bold tracking-widest uppercase hover:bg-[var(--agni-light)] rounded transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  isListView
                    ? "space-y-6"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                }
              >
                {filteredProducts.map((product) => {
                  if (isListView) {
                    // List rendering view
                    const showEmi = emiConfig?.enabled !== false && product.price >= (emiConfig?.minAmount ?? 300000);
                    const emiAmount = Math.round((product.price * 1.12) / 12);
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex flex-col sm:flex-row bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden hover:border-[var(--agni)]/40 hover:shadow-agni-glow transition-all duration-300 group"
                      >
                        <div className="w-full sm:w-48 aspect-square relative bg-[var(--obsidian)] flex-shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-sans font-bold text-white group-hover:text-[var(--agni-light)] transition-colors">
                                {product.name}
                              </h3>
                              <span className="text-xs text-[var(--smoke)] font-mono uppercase">
                                SKU: {product.sku}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--silver)] mt-2 leading-relaxed max-w-xl">
                              {product.shortDescription}
                            </p>
                          </div>
                          
                          <div className="mt-6 flex flex-row items-baseline justify-between border-t border-[var(--steel)]/30 pt-4">
                            <div>
                              <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-display font-bold text-white">
                                  ₹{(product.price / 100).toLocaleString("en-IN")}
                                </span>
                                {product.comparePrice && (
                                  <span className="text-xs font-display font-medium text-[var(--smoke)] line-through">
                                    ₹{(product.comparePrice / 100).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                              {showEmi && (
                                <p className="text-[10px] text-[var(--gold-light)] mt-1 font-sans">
                                  Pay as low as <strong>₹{(emiAmount / 100).toLocaleString("en-IN")}/mo</strong>
                                </p>
                              )}
                            </div>
                            <span className="text-xs uppercase font-bold tracking-widest text-[var(--agni)] group-hover:text-white transition-colors">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  } else {
                    return <ProductCard key={product.id} product={product} />;
                  }
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MOBILE DRAWER FILTERS */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-50 h-full w-full max-w-xs bg-[var(--charcoal)] p-6 border-r border-[var(--steel)] flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--steel)]/60">
                  <h2 className="text-sm font-sans font-bold uppercase tracking-wider text-white">Filter Garage</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="text-[var(--silver)] hover:text-white">
                    ✕
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-sans tracking-widest text-[var(--smoke)] font-bold">Category</h3>
                  <button
                    onClick={() => {
                      setURLParam("category", "all");
                      setMobileFiltersOpen(false);
                    }}
                    className={`block text-xs font-sans text-left transition-colors capitalize ${
                      activeCategory === "all" ? "text-[var(--agni)] font-bold" : "text-[var(--silver)]"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.filter(c => !c.parentId).map((cat) => {
                    const subCats = categories.filter(c => c.parentId === cat.id);
                    return (
                      <div key={cat.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setURLParam("category", cat.slug);
                            setMobileFiltersOpen(false);
                          }}
                          className={`block text-xs font-sans text-left transition-colors capitalize ${
                            activeCategory === cat.slug ? "text-[var(--agni)] font-bold" : "text-[var(--silver)]"
                          }`}
                        >
                          {cat.name}
                        </button>
                        {subCats.length > 0 && (
                          <div className="pl-3 border-l border-[var(--steel)]/25 space-y-1 ml-1">
                            {subCats.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setURLParam("category", sub.slug);
                                  setMobileFiltersOpen(false);
                                }}
                                className={`block text-[11px] font-sans text-left transition-colors capitalize ${
                                  activeCategory === sub.slug ? "text-[var(--agni)] font-bold" : "text-[var(--smoke)]"
                                }`}
                              >
                                ↳ {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Segments */}
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-sans tracking-widest text-[var(--smoke)] font-bold">Segment</h3>
                  <button
                    onClick={() => {
                      setURLParam("segment", "all");
                      setMobileFiltersOpen(false);
                    }}
                    className={`block text-xs font-sans text-left transition-colors ${
                      activeSegment === "all" ? "text-[var(--agni)] font-bold" : "text-[var(--silver)]"
                    }`}
                  >
                    All Segments
                  </button>
                  {["men", "women", "kids"].map((seg) => (
                    <button
                      key={seg}
                      onClick={() => {
                        setURLParam("segment", seg);
                        setMobileFiltersOpen(false);
                      }}
                      className={`block text-xs font-sans text-left transition-colors capitalize ${
                        activeSegment === seg ? "text-[var(--agni)] font-bold" : "text-[var(--silver)]"
                      }`}
                    >
                      {seg}
                    </button>
                  ))}
                </div>

                {/* Price */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase font-sans tracking-widest text-[var(--smoke)] font-bold">Max Price</h3>
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="1000"
                    value={maxPriceParam}
                    onChange={(e) => setURLParam("maxPrice", e.target.value)}
                    className="w-full accent-[var(--agni)]"
                  />
                  <div className="text-xs font-sans text-[var(--silver)] font-bold">
                    Up to ₹{parseInt(maxPriceParam).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase font-sans tracking-widest text-[var(--smoke)] font-bold">Availability</h3>
                  <label className="flex items-center space-x-2.5 text-xs text-[var(--silver)] select-none">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setURLParam("inStock", e.target.checked ? "true" : "false")}
                      className="rounded border-[var(--steel)] bg-[var(--charcoal)] text-[var(--agni)] focus:ring-0"
                    />
                    <span>Exclude Out of Stock</span>
                  </label>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <button
                  onClick={() => {
                    handleReset();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-2.5 border border-[var(--steel)] text-white text-xs font-sans font-bold uppercase tracking-wider rounded"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
