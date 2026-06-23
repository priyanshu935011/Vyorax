"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

export default function CartPage() {
  const router = useRouter();
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  useEffect(() => {
    // Open the Cart Drawer and redirect to products to keep the slide drawer central
    setIsOpen(true);
    router.replace("/products");
  }, [router, setIsOpen]);

  return (
    <div className="bg-[var(--obsidian)] min-h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin mx-auto" />
        <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider font-bold">
          Redirecting to your cart drawer...
        </p>
      </div>
    </div>
  );
}
