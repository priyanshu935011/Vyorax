"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  const mouseCoords = useRef({ x: 0, y: 0 });
  const ringCoords = useRef({ x: 0, y: 0 });
  
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState<"normal" | "hover" | "image">("normal");

  const cursorTypeRef = useRef(cursorType);
  useEffect(() => {
    cursorTypeRef.current = cursorType;
  }, [cursorType]);

  useEffect(() => {
    // Disable custom cursor on touch/mobile devices
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;

    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseCoords.current = { x: e.clientX, y: e.clientY };
      
      // Update dot position immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    // Track hovered elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check if hovering a clickable element
      const isClickable = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.closest("button") || 
        target.closest("a") ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("role") === "button";

      // Check if hovering an image
      const isImage = target.tagName === "IMG" || target.closest(".cursor-drag-trigger");

      if (isImage) {
        setCursorType("image");
      } else if (isClickable) {
        setCursorType("hover");
      } else {
        setCursorType("normal");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("mouseover", onMouseOver);

    // Spring physics animation loop for the outer ring
    let animationId: number;
    const updateRing = () => {
      // Lerp (Linear Interpolation) formula: current += (target - current) * factor
      const lerpFactor = 0.15;
      ringCoords.current.x += (mouseCoords.current.x - ringCoords.current.x) * lerpFactor;
      ringCoords.current.y += (mouseCoords.current.y - ringCoords.current.y) * lerpFactor;

      if (ringRef.current) {
        // Offset the ring based on its current size
        const currentType = cursorTypeRef.current;
        const size = currentType === "hover" ? 48 : currentType === "image" ? 56 : 32;
        ringRef.current.style.transform = `translate3d(${ringCoords.current.x - size / 2}px, ${ringCoords.current.y - size / 2}px, 0)`;
      }

      animationId = requestAnimationFrame(updateRing);
    };

    animationId = requestAnimationFrame(updateRing);

    // Add class to body to hide standard cursor
    document.body.classList.add("custom-cursor-active");

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animationId);
      document.body.classList.remove("custom-cursor-active");
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Inner Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] bg-[var(--agni)] transition-transform duration-75 ease-out"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      />
      {/* Outer Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out border flex items-center justify-center ${
          cursorType === "hover"
            ? "w-12 h-12 bg-[var(--agni-glow)] border-[var(--agni)]"
            : cursorType === "image"
            ? "w-14 h-14 bg-[var(--agni)]/20 border-[var(--agni)] border-dashed"
            : "w-8 h-8 bg-transparent border-[var(--agni)]/30"
        }`}
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {cursorType === "image" && (
          <span className="text-[10px] text-[var(--white)] font-sans font-bold tracking-wider uppercase">
            Drag
          </span>
        )}
      </div>
    </>
  );
}
