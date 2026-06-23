"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    // Redirect search request directly to the products listing page
    if (query) {
      router.replace(`/products?q=${encodeURIComponent(query)}`);
    } else {
      router.replace("/products");
    }
  }, [router, query]);

  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin mx-auto" />
      <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider font-bold">
        Searching the garage...
      </p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="bg-[var(--obsidian)] min-h-[70vh] flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider font-bold">
            Loading search...
          </p>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
