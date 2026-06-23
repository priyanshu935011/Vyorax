"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Download,
  Search,
  Users,
  ExternalLink,
  RefreshCw,
  Gift,
} from "lucide-react";
import Link from "next/link";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  // Bulk Points Award states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkExpiryDays, setBulkExpiryDays] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  const staticFallback = [
    {
      id: "customer@vegasports.in",
      name: "Priyanshu Ranchi",
      email: "customer@vegasports.in",
      phone: "8888888888",
      ordersCount: 2,
      totalSpent: 7225000,
      joined: "2026-06-01",
      isGuest: false,
    },
    {
      id: "anand@gmail.com",
      name: "Anand Kumar",
      email: "anand@gmail.com",
      phone: "9928392810",
      ordersCount: 1,
      totalSpent: 2450000,
      joined: "2026-06-02",
      isGuest: true,
    },
    {
      id: "rita@gmail.com",
      name: "Rita Kumari",
      email: "rita@gmail.com",
      phone: "7729102910",
      ordersCount: 1,
      totalSpent: 1599900,
      joined: "2026-06-04",
      isGuest: true,
    },
    {
      id: "vikram@gmail.com",
      name: "Vikram Singh",
      email: "vikram@gmail.com",
      phone: "9102910291",
      ordersCount: 1,
      totalSpent: 1199900,
      joined: "2026-06-05",
      isGuest: true,
    },
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
        setIsSimulationMode(false);
      } else {
        loadSimulationData();
      }
    } catch (e) {
      console.warn(
        "Customers API failed. Falling back to local storage simulation.",
      );
      loadSimulationData();
    } finally {
      setIsLoading(false);
    }
  }

  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_customers");
    if (saved) {
      try {
        setCustomers(JSON.parse(saved));
      } catch (e) {
        setCustomers(staticFallback);
      }
    } else {
      setCustomers(staticFallback);
      localStorage.setItem(
        "vega_sim_customers",
        JSON.stringify(staticFallback),
      );
    }
  };

  async function handleBulkPointsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkAmount || isNaN(Number(bulkAmount)) || Number(bulkAmount) <= 0) {
      alert("Please enter a valid positive points amount.");
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const res = await fetch("/api/admin/customers/bulk-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(bulkAmount),
          expiryDays: bulkExpiryDays ? Number(bulkExpiryDays) : null,
          reason: bulkReason.trim() || undefined,
          isSimulation: isSimulationMode,
        }),
      });

      if (res.ok) {
        if (isSimulationMode) {
          // Update simulated customer list points in local storage
          const simCustStr = localStorage.getItem("vega_sim_customers") || "[]";
          let simCust = JSON.parse(simCustStr);
          if (simCust.length === 0) simCust = [...staticFallback];

          const updatedSimCust = simCust.map((c: any) => ({
            ...c,
            vegaPoints: (c.vegaPoints || 0) + Number(bulkAmount),
          }));
          localStorage.setItem(
            "vega_sim_customers",
            JSON.stringify(updatedSimCust),
          );

          // Log simulated transactions
          const simTxsStr =
            localStorage.getItem("vega_sim_transactions") || "[]";
          const simTxs = JSON.parse(simTxsStr);
          updatedSimCust.forEach((c: any) => {
            simTxs.unshift({
              id: `tx-sim-bulk-${Date.now()}-${c.id}`,
              userId: c.id,
              amount: Number(bulkAmount),
              remainingAmount: Number(bulkAmount),
              type: "MANUAL_ADD",
              reason: bulkReason.trim() || "Bulk manual distribution by admin",
              expiresAt: bulkExpiryDays
                ? new Date(
                    Date.now() + Number(bulkExpiryDays) * 24 * 60 * 60 * 1000,
                  ).toISOString()
                : null,
              createdAt: new Date().toISOString(),
            });
          });
          localStorage.setItem("vega_sim_transactions", JSON.stringify(simTxs));

          // Also update vega_sim_points (for active customer sandbox otp account)
          const activeCust = updatedSimCust.find(
            (c: any) => c.phone === "8888888888",
          );
          if (activeCust) {
            localStorage.setItem(
              "vega_sim_points",
              activeCust.vegaPoints.toString(),
            );
          }
        }

        alert("Bulk points distributed successfully!");
        setIsBulkModalOpen(false);
        setBulkAmount("");
        setBulkExpiryDays("");
        setBulkReason("");
        loadCustomers();
      } else {
        const err = await res.text();
        alert(`Failed to distribute bulk points: ${err}`);
      }
    } catch (error) {
      console.error("Bulk points error:", error);
      alert("Failed due to connection error.");
    } finally {
      setIsSubmittingBulk(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        c.email.toLowerCase().includes(searchVal.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchVal.toLowerCase()),
    );
  }, [searchVal, customers]);

  const handleExportCSV = () => {
    // Generate simple text CSV
    const headers =
      "Name,Email,Phone,Orders Count,Total Spent,Joined Date,Guest Status\n";
    const rows = customers
      .map(
        (c) =>
          `"${c.name}","${c.email}","${c.phone}",${c.ordersCount},${c.totalSpent / 100},"${c.joined}","${c.isGuest ? "Guest" : "Registered"}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vyorax_customers_export.csv";
    link.click();
    URL.revokeObjectURL(url);
    alert(
      "Customers database exported successfully to vyorax_customers_export.csv!",
    );
  };

  return (
    <div className="space-y-8 text-neutral-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--steel)]/40 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Users className="text-[var(--agni)]" size={24} />
            <span>Customer Registry</span>
          </h1>
          <p className="text-xs text-[var(--silver)] font-sans mt-1">
            Review user accounts, order logs, and export database registries.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={loadCustomers}
            className="p-2.5 bg-[var(--charcoal)] border border-[var(--steel)] hover:border-white text-white rounded transition-all"
            title="Refresh database"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-grow sm:flex-grow-0 px-4 py-2.5 bg-[var(--charcoal)] border border-[var(--steel)] hover:border-white text-white text-xs font-sans font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-1.5 transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-grow sm:flex-grow-0 px-4 py-2.5 bg-[var(--agni)] hover:bg-orange-600 text-white text-xs font-sans font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-1.5 transition-all shadow"
            style={{ color: "white" }}
          >
            <Gift size={14} />
            <span>Bulk Award Points</span>
          </button>
        </div>
      </div>

      {/* Simulation Banner */}
      {isSimulationMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-sans flex items-center justify-between">
          <span>
            ⚠️ <strong>Sandbox Database Offline Mode:</strong> Showing simulated
            registry results. Live orders and customer registrations are local.
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
            Simulated
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center bg-[var(--charcoal)] border border-[var(--steel)]/50 rounded-xl p-4">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-4 py-2.5 pl-10 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
          />
          <Search
            size={14}
            className="absolute left-3.5 top-3.5 text-[var(--smoke)]"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--steel)]/50 text-[var(--smoke)] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Account Type</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--steel)]/30">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-[var(--smoke)] uppercase tracking-wider font-bold animate-pulse"
                  >
                    Retrieving customer profiles...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-[var(--smoke)] italic"
                  >
                    No customer profiles match the current filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.email}
                    className="hover:bg-[var(--carbon)]/35 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-white">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.id || c.email)}`}
                        className="flex items-center space-x-2 hover:text-[var(--agni)] transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-[var(--carbon)] flex items-center justify-center font-bold text-[10px] uppercase text-[var(--gold)] flex-shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{c.name}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-mono text-[var(--silver)]">
                      {c.email}
                    </td>
                    <td className="py-4 px-4 font-mono text-[var(--silver)]">
                      {c.phone}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-white">
                      {c.ordersCount}
                    </td>
                    <td className="py-4 px-4 text-[var(--agni-light)] font-semibold">
                      ₹{(c.totalSpent / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4">
                      {c.isGuest ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase font-bold tracking-wider">
                          Guest
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-[var(--agni-glow)] text-[var(--agni-light)] border border-[var(--agni)]/30 uppercase font-bold tracking-wider">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[var(--smoke)]">
                      {c.joined}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.id || c.email)}`}
                        className="inline-flex items-center space-x-1 text-[var(--agni)] hover:text-orange-500 font-bold uppercase tracking-wider text-[10px]"
                      >
                        <span>Profile View</span>
                        <ExternalLink size={10} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Points Award Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--charcoal)] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-neutral-800">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-sans font-bold uppercase text-neutral-800 dark:text-white flex items-center space-x-1.5">
                <Gift className="text-[var(--agni)]" size={16} />
                <span>Bulk Award Points</span>
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkPointsSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Points Amount
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 100"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[var(--obsidian)] border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-[var(--agni)] font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Expiry (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Leave empty for no expiry"
                  value={bulkExpiryDays}
                  onChange={(e) => setBulkExpiryDays(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[var(--obsidian)] border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-[var(--agni)] font-mono font-bold"
                />
                <span className="text-[9px] text-neutral-400 block mt-0.5">
                  Points will expire after this many days.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                  Reason for Distribution
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festive season gift bonus"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[var(--obsidian)] border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-800 dark:text-white focus:outline-none focus:border-[var(--agni)] font-sans"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className="flex-1 py-2 bg-[var(--agni)] hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 shadow"
                >
                  {isSubmittingBulk ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Awarding...</span>
                    </>
                  ) : (
                    <span>Award Points</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
