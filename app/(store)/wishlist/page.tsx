"use client";

import Link from "next/link";
import { useWishlistStore } from "@/lib/store";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import ProductCard from "@/components/store/ProductCard";
import { Heart, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const wishlistIds = useWishlistStore((state) => state.items);

  // Filter mock products by wishlist IDs
  const wishlistProducts = MOCK_PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="bg-[var(--obsidian)] min-h-screen pt-8 pb-20 text-[var(--white)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase text-white tracking-wider mb-8 border-b border-[var(--steel)]/40 pb-6">
          My Saved Wishlist
        </h1>

        {wishlistProducts.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--steel)]/60 rounded-2xl bg-[var(--charcoal)]">
            <Heart size={48} className="text-[var(--smoke)] mb-4" />
            <h3 className="text-lg font-sans font-bold mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-[var(--smoke)] max-w-xs mb-6">
              Heart cycles or strength training gear to save them to your wishlist lobby.
            </p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded hover:bg-[var(--agni-light)] transition-colors"
            >
              Browse Garage
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
