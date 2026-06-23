"use client";

import Link from "next/link";
import { Sparkles, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="hidden md:block bg-[var(--charcoal)] border-t border-[var(--steel)]/60 text-[var(--silver)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        {/* Brand Info */}
        <div className="space-y-4 col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Vyorax Logo"
              className="h-5 object-contain"
            />
          </Link>
          <p className="text-xs leading-relaxed text-[var(--smoke)]">
            A premium cinematic sports & cycles brand designed for the next
            generation of India. Engineered for high performance, born in
            Ranchi, built for the streets of India.
          </p>
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider text-[var(--gold-light)] font-bold">
            <Sparkles size={12} className="animate-pulse" />
            <span>Gen-Z Indian Energy</span>
          </div>
        </div>

        {/* Navigation Categories */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white mb-4">
            Shop Products
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link
                href="/products?category=cycles"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Premium Cycles
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=fitness"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Strength Equipment
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=sports"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Badminton & Accessories
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Browse All Products
              </Link>
            </li>
          </ul>
        </div>

        {/* Feature Triggers */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white mb-4">
            Interactive features
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link
                href="/products"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Find My Frame Size
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Side-by-Side Comparison
              </Link>
            </li>
            <li>
              <Link
                href="/account"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                My Customer Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                className="hover:text-[var(--agni-light)] transition-colors"
              >
                Saved Wishlist Items
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacts */}
        <div className="space-y-3.5 text-xs">
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white mb-4">
            Vyorax Ranchi HQ
          </h4>

          <div className="flex items-start space-x-2.5">
            <MapPin
              size={14}
              className="text-[var(--agni)] mt-0.5 flex-shrink-0"
            />
            <span className="text-[var(--smoke)] leading-relaxed">
              Vyorax, Main Road, Lalpur,
              <br />
              Ranchi, Jharkhand - 834001
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <Phone size={14} className="text-[var(--agni)] flex-shrink-0" />
            <a
              href="https://wa.me/919999999999"
              className="hover:text-white transition-colors"
            >
              +91 99999 99999
            </a>
          </div>

          <div className="flex items-center space-x-2.5">
            <Mail size={14} className="text-[var(--agni)] flex-shrink-0" />
            <a
              href="mailto:support@vyorax.in"
              className="hover:text-white transition-colors"
            >
              support@vyorax.in
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--steel)]/40 py-6 text-center text-[10px] text-[var(--smoke)]">
        <p>
          © {new Date().getFullYear()} Vyorax. All rights reserved. Designed for
          elite performance.
        </p>
      </div>
    </footer>
  );
}
