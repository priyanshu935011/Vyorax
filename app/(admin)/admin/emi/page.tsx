"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Percent, CreditCard, Layers, Save, Plus, Trash2, 
  ShieldCheck, AlertCircle, RefreshCw, ToggleLeft, ToggleRight, Check, X
} from "lucide-react";
import { MOCK_CATEGORIES } from "@/lib/mockData";

export default function AdminEmiPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"general" | "banks" | "categories">("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [fullSettings, setFullSettings] = useState<any>(null);

  // General Settings States
  const [emiEnabled, setEmiEnabled] = useState(true);
  const [minAmount, setMinAmount] = useState(3000); // in Rupees
  const [standardInterestRate, setStandardInterestRate] = useState(14); // in %
  const [noCostMonths, setNoCostMonths] = useState<number[]>([3, 6]);

  // Banks States
  const [banks, setBanks] = useState<any[]>([
    { id: "hdfc", name: "HDFC Bank", interestRate: 13, enabled: true, noCostEnabled: true },
    { id: "icici", name: "ICICI Bank", interestRate: 14, enabled: true, noCostEnabled: true },
    { id: "sbi", name: "State Bank of India", interestRate: 15, enabled: true, noCostEnabled: false },
    { id: "axis", name: "Axis Bank", interestRate: 14, enabled: true, noCostEnabled: true },
    { id: "kotak", name: "Kotak Mahindra Bank", interestRate: 15, enabled: true, noCostEnabled: true }
  ]);

  // Categories States
  const [categoryOverrides, setCategoryOverrides] = useState<any[]>([
    { categoryId: "cat-cycles", interestRate: 10, noCostEnabled: true, noCostMonths: [3, 6, 9] },
    { categoryId: "cat-electric", interestRate: 10, noCostEnabled: true, noCostMonths: [3, 6, 9] }
  ]);

  // Load Settings
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setFullSettings(data);
          
          const config = data.homepageConfig?.emiConfig;
          if (config) {
            setEmiEnabled(config.enabled !== false);
            setMinAmount((config.minAmount ?? 300000) / 100);
            setStandardInterestRate(config.standardInterestRate ?? 14);
            setNoCostMonths(config.noCostMonths ?? [3, 6]);
            if (Array.isArray(config.banks)) {
              setBanks(config.banks);
            }
            if (Array.isArray(config.categoryOverrides)) {
              setCategoryOverrides(config.categoryOverrides);
            }
          }
          setIsSimulationMode(false);
        } else {
          loadSimulationData();
        }
      } catch (err) {
        loadSimulationData();
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const saved = localStorage.getItem("vega_sim_settings");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFullSettings(data);
        const config = data.homepageConfig?.emiConfig;
        if (config) {
          setEmiEnabled(config.enabled !== false);
          setMinAmount((config.minAmount ?? 300000) / 100);
          setStandardInterestRate(config.standardInterestRate ?? 14);
          setNoCostMonths(config.noCostMonths ?? [3, 6]);
          if (Array.isArray(config.banks)) {
            setBanks(config.banks);
          }
          if (Array.isArray(config.categoryOverrides)) {
            setCategoryOverrides(config.categoryOverrides);
          }
        }
      } catch (e) {}
    }
  };

  const handleSave = async () => {
    const emiConfig = {
      enabled: emiEnabled,
      minAmount: minAmount * 100, // paise
      standardInterestRate,
      noCostMonths,
      banks,
      categoryOverrides
    };

    const updatedConfig = {
      ...(fullSettings?.homepageConfig || {}),
      emiConfig
    };

    const payload = {
      ...(fullSettings || {}),
      freeShippingMin: fullSettings?.freeShippingMin ?? 500000,
      homepageConfig: updatedConfig
    };

    if (isSimulationMode) {
      localStorage.setItem("vega_sim_settings", JSON.stringify(payload));
      localStorage.setItem("vega_sim_homepage_config", JSON.stringify(updatedConfig));
      alert("Simulated EMI configurations saved successfully!");
    } else {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          alert("EMI configurations updated successfully!");
        } else {
          alert("Failed to update EMI configurations.");
        }
      } catch (err) {
        alert("Error connecting to server. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleBank = (idx: number) => {
    const updated = [...banks];
    updated[idx].enabled = !updated[idx].enabled;
    setBanks(updated);
  };

  const handleToggleBankNoCost = (idx: number) => {
    const updated = [...banks];
    updated[idx].noCostEnabled = !updated[idx].noCostEnabled;
    setBanks(updated);
  };

  const handleBankRateChange = (idx: number, val: number) => {
    const updated = [...banks];
    updated[idx].interestRate = val;
    setBanks(updated);
  };

  const handleToggleNoCostMonth = (month: number) => {
    if (noCostMonths.includes(month)) {
      setNoCostMonths(noCostMonths.filter(m => m !== month));
    } else {
      setNoCostMonths([...noCostMonths, month].sort((a, b) => a - b));
    }
  };

  const handleAddCategoryOverride = () => {
    const newOverride = {
      categoryId: MOCK_CATEGORIES.filter(c => !c.parentId)[0]?.id || "cat-cycles",
      interestRate: 12,
      noCostEnabled: true,
      noCostMonths: [3, 6]
    };
    setCategoryOverrides([...categoryOverrides, newOverride]);
  };

  const handleRemoveCategoryOverride = (idx: number) => {
    setCategoryOverrides(categoryOverrides.filter((_, i) => i !== idx));
  };

  const handleCategoryOverrideChange = (idx: number, field: string, val: any) => {
    const updated = [...categoryOverrides];
    updated[idx][field] = val;
    setCategoryOverrides(updated);
  };

  const handleToggleCategoryNoCostMonth = (overrideIdx: number, month: number) => {
    const override = categoryOverrides[overrideIdx];
    let months = [...(override.noCostMonths || [])];
    if (months.includes(month)) {
      months = months.filter(m => m !== month);
    } else {
      months = [...months, month].sort((a, b) => a - b);
    }
    handleCategoryOverrideChange(overrideIdx, "noCostMonths", months);
  };

  if (isLoading && !fullSettings) {
    return (
      <div className="flex-1 min-h-screen bg-[var(--obsidian)] text-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="animate-spin text-[var(--agni)]" size={20} />
          <span className="text-xs uppercase font-sans font-bold tracking-wider">Loading configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[var(--obsidian)] text-white p-6 sm:p-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--steel)]/40 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold uppercase tracking-widest text-white">
            EMI Financing Manager
          </h1>
          <p className="text-xs text-[var(--smoke)] mt-1.5 font-sans leading-relaxed">
            Manage global EMI thresholds, bank interest rates, and category promotions. Mimicking Amazon/Flipkart configurations.
          </p>
        </div>
        <div>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[var(--agni)]/10"
          >
            <Save size={14} />
            <span>Save Configurations</span>
          </button>
        </div>
      </div>

      {/* Simulation Banner */}
      {isSimulationMode && (
        <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-xl p-4 flex items-start space-x-3 text-xs text-[var(--gold-light)] font-sans">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold uppercase block tracking-wider text-[9px] mb-0.5">Sandbox Mode</span>
            Database is currently offline. Your EMI changes will be saved to local storage simulation and reflect across the storefront.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--steel)]/30">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
            activeTab === "general"
              ? "border-[var(--agni)] text-white bg-[var(--charcoal)]/30 rounded-t-lg"
              : "border-transparent text-[var(--smoke)] hover:text-white"
          }`}
        >
          <Percent size={14} />
          <span>Global Settings</span>
        </button>
        <button
          onClick={() => setActiveTab("banks")}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
            activeTab === "banks"
              ? "border-[var(--agni)] text-white bg-[var(--charcoal)]/30 rounded-t-lg"
              : "border-transparent text-[var(--smoke)] hover:text-white"
          }`}
        >
          <CreditCard size={14} />
          <span>Bank Rates</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
            activeTab === "categories"
              ? "border-[var(--agni)] text-white bg-[var(--charcoal)]/30 rounded-t-lg"
              : "border-transparent text-[var(--smoke)] hover:text-white"
          }`}
        >
          <Layers size={14} />
          <span>Category Overrides</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Tab 1: General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider border-b border-[var(--steel)]/30 pb-3 text-white flex items-center space-x-2">
              <Percent size={16} className="text-[var(--agni)]" />
              <span>Global Settings</span>
            </h3>

            {/* Toggle Status */}
            <div className="flex items-center justify-between bg-[var(--obsidian)]/40 p-4 border border-[var(--steel)]/30 rounded-xl">
              <div>
                <span className="text-xs font-sans font-bold uppercase tracking-wide text-white block">
                  Enable EMI Option
                </span>
                <span className="text-[10px] text-[var(--smoke)] font-sans mt-0.5 block leading-relaxed">
                  Turn on easy installments options on product pages, cards, and checkout.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmiEnabled(!emiEnabled)}
                className="text-[var(--agni)] focus:outline-none"
              >
                {emiEnabled ? (
                  <ToggleRight size={40} className="text-[var(--agni)]" />
                ) : (
                  <ToggleLeft size={40} className="text-neutral-600" />
                )}
              </button>
            </div>

            {/* Minimum EMI Amount */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                Minimum Purchase Threshold for EMI Option (₹)
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-500 font-mono"
              />
              <p className="text-[9px] text-[var(--smoke)] font-sans leading-relaxed">
                If the product price (or checkout subtotal) is less than this amount, the EMI option will be hidden storefront-wide.
              </p>
            </div>

            {/* Standard Interest Rate */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                Standard Global Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                value={standardInterestRate}
                onChange={(e) => setStandardInterestRate(Math.max(0, Number(e.target.value)))}
                className="w-full bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-500 font-mono"
              />
              <p className="text-[9px] text-[var(--smoke)] font-sans leading-relaxed">
                Default interest rate applied if bank rates or category overrides are not specified.
              </p>
            </div>

            {/* Global No-Cost Months */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                Global No-Cost EMI Tenures (Months)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[3, 6, 9, 12, 18, 24].map((month) => {
                  const active = noCostMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleToggleNoCostMonth(month)}
                      className={`px-4 py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                        active 
                          ? "bg-[var(--agni)]/10 border-[var(--agni)] text-[var(--agni-light)]"
                          : "bg-[var(--obsidian)] border-[var(--steel)]/50 text-[var(--smoke)] hover:text-white"
                      }`}
                    >
                      {month}m
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-[var(--smoke)] font-sans leading-relaxed">
                Tenures selected here will charge 0% interest to the customer under No-Cost campaigns.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Bank Configurations */}
        {activeTab === "banks" && (
          <div className="space-y-6">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider border-b border-[var(--steel)]/30 pb-3 text-white flex items-center space-x-2">
              <CreditCard size={16} className="text-[var(--agni)]" />
              <span>Supported Bank Rates</span>
            </h3>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left font-sans text-xs border border-[var(--steel)]/40 rounded-xl overflow-hidden">
                <thead className="bg-[var(--obsidian)] uppercase tracking-wider text-[9px] font-bold text-[var(--smoke)] border-b border-[var(--steel)]/40">
                  <tr>
                    <th className="p-4">Bank Name</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Interest Rate (% p.a.)</th>
                    <th className="p-4 text-center">No-Cost Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--steel)]/20">
                  {banks.map((bank, idx) => (
                    <tr key={bank.id} className="hover:bg-[var(--obsidian)]/20 transition-colors">
                      <td className="p-4 font-bold text-white uppercase">{bank.name}</td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBank(idx)}
                          className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${
                            bank.enabled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                          }`}
                        >
                          {bank.enabled ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="number"
                            value={bank.interestRate}
                            disabled={!bank.enabled}
                            onChange={(e) => handleBankRateChange(idx, Number(e.target.value))}
                            className="w-16 bg-[var(--obsidian)] border border-[var(--steel)]/60 disabled:opacity-50 rounded px-2.5 py-1 text-center text-xs font-mono focus:outline-none focus:border-[var(--agni)] text-white"
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          disabled={!bank.enabled}
                          onClick={() => handleToggleBankNoCost(idx)}
                          className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${
                            bank.noCostEnabled && bank.enabled
                              ? "bg-[var(--gold)]/10 text-[var(--gold-light)] border-[var(--gold)]/20"
                              : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                          }`}
                        >
                          {bank.noCostEnabled ? "Supported" : "Standard Only"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Category Overrides */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--steel)]/30 pb-3">
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <Layers size={16} className="text-[var(--agni)]" />
                <span>Category Specific Overrides</span>
              </h3>
              <button
                type="button"
                onClick={handleAddCategoryOverride}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[var(--obsidian)] hover:bg-[var(--carbon)] border border-[var(--steel)]/60 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                <Plus size={12} />
                <span>Add Override</span>
              </button>
            </div>

            {categoryOverrides.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[var(--steel)]/30 rounded-xl text-xs text-[var(--smoke)]">
                No overrides configured. Standard global configurations are applied to all categories.
              </div>
            ) : (
              <div className="space-y-6">
                {categoryOverrides.map((override, idx) => (
                  <div key={idx} className="bg-[var(--obsidian)]/30 border border-[var(--steel)]/40 p-6 rounded-xl space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryOverride(idx)}
                      className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remove Override"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                      {/* Select Category */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Category</label>
                        <select
                          value={override.categoryId}
                          onChange={(e) => handleCategoryOverrideChange(idx, "categoryId", e.target.value)}
                          className="w-full bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                        >
                          {MOCK_CATEGORIES.filter(c => !c.parentId).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Interest Rate */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Category Interest Rate (%)</label>
                        <input
                          type="number"
                          value={override.interestRate}
                          onChange={(e) => handleCategoryOverrideChange(idx, "interestRate", Number(e.target.value))}
                          className="w-full bg-[var(--obsidian)] border border-[var(--steel)]/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-mono"
                        />
                      </div>
                    </div>

                    {/* Enable No-Cost */}
                    <div className="flex items-center space-x-3 bg-[var(--charcoal)]/30 p-3 rounded-xl border border-[var(--steel)]/30 max-w-sm">
                      <input
                        type="checkbox"
                        id={`noCostCategory-${idx}`}
                        checked={override.noCostEnabled}
                        onChange={(e) => handleCategoryOverrideChange(idx, "noCostEnabled", e.target.checked)}
                        className="rounded text-[var(--agni)] focus:ring-[var(--agni)] focus:ring-offset-0 border-[var(--steel)] bg-[var(--obsidian)]"
                      />
                      <label htmlFor={`noCostCategory-${idx}`} className="text-xs text-white font-sans font-bold uppercase tracking-wide cursor-pointer select-none">
                        Enable No-Cost Campaign overrides
                      </label>
                    </div>

                    {/* Category No-Cost Months */}
                    {override.noCostEnabled && (
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                          No-Cost EMI Tenures (Months)
                        </label>
                        <div className="flex gap-2">
                          {[3, 6, 9, 12, 18, 24].map((month) => {
                            const active = (override.noCostMonths || []).includes(month);
                            return (
                              <button
                                key={month}
                                type="button"
                                onClick={() => handleToggleCategoryNoCostMonth(idx, month)}
                                className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                                  active 
                                    ? "bg-[var(--gold)]/10 border-[var(--gold)] text-[var(--gold-light)]"
                                    : "bg-[var(--obsidian)] border-[var(--steel)]/50 text-[var(--smoke)] hover:text-white"
                                }`}
                              >
                                {month}m
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
