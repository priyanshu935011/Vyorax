"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if the loader has already been shown in this session
    const hasLoaded = sessionStorage.getItem("vega_loaded");
    if (hasLoaded === "true") {
      setLoading(false);
      return;
    }

    // Set a timer to finish loading after 1.5s (brand moment)
    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("vega_loaded", "true");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;
  if (!loading) return null;

  // Stagger children config
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const letterVariants = {
    initial: { y: -50, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 10,
        stiffness: 100
      }
    },
  };

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.4, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[var(--obsidian)] select-none pointer-events-auto"
        >
          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src="/logo.png"
              alt="Vyorax Logo"
              className="h-20 md:h-28 w-auto object-contain"
            />
          </motion.div>

          {/* Loading Bar */}
          <div className="w-48 h-1 bg-[var(--charcoal)] rounded-full overflow-hidden relative">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "0%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 left-0 w-full bg-[var(--agni)]"
            />
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 text-xs font-sans tracking-[0.2em] uppercase text-[var(--chalk)]"
          >
            Born in Ranchi. Built for India.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
