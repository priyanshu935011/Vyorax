"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  brand: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
}

export default function GlobalSearch({
  isMobileOverlay = false,
  onClose
}: {
  isMobileOverlay?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasFetched, setHasFetched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load search index when input is focused or mobile overlay opens
  const handleFocus = async () => {
    setIsOpen(true);
    if (hasFetched) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/products/search");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setHasFetched(true);
      }
    } catch (error) {
      console.error("Failed to load search index:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMobileOverlay) {
      handleFocus();
      inputRef.current?.focus();
    }
  }, [isMobileOverlay]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset active item index when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Compute matches using useMemo for performance optimization
  const { autocompleteMatches, categorySuggestions, similarProducts } =
    useMemo(() => {
      if (!query.trim()) {
        return {
          autocompleteMatches: [],
          categorySuggestions: [],
          similarProducts: [],
        };
      }
      const q = query.toLowerCase().trim();

      // 1. Direct letter-by-letter matching on product names
      const directMatches = products
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 5);

      // 2. Category / Subcategory matches
      // Match unique category names
      const matchedCategories = Array.from(
        new Set(
          products
            .filter((p) => p.categoryName.toLowerCase().includes(q))
            .map((p) =>
              JSON.stringify({ name: p.categoryName, slug: p.categorySlug }),
            ),
        ),
      ).map((str) => JSON.parse(str)) as { name: string; slug: string }[];

      const catSuggs = matchedCategories
        .map((c) => ({
          text: `${c.name} in Cycles`,
          slug: c.slug,
          isCategory: true,
        }))
        .slice(0, 2);

      // If query matches cycle subcategories like mtb, kids, men, women, let's suggest them
      const subcats = [
        { name: "MTB", slug: "mtb" },
        { name: "Men", slug: "men" },
        { name: "Women", slug: "women" },
        { name: "Kids", slug: "kids" },
        { name: "Electric Cycles", slug: "electric-cycles" },
      ];
      subcats.forEach((sc) => {
        if (
          sc.name.toLowerCase().includes(q) &&
          !catSuggs.some((s) => s.slug === sc.slug)
        ) {
          catSuggs.push({
            text: `${sc.name} Cycles`,
            slug: sc.slug,
            isCategory: true,
          });
        }
      });

      // 3. Similar / related items (similars matching tags or brand)
      const similars = products
        .filter((p) => {
          // Skip direct matches to avoid duplicates
          if (directMatches.some((dm) => dm.id === p.id)) return false;

          return (
            p.brand.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
          );
        })
        .slice(0, 3);

      return {
        autocompleteMatches: directMatches,
        categorySuggestions: catSuggs.slice(0, 3),
        similarProducts: similars,
      };
    }, [query, products]);

  // Combine items for keyboard navigation index
  const allSuggestionsList = [
    ...categorySuggestions.map((c) => ({ type: "category", ...c })),
    ...autocompleteMatches.map((p) => ({ type: "product", ...p })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev + 1 < allSuggestionsList.length ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev - 1 >= 0 ? prev - 1 : allSuggestionsList.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allSuggestionsList.length) {
        const selected = allSuggestionsList[activeIndex];
        if (selected.type === "category") {
          router.push(`/products?category=${selected.slug}`);
        } else {
          router.push(`/products/${selected.slug}`);
        }
        setIsOpen(false);
        onClose?.();
      } else {
        // Search globally
        if (query.trim()) {
          router.push(`/products?q=${encodeURIComponent(query.trim())}`);
          setIsOpen(false);
          onClose?.();
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      onClose?.();
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  // Helper to highlight matched query characters
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(
      `(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <strong key={i} className="text-[var(--agni)] font-bold">
              {part}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isMobileOverlay ? "" : "max-w-sm lg:max-w-md"}`}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input Bar */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search brands, products, gear..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className={`w-full border rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none transition-all duration-300 caret-[var(--agni)] ${
            isMobileOverlay
              ? "bg-[var(--carbon)] border-[var(--steel)]/60 text-[var(--white)] focus:border-[var(--agni)] placeholder-neutral-500"
              : "bg-white/10 border-white/20 hover:border-white/40 focus:border-[var(--agni)] hover:focus:border-[var(--agni)] text-white placeholder-neutral-400 backdrop-blur-md"
          }`}
        />
        <div className="absolute left-3.5 top-3.5 text-neutral-500 dark:text-neutral-400">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-[var(--agni)]" />
          ) : (
            <Search size={16} className={isMobileOverlay ? "text-[var(--silver)]" : "text-neutral-400"} />
          )}
        </div>
        {query && (
          <button
            onClick={handleClear}
            className={`absolute right-3 top-3 p-0.5 rounded-full transition-colors ${
              isMobileOverlay
                ? "hover:bg-neutral-200 text-neutral-500"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            }`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown Overlay */}
      {isOpen && (query.trim() || isLoading || isMobileOverlay) && (
        <div className={
          isMobileOverlay
            ? "w-full mt-4 bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-2xl shadow-md text-neutral-800 max-h-[85vh] overflow-y-auto no-scrollbar"
            : "absolute top-full left-0 right-0 mt-2 bg-[var(--charcoal)] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden text-neutral-800 dark:text-neutral-200 max-h-[480px] overflow-y-auto no-scrollbar"
        }>
          {isLoading && (
            <div className="p-4 flex items-center justify-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              <Loader2 size={14} className="animate-spin text-[var(--agni)]" />
              <span>Fetching retail inventory...</span>
            </div>
          )}

          {!isLoading && !query.trim() && isMobileOverlay && (
            <div className="p-4 space-y-5">
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans mb-3">Popular Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      router.push("/products?category=cycles");
                      onClose?.();
                    }}
                    className="text-left px-3 py-2 border border-[var(--steel)]/60 hover:border-[var(--agni)] hover:text-[var(--agni)] rounded-lg text-xs font-sans font-medium transition-all bg-[var(--carbon)]/35 text-[var(--chalk)]"
                  >
                    🚲 Cycles
                  </button>
                  <button
                    onClick={() => {
                      router.push("/products?category=electric-cycles");
                      onClose?.();
                    }}
                    className="text-left px-3 py-2 border border-[var(--steel)]/60 hover:border-[var(--agni)] hover:text-[var(--agni)] rounded-lg text-xs font-sans font-medium transition-all bg-[var(--carbon)]/35 text-[var(--chalk)]"
                  >
                    ⚡ E-Cycles
                  </button>
                  <button
                    onClick={() => {
                      router.push("/products?category=fitness");
                      onClose?.();
                    }}
                    className="text-left px-3 py-2 border border-[var(--steel)]/60 hover:border-[var(--agni)] hover:text-[var(--agni)] rounded-lg text-xs font-sans font-medium transition-all bg-[var(--carbon)]/35 text-[var(--chalk)]"
                  >
                    💪 Gym Weights & Fitness
                  </button>
                  <button
                    onClick={() => {
                      router.push("/products?category=sports");
                      onClose?.();
                    }}
                    className="text-left px-3 py-2 border border-[var(--steel)]/60 hover:border-[var(--agni)] hover:text-[var(--agni)] rounded-lg text-xs font-sans font-medium transition-all bg-[var(--carbon)]/35 text-[var(--chalk)]"
                  >
                    🏸 Sports Gear
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-sans mb-2.5">Trending Searches</h4>
                <div className="flex flex-wrap gap-2">
                  {["MTB", "Road Bike", "Dumbbells", "Helmet", "Gloves", "Servicing"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        router.push(`/products?q=${encodeURIComponent(term)}`);
                        onClose?.();
                      }}
                      className="px-3 py-1.5 rounded-full border border-[var(--steel)]/60 bg-[var(--carbon)]/40 hover:bg-neutral-100 text-[10px] font-sans font-medium text-[var(--silver)] transition-all"
                    >
                      🔥 {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && allSuggestionsList.length === 0 && query.trim() && (
            <div className="p-5 text-center text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              No direct matches found. Try searching for{" "}
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Trek, Giant, specialized, weights, helmet
              </span>{" "}
              or press enter.
            </div>
          )}

          {/* Matches List */}
          {!isLoading && allSuggestionsList.length > 0 && query.trim() && (
            <div className="py-2">
              {/* Category Recommendations */}
              {categorySuggestions.length > 0 && (
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-1">
                  <div className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
                    Suggested Categories
                  </div>
                  {categorySuggestions.map((s, idx) => {
                    const globalIdx = idx;
                    const isSelected = activeIndex === globalIdx;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => {
                          router.push(`/products?category=${s.slug}`);
                          setIsOpen(false);
                          onClose?.();
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-sans font-medium flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-neutral-100 dark:bg-neutral-800 text-[var(--agni)]"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span className="text-[var(--agni)] font-bold">
                            ➔
                          </span>
                          <span>{s.text}</span>
                        </span>
                        <ArrowRight size={10} className="opacity-60" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Product Direct Suggestions (Letter-by-letter matches) */}
              {autocompleteMatches.length > 0 && (
                <div className="pb-2">
                  <div className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 font-sans">
                    Matching Products
                  </div>
                  {autocompleteMatches.map((p, idx) => {
                    const globalIdx = categorySuggestions.length + idx;
                    const isSelected = activeIndex === globalIdx;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          router.push(`/products/${p.slug}`);
                          setIsOpen(false);
                          onClose?.();
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 transition-colors ${
                          isSelected
                            ? "bg-neutral-100 dark:bg-neutral-800"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        }`}
                      >
                        <div className="relative w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-sans font-bold truncate leading-tight">
                            {renderHighlightedText(p.name, query)}
                          </p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                            {p.brand} • ₹
                            {(p.price / 100).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Similars / Tag Matches (Flipkart/Amazon Similar Items Suggestion) */}
          {!isLoading && similarProducts.length > 0 && query.trim() && (
            <div className="bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 py-3">
              <div className="px-4 text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 font-sans mb-2">
                Similar Items You Might Like
              </div>
              <div className="grid grid-cols-3 gap-2 px-3">
                {similarProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="flex flex-col items-center p-2 rounded bg-[var(--charcoal)] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 hover:border-[var(--agni)]/40 transition-all text-center group"
                  >
                    <div className="relative w-full h-12 mb-1 rounded bg-neutral-50 dark:bg-neutral-800 overflow-hidden">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-contain p-0.5 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[9px] font-sans font-bold text-neutral-700 dark:text-neutral-300 truncate w-full leading-tight">
                      {p.name}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--agni)] font-bold mt-0.5">
                      ₹{(p.price / 100).toLocaleString("en-IN")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Global Search Option */}
          {query.trim() && !isLoading && (
            <button
              onClick={() => {
                router.push(`/products?q=${encodeURIComponent(query.trim())}`);
                setIsOpen(false);
                onClose?.();
              }}
              className="w-full bg-[var(--agni)] hover:bg-[var(--agni-deep)] text-neutral-50 text-center py-2.5 text-xs font-sans font-bold uppercase tracking-wider transition-colors border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-center space-x-1"
            >
              <span>Search All Products for &ldquo;{query}&rdquo;</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
