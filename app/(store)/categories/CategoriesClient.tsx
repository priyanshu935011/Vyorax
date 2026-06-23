"use client";

import { useState } from "react";
import ProductCard from "@/components/store/ProductCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  shortDescription: string;
  stock: number;
  sku: string;
  categoryId: string;
  rating?: number;
  reviewsCount?: number;
}

interface CategoriesClientProps {
  parentCategories: Category[];
  subCategories: Category[];
  products: Product[];
}

export default function CategoriesClient({
  parentCategories,
  subCategories,
  products
}: CategoriesClientProps) {
  const [activeParentTab, setActiveParentTab] = useState<string>(
    parentCategories[0]?.id || ""
  );
  const [activeSubTab, setActiveSubTab] = useState<string>("all");

  const currentSubCats = subCategories.filter(
    (c) => c.parentId === activeParentTab
  );

  const filteredProducts = products.filter((p) => {
    if (activeSubTab !== "all") {
      return p.categoryId === activeSubTab;
    }
    const allowedCategoryIds = [
      activeParentTab,
      ...currentSubCats.map((c) => c.id)
    ];
    return allowedCategoryIds.includes(p.categoryId);
  });

  return (
    <div className="space-y-8">
      {/* Parent Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[var(--steel)]/40 pb-5">
        {parentCategories.map((cat) => {
          const isActive = activeParentTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveParentTab(cat.id);
                setActiveSubTab("all");
              }}
              className={`px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-[var(--white)] text-[var(--obsidian)] border border-[var(--steel)] shadow-sm"
                  : "text-[var(--silver)] border border-[var(--steel)]/60 hover:text-[var(--white)]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Subcategory Filter Capsules */}
      {currentSubCats.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            onClick={() => setActiveSubTab("all")}
            className={`px-3.5 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-full border transition-all ${
              activeSubTab === "all"
                ? "bg-[var(--white)] text-[var(--obsidian)] border-[var(--steel)]"
                : "text-[var(--smoke)] border-[var(--steel)]/45 hover:text-[var(--white)] hover:border-[var(--silver)]"
            }`}
          >
            All
          </button>
          {currentSubCats.map((sub) => {
            const isSubActive = activeSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`px-3.5 py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-full border transition-all ${
                  isSubActive
                    ? "bg-[var(--white)] text-[var(--obsidian)] border-[var(--steel)]"
                    : "text-[var(--smoke)] border-[var(--steel)]/45 hover:text-[var(--white)] hover:border-[var(--silver)]"
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-[var(--steel)]/40 rounded-2xl">
          <p className="text-xs text-[var(--smoke)] uppercase font-sans tracking-wider">
            No products currently available in this category selection.
          </p>
        </div>
      )}
    </div>
  );
}
