"use client";

import { useEffect, useState } from "react";
import { Check, X, ShieldAlert, Award, Clock, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function AdminWarrantyPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await fetch("/api/admin/warranty");
        if (res.ok) {
          const data = await res.json();
          setClaims(data);
        } else {
          loadMockClaims();
        }
      } catch (e) {
        loadMockClaims();
      } finally {
        setIsLoading(false);
      }
    }

    const loadMockClaims = () => {
      // Mock claims in case DB is offline
      const mock = [
        {
          id: "claim-1",
          orderId: "VYORAX-ORD-938210",
          productName: "Vyorax Aero-X Carbon Cycle",
          serialNo: "AXC-88392-RCH",
          issueDesc: "Slight hairline fracture observed in rear drive-side chainstay after 50km ride.",
          status: "PENDING",
          createdAt: new Date().toISOString(),
          order: {
            guestEmail: "customer@vyorax.in",
            user: { name: "Priyanshu Ranchi", email: "customer@vyorax.in" }
          }
        },
        {
          id: "claim-2",
          orderId: "VYORAX-ORD-104928",
          productName: "Aero Shield Helmet",
          serialNo: "ASH-99120",
          issueDesc: "Retention dial at the back popped out of the tracking harness upon first adjustment.",
          status: "APPROVED",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          order: {
            guestEmail: "anand@vyorax.in",
            user: { name: "Anand Kumar", email: "anand@vyorax.in" }
          }
        }
      ];
      setClaims(mock);
    };

    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/warranty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setClaims(claims.map(c => c.id === id ? { ...c, status: newStatus } : c));
        alert(`Warranty claim status updated to ${newStatus}!`);
      } else {
        alert("Failed to update status. Database response error.");
      }
    } catch (err) {
      // Offline fallback simulation
      setClaims(claims.map(c => c.id === id ? { ...c, status: newStatus } : c));
      alert(`[Simulation] Updated claim status to ${newStatus}`);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[var(--steel)]/40 pb-6">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Warranty claims</h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">Review structural frame failures, gear issues, and process replacements.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-[var(--steel)]/20 pb-4">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
              filter === tab
                ? "bg-[var(--agni)] text-neutral-50"
                : "bg-[var(--carbon)] hover:bg-neutral-800 text-[var(--silver)] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin" />
          <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider animate-pulse">Loading Claims...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--smoke)] border border-dashed border-[var(--steel)]/60 rounded-xl">
          No warranty claims found matching the selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredClaims.map((claim) => {
            const customerName = claim.order?.user?.name || "Guest Customer";
            const customerEmail = claim.order?.user?.email || claim.order?.guestEmail || "";
            const statusClass = 
              claim.status === "APPROVED" 
                ? "bg-[var(--forest)]/10 text-emerald-400 border-emerald-500/20"
                : claim.status === "REJECTED"
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse";

            return (
              <div key={claim.id} className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 space-y-4">
                {/* Top header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--steel)]/30 pb-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-white font-bold">{claim.orderId}</span>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-sans font-bold tracking-widest ${statusClass}`}>
                        {claim.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--smoke)] font-sans">
                      Claim Filed: {new Date(claim.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-sans">
                    <span className="font-bold text-white block">{customerName}</span>
                    <span className="text-[10px] text-[var(--smoke)] font-mono">{customerEmail}</span>
                  </div>
                </div>

                {/* Body details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs font-sans leading-relaxed">
                  <div className="md:col-span-4 space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">Item Claimed</span>
                      <span className="font-semibold text-white">{claim.productName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">Serial/Frame Number</span>
                      <span className="font-mono text-[var(--gold-light)] font-bold">{claim.serialNo}</span>
                    </div>
                  </div>
                  <div className="md:col-span-8">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block mb-1">Issue Description</span>
                    <p className="text-[var(--silver)] bg-[var(--obsidian)] border border-[var(--steel)]/40 p-3 rounded-lg leading-relaxed whitespace-pre-line">
                      {claim.issueDesc}
                    </p>
                  </div>
                </div>

                {/* Admin operations */}
                {claim.status === "PENDING" && (
                  <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--steel)]/30">
                    <button
                      onClick={() => handleUpdateStatus(claim.id, "APPROVED")}
                      className="px-4 py-2 bg-[var(--forest)] hover:bg-emerald-600 text-white rounded text-[10px] font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle2 size={12} />
                      <span>Approve Claim</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(claim.id, "REJECTED")}
                      className="px-4 py-2 border border-red-500 hover:bg-red-500/10 text-red-400 rounded text-[10px] font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                    >
                      <XCircle size={12} />
                      <span>Reject Claim</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
