"use client";

import { useState, useEffect } from "react";
import { usePincodeStore } from "@/lib/store";
import { X, MapPin, Loader2, AlertCircle } from "lucide-react";

export default function PincodeModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    status,
    deliveryMessage,
    checkPincode,
    pendingAddItem,
    setPendingAddItem,
  } = usePincodeStore();

  const [pincode, setPincode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setPincode("");
      setLocalError(null);
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!pincode || pincode.trim().length !== 6 || isNaN(Number(pincode))) {
      setLocalError("Please enter a valid 6-digit pincode.");
      return;
    }

    setLoading(true);
    const success = await checkPincode(pincode);
    setLoading(false);

    if (success) {
      if (pendingAddItem) {
        pendingAddItem();
        setPendingAddItem(null);
      }
      setIsModalOpen(false);
    }
  };

  const handleClose = () => {
    setPendingAddItem(null);
    setIsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl shadow-agni-glow overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--steel)]/40 bg-[var(--obsidian)]/55">
          <div className="flex items-center space-x-2">
            <MapPin size={18} className="text-[var(--agni)]" />
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white">
              Check Delivery Pincode
            </h3>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1 rounded-lg hover:bg-[var(--steel)]/25 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-[var(--smoke)] font-sans leading-relaxed">
            We deliver exclusively to Ranchi zones (<strong>834xxx / 835xxx</strong>). Please verify your pincode availability first.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                Delivery Pincode
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit Pincode (e.g. 834001)"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ""));
                  setLocalError(null);
                }}
                className="w-full bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-xl px-4 py-3 text-center font-mono text-sm tracking-widest focus:outline-none focus:border-[var(--agni)] text-white placeholder-neutral-600"
              />
              {/* Free delivery threshold subtext */}
              <p className="text-[10px] text-[var(--gold-light)] font-sans text-center mt-1">
                🚚 Free delivery on orders above ₹5,000 (Min purchase)
              </p>
            </div>

            {/* Error Message */}
            {(localError || (status === "unserviceable" && deliveryMessage)) && (
              <div className="flex items-start space-x-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-sans">
                <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={14} />
                <span>{localError || deliveryMessage}</span>
              </div>
            )}

            {/* Checking Status */}
            {status === "checking" && (
              <div className="flex items-center justify-center space-x-2 text-xs text-[var(--smoke)] py-1.5 font-sans">
                <Loader2 className="animate-spin text-[var(--agni)]" size={14} />
                <span>Verifying Ranchi availability...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pincode.length !== 6}
              className="w-full py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:bg-[var(--steel)]/50 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <span>Verify & Add to Cart</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
