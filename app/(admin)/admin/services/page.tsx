"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Search,
  ListFilter,
  CreditCard,
  ChevronRight,
  CheckCircle,
  Package,
} from "lucide-react";
import { MOCK_SERVICE_PACKAGES } from "@/lib/mockData";

type AdminTab = "requests" | "packages" | "payments";

export default function AdminServicesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("requests");

  // Requests State
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsSearch, setBookingsSearch] = useState("");
  const [bookingsFilter, setBookingsFilter] = useState("ALL"); // "ALL", "SERVICING", "REPAIRING"

  // Packages State
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null); // For editing

  // Package Form State
  const [formType, setFormType] = useState<"SERVICING" | "REPAIRING">(
    "SERVICING",
  );
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState(""); // in Rupees
  const [formDesc, setFormDesc] = useState("");
  const [formIncludes, setFormIncludes] = useState(""); // newline separated
  const [formIsActive, setFormIsActive] = useState(true);
  const [savingPackage, setSavingPackage] = useState(false);

  // Load bookings and packages
  const loadData = async () => {
    setBookingsLoading(true);
    setPackagesLoading(true);

    // 1. Fetch Bookings
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        loadSimulatedBookings();
      }
    } catch (e) {
      loadSimulatedBookings();
    } finally {
      setBookingsLoading(false);
    }

    // 2. Fetch Packages
    try {
      const res = await fetch("/api/packages");
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      } else {
        loadSimulatedPackages();
      }
    } catch (e) {
      loadSimulatedPackages();
    } finally {
      setPackagesLoading(false);
    }
  };

  const loadSimulatedBookings = () => {
    const saved = localStorage.getItem("vega_sim_bookings");
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        setBookings([]);
      }
    } else {
      setBookings([]);
    }
  };

  const loadSimulatedPackages = () => {
    const saved = localStorage.getItem("vega_sim_packages");
    if (saved) {
      try {
        setPackages(JSON.parse(saved));
      } catch (e) {
        setPackages(MOCK_SERVICE_PACKAGES);
      }
    } else {
      // Seed initial mock packages into simulated store if empty
      localStorage.setItem(
        "vega_sim_packages",
        JSON.stringify(MOCK_SERVICE_PACKAGES),
      );
      setPackages(MOCK_SERVICE_PACKAGES);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update request status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // 1. Update state immediately
    const updatedBookings = bookings.map((b) => {
      if (b.id === id) {
        return { ...b, status: newStatus };
      }
      return b;
    });
    setBookings(updatedBookings);

    // 2. Sync DB
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        updateSimulatedBookingStatus(id, newStatus);
      }
    } catch (e) {
      updateSimulatedBookingStatus(id, newStatus);
    }
  };

  const updateSimulatedBookingStatus = (id: string, newStatus: string) => {
    const saved = localStorage.getItem("vega_sim_bookings");
    if (saved) {
      try {
        const current = JSON.parse(saved);
        const updated = current.map((b: any) => {
          if (b.id === id) return { ...b, status: newStatus };
          return b;
        });
        localStorage.setItem("vega_sim_bookings", JSON.stringify(updated));
      } catch (e) {
        console.error(
          "Failed to update simulated booking status in local storage",
        );
      }
    }
  };

  // Select package for editing
  const handleEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setFormType(pkg.type);
    setFormName(pkg.name);
    setFormPrice(pkg.price.toString());
    setFormDesc(pkg.desc);
    setFormIncludes(pkg.includes.join("\n"));
    setFormIsActive(pkg.isActive !== false);
  };

  // Reset form
  const handleResetForm = () => {
    setSelectedPackage(null);
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormIncludes("");
    setFormIsActive(true);
  };

  // Save (Create or Update) package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !formDesc) {
      alert("Please fill in all package details.");
      return;
    }

    setSavingPackage(true);
    const priceNum = parseInt(formPrice, 10);
    const includesArray = formIncludes
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const payload: any = {
      type: formType,
      name: formName,
      price: priceNum,
      desc: formDesc,
      includes: includesArray,
      isActive: formIsActive,
    };

    if (selectedPackage) {
      payload.id = selectedPackage.id;
    }

    try {
      const url = "/api/admin/packages";
      const method = selectedPackage ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedPkg = await res.json();
        // Reload storefront packages
        loadData();
        handleResetForm();
      } else {
        saveSimulatedPackage(payload);
      }
    } catch (err) {
      saveSimulatedPackage(payload);
    } finally {
      setSavingPackage(false);
    }
  };

  const saveSimulatedPackage = (payload: any) => {
    console.warn("DB offline. Saving simulated package to localStorage.");
    const saved = localStorage.getItem("vega_sim_packages");
    let currentPkgs = [];
    if (saved) {
      try {
        currentPkgs = JSON.parse(saved);
      } catch (e) {
        currentPkgs = [...MOCK_SERVICE_PACKAGES];
      }
    } else {
      currentPkgs = [...MOCK_SERVICE_PACKAGES];
    }

    if (selectedPackage) {
      // Editing existing
      const updated = currentPkgs.map((p: any) => {
        if (p.id === selectedPackage.id) {
          return { ...p, ...payload };
        }
        return p;
      });
      localStorage.setItem("vega_sim_packages", JSON.stringify(updated));
      setPackages(updated);
    } else {
      // Creating new
      const newSimPkg = {
        ...payload,
        id: `sim-pkg-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      currentPkgs.push(newSimPkg);
      localStorage.setItem("vega_sim_packages", JSON.stringify(currentPkgs));
      setPackages(currentPkgs);
    }
    handleResetForm();
  };

  // Delete package
  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service package?"))
      return;

    try {
      const res = await fetch(`/api/admin/packages?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        deleteSimulatedPackage(id);
      }
    } catch (e) {
      deleteSimulatedPackage(id);
    }
  };

  const deleteSimulatedPackage = (id: string) => {
    const saved = localStorage.getItem("vega_sim_packages");
    if (saved) {
      try {
        const current = JSON.parse(saved);
        const filtered = current.filter((p: any) => p.id !== id);
        localStorage.setItem("vega_sim_packages", JSON.stringify(filtered));
        setPackages(filtered);
      } catch (e) {
        console.error("Failed to delete simulated package in local storage");
      }
    }
  };

  // Filters
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id?.toLowerCase().includes(bookingsSearch.toLowerCase()) ||
      b.phone?.includes(bookingsSearch) ||
      b.planName?.toLowerCase().includes(bookingsSearch.toLowerCase()) ||
      b.address?.name?.toLowerCase().includes(bookingsSearch.toLowerCase());

    const matchesType = bookingsFilter === "ALL" || b.type === bookingsFilter;
    return matchesSearch && matchesType;
  });

  // Payments calculations from bookings
  const completedBookings = bookings.filter(
    (b) =>
      b.status === "COMPLETED" ||
      b.status === "DELIVERED" ||
      b.status === "BOOKED",
  );

  return (
    <div className="bg-neutral-50 text-neutral-800 p-6 md:p-8 rounded-2xl border border-neutral-200 min-h-[85vh] space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs uppercase font-sans tracking-[0.25em] font-bold text-amber-600">
            Admin Workshop
          </span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-neutral-900 mt-1">
            Cycle Services Manager
          </h1>
          <p className="text-xs text-neutral-600 font-sans mt-1">
            Manage servicing & repair bookings, update client request statuses,
            track simulated payments, and configure packages.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-[var(--charcoal)] border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 rounded-lg transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "requests"
              ? "border-[var(--agni)] text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Service Requests ({filteredBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "packages"
              ? "border-[var(--agni)] text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Packages Manager ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3.5 text-xs font-sans font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "payments"
              ? "border-[var(--agni)] text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Payments Ledger
        </button>
      </div>

      {/* REQUESTS VIEW */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--charcoal)] p-4 border border-neutral-200 rounded-xl shadow-sm">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search requests by ID, Phone, Customer Name, or Plan..."
                value={bookingsSearch}
                onChange={(e) => setBookingsSearch(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-300"
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] uppercase font-bold text-neutral-550 font-sans">
                Filter type:
              </span>
              <div className="flex bg-neutral-50 border border-neutral-200 rounded-lg p-0.5">
                {["ALL", "SERVICING", "REPAIRING"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBookingsFilter(opt)}
                    className={`px-3 py-1.5 rounded text-[10px] font-sans font-bold tracking-wider uppercase transition-colors ${
                      bookingsFilter === opt
                        ? "bg-[var(--charcoal)] text-neutral-900 shadow-sm border border-neutral-200"
                        : "text-neutral-500 hover:text-neutral-950"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings Table / Cards wrapper */}
          {bookingsLoading ? (
            <div className="text-center py-20 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl shadow-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--agni)]"></div>
              <p className="text-xs text-neutral-500 mt-2 font-sans">
                Loading bookings data...
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-20 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl shadow-sm">
              <p className="text-xs text-neutral-550 font-sans">
                No bookings requests match the filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[var(--charcoal)] border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-4 text-xs shadow-sm"
                >
                  <div className="space-y-2.5 flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                        {b.id}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-sans font-bold tracking-widest px-2 py-0.5 rounded border ${
                          b.type === "SERVICING"
                            ? "text-[var(--agni)] border-orange-200 bg-orange-50"
                            : "text-amber-700 border-amber-200 bg-amber-50"
                        }`}
                      >
                        {b.type}
                      </span>
                      <h4 className="text-sm font-sans font-bold text-neutral-900 uppercase tracking-wider">
                        {b.planName}
                      </h4>
                      <span className="text-neutral-350">•</span>
                      <span className="text-neutral-700 font-mono font-bold">
                        ₹
                        {typeof b.price === "number" && b.price > 10000
                          ? (b.price / 100).toLocaleString()
                          : b.price}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-500 font-sans leading-relaxed">
                      <div>
                        <strong className="text-[9px] uppercase tracking-wider text-neutral-400 block mb-0.5 font-bold">
                          Address Detail
                        </strong>
                        <span className="text-neutral-800">
                          {b.address?.name || "Customer"}
                          <br />
                          {b.address?.street}, {b.address?.city},{" "}
                          {b.address?.pincode}
                        </span>
                      </div>
                      <div>
                        <strong className="text-[9px] uppercase tracking-wider text-neutral-400 block mb-0.5 font-bold">
                          Contact Phone
                        </strong>
                        <span className="font-mono text-neutral-800">
                          {b.phone}
                        </span>
                      </div>
                      <div>
                        <strong className="text-[9px] uppercase tracking-wider text-neutral-400 block mb-0.5 font-bold">
                          Booking Date
                        </strong>
                        <span className="text-neutral-800">
                          {new Date(b.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status update controller */}
                  <div className="flex items-center space-x-3 border-t border-neutral-100 lg:border-t-0 pt-3 lg:pt-0">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                      Status:
                    </span>
                    <select
                      value={b.status || "BOOKED"}
                      onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-300"
                    >
                      <option value="BOOKED">BOOKED</option>
                      <option value="PICKED_UP">PICKED UP</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PACKAGES MANAGER */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side panel (Lg 4cols) */}
          <div className="lg:col-span-4 bg-[var(--charcoal)] border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>{selectedPackage ? "Edit Package" : "Create Package"}</span>
              {selectedPackage && (
                <button
                  onClick={handleResetForm}
                  className="text-[9px] text-amber-600 uppercase hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </h3>

            <form
              onSubmit={handleSavePackage}
              className="space-y-3.5 text-xs font-sans"
            >
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                  Package Type
                </label>
                <div className="flex bg-neutral-50 rounded border border-neutral-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setFormType("SERVICING")}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      formType === "SERVICING"
                        ? "bg-[var(--charcoal)] text-neutral-900 shadow-sm border border-neutral-200"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    Servicing
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("REPAIRING")}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      formType === "REPAIRING"
                        ? "bg-[var(--charcoal)] text-neutral-900 shadow-sm border border-neutral-200"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    Repairing
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Tuneup"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                  Price (Rupees)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 799"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-300 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Keep your ride smooth and clean..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-300"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 font-sans">
                    Inclusions / Inclusions List
                  </label>
                  <span className="text-[8px] text-neutral-400">
                    Press ENTER for new line
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Gear indexing&#10;Brake centering&#10;Deep wash"
                  value={formIncludes}
                  onChange={(e) => setFormIncludes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-300 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center space-x-2.5 py-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-neutral-300 text-[var(--agni)] focus:ring-0 bg-neutral-50 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-[10px] uppercase font-bold text-neutral-550 cursor-pointer font-sans"
                >
                  Package Active (Visible on Store)
                </label>
              </div>

              <button
                type="submit"
                disabled={savingPackage}
                className="w-full py-3 bg-[var(--agni)] hover:bg-orange-500 text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors mt-2"
              >
                {savingPackage
                  ? "Saving Package..."
                  : selectedPackage
                    ? "Update Package"
                    : "Create Package"}
              </button>
            </form>
          </div>

          {/* Packages Display Grid (Lg 8cols) */}
          <div className="lg:col-span-8 space-y-6">
            {packagesLoading ? (
              <div className="text-center py-20 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl shadow-sm">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--agni)]"></div>
                <p className="text-xs text-neutral-550 mt-2">
                  Loading packages list...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id || pkg.name}
                    className={`bg-[var(--charcoal)] border rounded-xl p-5 hover:border-neutral-350 transition-all flex flex-col justify-between h-full space-y-4 shadow-sm ${
                      pkg.isActive === false
                        ? "opacity-50 border-dashed border-neutral-200"
                        : "border-neutral-200"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[8px] uppercase font-sans font-bold tracking-widest px-2 py-0.5 rounded border ${
                            pkg.type === "SERVICING"
                              ? "text-[var(--agni)] border-orange-200 bg-orange-50"
                              : "text-amber-700 border-amber-200 bg-amber-50"
                          }`}
                        >
                          {pkg.type}
                        </span>
                        <div className="text-sm font-sans font-black text-neutral-900 font-mono">
                          ₹{pkg.price}
                        </div>
                      </div>

                      <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-neutral-900">
                        {pkg.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                        {pkg.desc}
                      </p>

                      {/* Inclusions summary count */}
                      <div className="mt-2.5 flex items-center space-x-1 text-[9px] text-neutral-500 font-sans">
                        <Package size={10} className="text-amber-600" />
                        <span>
                          {pkg.includes?.length || 0} features configured
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2.5 border-t border-neutral-100 pt-3">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 rounded border border-neutral-200 text-[10px] font-sans font-bold uppercase transition-colors shadow-sm"
                      >
                        <Edit2 size={10} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-2 bg-neutral-50 hover:bg-red-50 text-neutral-550 hover:text-red-600 border border-neutral-200 hover:border-red-200 rounded transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENTS LEDGER */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* Overview Stat Block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--charcoal)] border border-neutral-200 rounded-xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Total Simulated Earnings
              </span>
              <p className="text-3xl font-display font-extrabold text-neutral-900 mt-1.5">
                ₹
                {completedBookings
                  .reduce(
                    (sum, b) =>
                      sum +
                      (typeof b.price === "number" && b.price > 10000
                        ? b.price / 100
                        : b.price),
                    0,
                  )
                  .toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-[var(--charcoal)] border border-neutral-200 rounded-xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Total Transactions
              </span>
              <p className="text-3xl font-display font-extrabold text-neutral-900 mt-1.5">
                {completedBookings.length}
              </p>
            </div>
            <div className="bg-[var(--charcoal)] border border-neutral-200 rounded-xl p-5 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Payment Method
              </span>
              <p className="text-lg font-sans font-bold text-neutral-700 mt-2">
                Simulated Credit/OTP Checkout
              </p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[var(--charcoal)] border border-neutral-200 rounded-xl overflow-hidden text-xs shadow-sm">
            <div className="bg-neutral-50 p-4 border-b border-neutral-100 flex justify-between font-bold text-neutral-500 text-[10px] uppercase tracking-wider font-sans">
              <span>Transaction Detail / Reference</span>
              <span className="text-right">Amount / Timestamp</span>
            </div>

            {completedBookings.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-sans">
                No simulated booking transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {completedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 flex justify-between items-center hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="space-y-1 font-sans">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-neutral-900 font-bold">
                          {b.id}-TXN
                        </span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                          Success
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-normal">
                        Customer contact: {b.phone} | Plan: {b.planName} (
                        {b.type})
                      </p>
                    </div>

                    <div className="text-right space-y-0.5 font-sans">
                      <span className="font-black text-neutral-950 font-mono">
                        ₹
                        {typeof b.price === "number" && b.price > 10000
                          ? (b.price / 100).toLocaleString()
                          : b.price}
                      </span>
                      <p className="text-[9px] text-neutral-400 font-sans">
                        {new Date(b.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
