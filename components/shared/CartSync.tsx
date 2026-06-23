"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store";

export default function CartSync() {
  const { data: session, status } = useSession();
  const { items, setItems, clearCart } = useCartStore();
  const hasMergedRef = useRef<boolean>(false);
  const prevItemsRef = useRef<any[]>(items);
  const prevStatusRef = useRef<string>(status);

  // Sync / Merge on login
  useEffect(() => {
    // If transitioning from logged in to logged out, clear cart data to protect user privacy
    if (prevStatusRef.current === "authenticated" && status === "unauthenticated") {
      clearCart();
      localStorage.removeItem("vega_applied_coupon");
      hasMergedRef.current = false;
    }
    
    const wasUnauthenticated = prevStatusRef.current === "unauthenticated";
    prevStatusRef.current = status;

    if (status === "authenticated" && session?.user?.id) {
      if (!hasMergedRef.current) {
        // Mark as merged immediately to prevent duplicate fetch calls
        hasMergedRef.current = true;
        
        if (wasUnauthenticated) {
          // Sync local storage guest cart items to the database
          const localItems = items.filter(item => !item.isGift);
          
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: localItems.map(item => ({ id: item.id, quantity: item.quantity })),
              action: "merge",
            }),
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Failed to merge cart");
            })
            .then((mergedItems) => {
              // Update Zustand store with database-merged cart items
              setItems(mergedItems);
              prevItemsRef.current = mergedItems;
            })
            .catch((err) => {
              console.error("Cart merge error:", err);
              // Allow retry if database merge fails
              hasMergedRef.current = false;
            });
        } else {
          // Direct load / refresh: fetch source of truth from database and overwrite local store
          fetch("/api/cart")
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Failed to fetch database cart");
            })
            .then((dbItems) => {
              setItems(dbItems);
              prevItemsRef.current = dbItems;
            })
            .catch((err) => {
              console.error("Cart fetch error:", err);
              // Fallback to local storage items as is
              prevItemsRef.current = items;
            });
        }
      }
    } else if (status === "unauthenticated") {
      hasMergedRef.current = false;
    }
  }, [status, session, items, setItems, clearCart]);

  // Sync changes to DB when cart items change with 500ms debounce (only for logged-in users after initial merge)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && hasMergedRef.current) {
      const actualPrev = prevItemsRef.current.filter(item => !item.isGift);
      const actualCurrent = items.filter(item => !item.isGift);
      
      const isSame = 
        actualPrev.length === actualCurrent.length &&
        actualPrev.every((p) => {
          const match = actualCurrent.find((c) => c.id === p.id);
          return match && match.quantity === p.quantity;
        });

      if (!isSame) {
        prevItemsRef.current = items;
        
        const handler = setTimeout(() => {
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: actualCurrent.map(item => ({ id: item.id, quantity: item.quantity })),
              action: "replace",
            }),
          })
            .then((res) => {
              if (!res.ok) console.warn("Failed to sync cart updates to DB");
            })
            .catch((err) => console.error("Cart sync update error:", err));
        }, 500);

        return () => clearTimeout(handler);
      }
    }
  }, [items, status, session]);

  return null;
}
