"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

export default function GlobalNavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset navigation loader when pathname changes (navigation complete)
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Find closest anchor tag
      let target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const download = anchor.getAttribute("download");
      const targetAttr = anchor.getAttribute("target");

      // Skip external links, hashes, downloads, and target="_blank"
      if (
        !href || 
        href.startsWith("#") || 
        href.startsWith("mailto:") || 
        href.startsWith("tel:") ||
        download !== null ||
        targetAttr === "_blank"
      ) {
        return;
      }

      // Check if it's a relative URL or matches current origin
      try {
        const targetUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Only trigger loader when navigating to a different page (pathname change)
        if (
          targetUrl.origin === currentUrl.origin &&
          targetUrl.pathname !== currentUrl.pathname
        ) {
          setIsNavigating(true);
        }
      } catch (err) {
        // Invalid URL
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  if (!mounted || !isNavigating) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[var(--obsidian)] text-[var(--white)] select-none pointer-events-auto">
      <div className="space-y-6 text-center flex flex-col items-center">
        {/* Cinematic Glowing Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--agni)]/10 animate-ping duration-1000" />
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--charcoal)]" />
          <div className="absolute inset-0 rounded-full border-[3px] border-t-[var(--agni)] border-r-[var(--agni)] animate-spin" style={{ animationDuration: "0.6s" }} />
          <div className="absolute inset-4 rounded-full bg-[var(--agni)]/10 blur-[8px] animate-pulse" />
        </div>
        
        {/* Premium Brand Message */}
        <div className="space-y-1">
          <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-[0.25em] font-bold animate-pulse">
            Tuning performance...
          </p>
          <p className="text-[9px] text-[var(--smoke)] font-sans uppercase tracking-[0.15em]">
            VYORAX
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
