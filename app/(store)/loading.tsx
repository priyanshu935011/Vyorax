"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Loading() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[var(--obsidian)] text-[var(--white)] select-none pointer-events-auto">
      <div className="space-y-6 text-center flex flex-col items-center">
        {/* Cinematic Glowing Spinner */}
        <div className="relative w-16 h-16">
          {/* Outermost glowing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[var(--agni)]/10 animate-ping duration-1000" />
          {/* Middle spinning track */}
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--charcoal)]" />
          {/* Active spinning indicator */}
          <div className="absolute inset-0 rounded-full border-[3px] border-t-[var(--agni)] border-r-[var(--agni)] animate-spin" style={{ animationDuration: "0.6s" }} />
          {/* Inner core glow */}
          <div className="absolute inset-4 rounded-full bg-[var(--agni)]/10 blur-[8px] animate-pulse" />
        </div>
        
        {/* Premium Brand Message */}
        <div className="space-y-1.5 flex flex-col items-center">
          <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-[0.25em] font-bold animate-pulse">
            Tuning performance...
          </p>
          <img
            src="/logo.png"
            alt="Vyorax Logo"
            className="h-4 w-auto object-contain opacity-60"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
