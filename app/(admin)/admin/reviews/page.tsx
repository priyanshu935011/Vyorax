"use client";

import { useState, useEffect } from "react";
import { 
  Star, CheckCircle, Eye, EyeOff, Trash2, ShieldCheck, MessageSquare, AlertCircle
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setIsSimulationMode(false);
      } else {
        loadSimulationData();
      }
    } catch (e) {
      console.warn("Reviews Admin GET failed. Loading simulation fallback.");
      loadSimulationData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_reviews");
    
    const mockReviews = [
      {
        id: "rev-mock-1",
        productId: "prod-aero-x",
        product: { name: "Vyorax Aero-X Carbon Cycle", sku: "VYORAX-CYC-AEROX" },
        guestName: "Priyanshu Ranchi",
        rating: 5,
        title: "Smooth Riding",
        body: "Excellent Product, Fast Delivery. The carbon frame is exceptionally stiff and responsive.",
        images: ["https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=600&auto=format&fit=crop"],
        verified: true,
        isApproved: true,
        seen: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "rev-mock-video",
        productId: "prod-aero-x",
        product: { name: "Vyorax Aero-X Carbon Cycle", sku: "VYORAX-CYC-AEROX" },
        guestName: "Sumit Ranchi",
        rating: 5,
        title: "Stunning Trail Performance!",
        body: "Took the Aero-X up the Jonha falls trail zone this weekend. The suspension dampening is brilliant. Check out my unboxing video!",
        images: [
          "https://www.w3schools.com/html/mov_bbb.mp4",
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop"
        ],
        verified: true,
        isApproved: true,
        seen: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "rev-mock-2",
        productId: "prod-aero-helmet",
        product: { name: "Aero Shield Helmet", sku: "VEGA-ACC-HELM" },
        guestName: "Anand Kumar",
        rating: 4,
        title: "Good Quality",
        body: "Value for Money. The sizing is exact and the aerodynamic visor is very useful.",
        images: [],
        verified: true,
        isApproved: false,
        seen: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force refresh if the rich media mock is missing
        if (!parsed.some((r: any) => r.id === "rev-mock-video")) {
          throw new Error("Seed rich media");
        }
        setReviews(parsed);
      } catch (e) {
        setReviews(mockReviews);
        localStorage.setItem("vega_sim_reviews", JSON.stringify(mockReviews));
        window.dispatchEvent(new Event("vega_admin_reviews_updated"));
      }
    } else {
      setReviews(mockReviews);
      localStorage.setItem("vega_sim_reviews", JSON.stringify(mockReviews));
      window.dispatchEvent(new Event("vega_admin_reviews_updated"));
    }
  };

  const handleMarkSeen = async (id: string) => {
    if (isSimulationMode) {
      const updated = reviews.map((r) => r.id === id ? { ...r, seen: true } : r);
      setReviews(updated);
      localStorage.setItem("vega_sim_reviews", JSON.stringify(updated));
      window.dispatchEvent(new Event("vega_admin_reviews_updated"));
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview({ ...selectedReview, seen: true });
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "mark_seen" }),
      });
      if (res.ok) {
        setReviews(reviews.map((r) => r.id === id ? { ...r, seen: true } : r));
        window.dispatchEvent(new Event("vega_admin_reviews_updated"));
        if (selectedReview && selectedReview.id === id) {
          setSelectedReview({ ...selectedReview, seen: true });
        }
      }
    } catch (e) {
      alert("Error marking review as seen");
    }
  };

  const handleToggleApproval = async (id: string) => {
    const reviewToUpdate = reviews.find((r) => r.id === id);
    if (!reviewToUpdate) return;

    if (isSimulationMode) {
      const updated = reviews.map((r) => r.id === id ? { ...r, isApproved: !r.isApproved } : r);
      setReviews(updated);
      localStorage.setItem("vega_sim_reviews", JSON.stringify(updated));
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview({ ...selectedReview, isApproved: !reviewToUpdate.isApproved });
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "toggle_approval" }),
      });
      if (res.ok) {
        setReviews(reviews.map((r) => r.id === id ? { ...r, isApproved: !r.isApproved } : r));
        if (selectedReview && selectedReview.id === id) {
          setSelectedReview({ ...selectedReview, isApproved: !reviewToUpdate.isApproved });
        }
      }
    } catch (e) {
      alert("Error toggling review approval");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    if (isSimulationMode) {
      const updated = reviews.filter((r) => r.id !== id);
      setReviews(updated);
      localStorage.setItem("vega_sim_reviews", JSON.stringify(updated));
      window.dispatchEvent(new Event("vega_admin_reviews_updated"));
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview(null);
      }
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReviews(reviews.filter((r) => r.id !== id));
        window.dispatchEvent(new Event("vega_admin_reviews_updated"));
        if (selectedReview && selectedReview.id === id) {
          setSelectedReview(null);
        }
      }
    } catch (e) {
      alert("Error deleting review");
    }
  };

  const handleMarkAllSeen = async () => {
    if (isSimulationMode) {
      const updated = reviews.map((r) => ({ ...r, seen: true }));
      setReviews(updated);
      localStorage.setItem("vega_sim_reviews", JSON.stringify(updated));
      window.dispatchEvent(new Event("vega_admin_reviews_updated"));
      return;
    }

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_seen" }),
      });
      if (res.ok) {
        setReviews(reviews.map((r) => ({ ...r, seen: true })));
        window.dispatchEvent(new Event("vega_admin_reviews_updated"));
      }
    } catch (e) {
      alert("Error marking all reviews as seen");
    }
  };

  const unseenReviews = reviews.filter((r) => !r.seen);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--steel)]/40 pb-6">
        <div>
          <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">Control panel</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-white mt-1.5 flex items-center gap-2">
            Rider Reviews
            {unseenReviews.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-red-600 text-white animate-pulse">
                {unseenReviews.length} New
              </span>
            )}
          </h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">
            Manage customer feedback, toggle public approvals, and verify ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unseenReviews.length > 0 && (
            <button
              onClick={handleMarkAllSeen}
              className="px-4 py-2 border border-[var(--steel)] hover:border-white text-white text-[10px] font-sans font-bold uppercase rounded-lg tracking-wide transition-all bg-[var(--charcoal)]"
            >
              Mark All As Seen
            </button>
          )}
          <button
            onClick={loadReviews}
            className="px-4 py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-[10px] font-sans font-bold uppercase rounded-lg tracking-wide transition-all shadow-agni-glow"
          >
            Refresh
          </button>
        </div>
      </div>

      {isSimulationMode && (
        <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/20 p-4 rounded-xl text-xs text-[var(--gold-light)] flex items-start space-x-3 font-sans">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="uppercase">Sandbox Simulator Active:</strong>
            <p className="mt-0.5 leading-relaxed">
              Database offline. Changes are saved to local storage (`vega_sim_reviews`) for instant storefront presentation testing.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-[var(--charcoal)] border border-dashed border-[var(--steel)]/60 rounded-2xl text-xs text-[var(--smoke)] font-sans">
          No product reviews have been submitted by customers yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reviews list grid (Lg 7cols) */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.map((rev) => {
              const isSelected = selectedReview?.id === rev.id;
              const hasMedia = rev.images && rev.images.length > 0;
              return (
                <div
                  key={rev.id}
                  onClick={() => {
                    setSelectedReview(rev);
                    if (!rev.seen) {
                      handleMarkSeen(rev.id);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-xs font-sans relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-[var(--carbon)] border-[var(--agni)] shadow-agni-glow"
                      : "bg-[var(--charcoal)] border-[var(--steel)]/60 hover:border-[var(--steel)]"
                  } ${!rev.seen ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--smoke)] uppercase font-mono block">
                        Product: {rev.product?.name || "Unseeded Product"}
                      </span>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                        {rev.title}
                        {!rev.seen && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-red-600 text-white rounded font-bold uppercase">
                            New
                          </span>
                        )}
                        {rev.verified && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-[var(--forest)]/20 border border-emerald-500/20 text-emerald-400 rounded font-bold uppercase">
                            Verified
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex space-x-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={s < rev.rating ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--steel)]"}
                            size={12}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-[var(--smoke)]">
                        {new Date(rev.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <p className="text-[var(--silver)] leading-relaxed line-clamp-2 mb-4">
                    {rev.body}
                  </p>

                  <div className="flex justify-between items-center border-t border-[var(--steel)]/20 pt-3 text-[10px] font-bold uppercase tracking-wide text-[var(--smoke)]">
                    <div className="flex items-center gap-2">
                      <span>By: {rev.guestName || "Verified Rider"}</span>
                      {hasMedia && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[var(--carbon)] rounded text-[var(--silver)]">
                          📸 Media Included
                        </span>
                      )}
                    </div>
                    
                    <span className={rev.isApproved ? "text-emerald-400" : "text-amber-500"}>
                      {rev.isApproved ? "Publicly Approved" : "Awaiting Approval"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details & Actions Panel (Lg 5cols) */}
          <div className="lg:col-span-5 sticky top-8">
            {selectedReview ? (
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-6">
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-[var(--steel)]/30 pb-4">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-white uppercase">
                      Review Insights
                    </h3>
                    <span className="text-[9px] font-mono text-[var(--smoke)] block mt-0.5">
                      ID: {selectedReview.id}
                    </span>
                  </div>
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={s < selectedReview.rating ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--steel)]"}
                        size={14}
                      />
                    ))}
                  </div>
                </div>

                {/* Review info */}
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[var(--smoke)] block">
                      Product Name
                    </span>
                    <p className="text-white font-semibold mt-0.5">
                      {selectedReview.product?.name || "Unseeded Product"}
                    </p>
                    <span className="text-[9px] font-mono text-[var(--smoke)] mt-0.5 block">
                      SKU: {selectedReview.product?.sku || "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-[var(--smoke)] block">
                      Reviewer Details
                    </span>
                    <p className="text-white font-semibold mt-0.5">
                      {selectedReview.guestName || "Verified Rider"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {selectedReview.verified && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-[var(--forest)]/20 border border-emerald-500/20 text-emerald-400 rounded font-bold uppercase inline-block">
                          Verified Purchaser
                        </span>
                      )}
                      {selectedReview.seen && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-[var(--carbon)] border border-[var(--steel)]/60 text-[var(--silver)] rounded font-bold uppercase inline-block">
                          Seen
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[var(--carbon)]/30 border border-[var(--steel)]/20 p-4 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-bold text-[var(--smoke)] block">
                      Title: "{selectedReview.title}"
                    </span>
                    <p className="text-[var(--silver)] leading-relaxed italic">
                      "{selectedReview.body || "No text description provided."}"
                    </p>
                  </div>

                  {/* Render uploaded media */}
                  {selectedReview.images && selectedReview.images.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-[var(--smoke)] block">
                        Uploaded Media
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedReview.images.map((url: string, index: number) => {
                          const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|flv|mkv|3gp|wmv|m4v)(?:\?|$)/) || url.includes("/video/upload/") || url.includes("/video/");
                          return (
                            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--steel)]/30 bg-[var(--obsidian)]">
                              {isVideo ? (
                                <div className="w-full h-full relative cursor-zoom-in" onClick={() => window.open(url, "_blank")}>
                                  <video 
                                    src={url} 
                                    muted
                                    autoPlay
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white">
                                      <span className="text-[8px] pl-0.5">▶</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(url, "_blank")} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-[var(--steel)]/30 flex flex-col gap-2.5">
                  <button
                    onClick={() => handleToggleApproval(selectedReview.id)}
                    className={`w-full py-2.5 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 ${
                      selectedReview.isApproved
                        ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20"
                        : "bg-[var(--forest)]/20 hover:bg-[var(--forest)]/30 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {selectedReview.isApproved ? (
                      <>
                        <EyeOff size={13} />
                        <span>Revoke Public Approval</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>Approve For Storefront</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteReview(selectedReview.id)}
                    className="w-full py-2.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-500/20 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Delete Review</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 text-center text-xs text-[var(--smoke)] font-sans">
                Select a review card to view detailed messages and perform administrative options.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
