"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlistStore, useCartStore, usePincodeStore, useSettingsStore } from "@/lib/store";
import { Heart, ShoppingCart } from "lucide-react";
import StarRating from "@/components/shared/StarRating";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number; // in paise
    comparePrice?: number | null;
    images: string[];
    shortDescription: string;
    stock: number;
    sku: string;
    rating?: number; // average rating
    reviewsCount?: number;
    isFeatured?: boolean;
  };
  variant?: "default" | "arched";
}

export default function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { toggleItem, hasItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const isWishlisted = hasItem(product.id);
  const mainImage = product.images[0] || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop";
  const hoverImage = product.images[1] || mainImage;

  const { emiConfig } = useSettingsStore();
  const showEmi = emiConfig?.enabled !== false && product.price >= (emiConfig?.minAmount ?? 300000);

  // Calculate standard 12-month EMI: total / 12 + interest
  const emiAmount = Math.round((product.price * 1.12) / 12);

  const avgRating = product.rating || 5;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  const performAddToCart = () => {
    setIsAdding(true);
    addItemToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: mainImage,
      stock: product.stock,
      sku: product.sku,
    });
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { status, verifiedPincode } = usePincodeStore.getState();

    if (status === "serviceable") {
      performAddToCart();
    } else if (status === "unserviceable") {
      alert(`❌ We currently only deliver to Ranchi zones (834xxx/835xxx). Pincode ${verifiedPincode || ""} is out of our delivery area.`);
    } else {
      // New user, prompt modal
      usePincodeStore.setState({
        isModalOpen: true,
        pendingAddItem: () => performAddToCart(),
      });
    }
  };

  if (variant === "arched") {
    return (
      <div className="group flex flex-col justify-between transition-all duration-300 relative w-full">
        {/* Transparent Overlay Link for Card Navigation */}
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.name}`}
        />

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-20 p-2 rounded-full border transition-all hover:scale-110 shadow-sm backdrop-blur-sm ${
            isWishlisted
              ? "bg-white text-[var(--agni)] border-[var(--agni)]/30"
              : "bg-white/80 text-[var(--silver)] hover:text-[var(--agni)] border-[var(--steel)]/40"
          }`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={14}
            className={isWishlisted ? "fill-[var(--agni)]" : ""}
          />
        </button>

        {/* Product Image Area: Arched container */}
        <div className="w-full aspect-[4/5] rounded-t-full overflow-hidden relative bg-[var(--carbon)] border border-[var(--steel)]/60">
          {/* Main Image */}
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {/* Hover image (second image) */}
          <Image
            src={hoverImage}
            alt={`${product.name} alternate`}
            fill
            className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Slanted "NEW IN" Badge */}
          {product.isFeatured && (
            <div className="absolute top-4 left-4 z-20 -rotate-12 bg-[#E0D7F5] text-black text-[9px] font-sans font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              NEW IN
            </div>
          )}

          {/* Stock Badge */}
          {product.stock === 0 ? (
            <span className="absolute bottom-3 left-3 z-20 px-2 py-0.5 text-[8px] font-sans font-bold tracking-widest uppercase bg-red-600/90 text-neutral-50 rounded">
              Out of Stock
            </span>
          ) : product.stock <= 3 ? (
            <span className="absolute bottom-3 left-3 z-20 px-2 py-0.5 text-[8px] font-sans font-bold tracking-widest uppercase bg-[var(--gold)] text-black rounded animate-pulse">
              Only {product.stock} Left
            </span>
          ) : null}
        </div>

        {/* Details Area */}
        <div className="pt-3 flex-1 flex flex-col justify-between items-center text-center w-full">
          <div className="w-full">
            {/* Rating */}
            <div className="flex justify-center items-center space-x-1 mb-1.5 w-full">
              <StarRating rating={avgRating} size={10} />
              {product.reviewsCount !== undefined && (
                <span className="text-[9px] text-[var(--smoke)] font-mono">({product.reviewsCount})</span>
              )}
            </div>

            <h3 className="text-sm font-sans font-bold text-[var(--white)] group-hover:text-[var(--agni)] transition-colors line-clamp-1 text-center w-full">
              {product.name}
            </h3>
            <p className="text-[11px] text-[var(--smoke)] mt-1 line-clamp-2 leading-tight text-center w-full">
              {product.shortDescription}
            </p>
          </div>

          <div className="mt-2.5 flex items-center justify-center w-full">
            <div className="flex items-baseline justify-center space-x-1.5">
              <span className="text-base font-display font-bold text-[var(--white)]">
                ₹{(product.price / 100).toLocaleString("en-IN")}
              </span>
              {product.comparePrice && (
                <span className="text-[10px] font-display font-medium text-[var(--smoke)] line-through">
                  ₹{(product.comparePrice / 100).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {/* Bubble Outline Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="w-full mt-3 bg-[#ffffff] text-[#000000] font-extrabold text-xs py-2 rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#f3f4f6] disabled:opacity-50 disabled:pointer-events-none z-20 relative"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-agni-glow hover:border-[var(--agni)]/40 relative"
    >
      {/* Transparent Overlay Link for Card Navigation */}
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${product.name}`}
      />

      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlist}
        className={`absolute top-4 right-4 z-20 p-2 rounded-full border transition-all hover:scale-110 shadow-sm backdrop-blur-sm ${
          isWishlisted
            ? "bg-white text-[var(--agni)] border-[var(--agni)]/30"
            : "bg-white/80 text-[var(--silver)] hover:text-[var(--agni)] border-[var(--steel)]/40"
        }`}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart
          size={16}
          className={isWishlisted ? "fill-[var(--agni)]" : ""}
        />
      </button>

      {/* Product Image Area */}
      <div className="w-full aspect-square relative bg-[var(--obsidian)] overflow-hidden">
        {/* Main Image */}
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Hover image (second image) */}
        <Image
          src={hoverImage}
          alt={`${product.name} alternate`}
          fill
          className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Quick Add Overlay on Hover (Desktop only) */}
        <div className="hidden md:flex absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end justify-center pb-6">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold tracking-wider uppercase rounded shadow-lg transition-transform translate-y-4 group-hover:translate-y-0 duration-300 ease-out disabled:opacity-85"
          >
            {isAdding ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>

        {/* Stock Badge */}
        {product.stock === 0 ? (
          <span className="absolute bottom-4 left-4 z-20 px-2.5 py-1 text-[9px] font-sans font-bold tracking-widest uppercase bg-red-600/90 text-neutral-50 rounded">
            Out of Stock
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute bottom-4 left-4 z-20 px-2.5 py-1 text-[9px] font-sans font-bold tracking-widest uppercase bg-[var(--gold)] text-black rounded animate-pulse">
            Only {product.stock} Left
          </span>
        ) : null}
      </div>

      {/* Details Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center space-x-1.5 mb-2.5">
            <StarRating rating={avgRating} size={12} />
            {product.reviewsCount !== undefined && (
              <span className="text-[10px] text-[var(--smoke)] font-mono">({product.reviewsCount})</span>
            )}
          </div>

          <h3 className="text-base font-sans font-bold text-[var(--white)] group-hover:text-[var(--agni-light)] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-[var(--smoke)] mt-1.5 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        <div className="mt-5 pt-3.5 border-t border-[var(--steel)]/30 flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-display font-bold text-[var(--white)]">
                ₹{(product.price / 100).toLocaleString("en-IN")}
              </span>
              {product.comparePrice && (
                <span className="text-xs font-display font-medium text-[var(--smoke)] line-through">
                  ₹{(product.comparePrice / 100).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {/* EMI tag */}
            {showEmi && (
              <p className="text-[10px] text-[var(--gold-light)] font-sans mt-0.5">
                EMI as low as <strong className="font-bold">₹{(emiAmount / 100).toLocaleString("en-IN")}/mo</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
