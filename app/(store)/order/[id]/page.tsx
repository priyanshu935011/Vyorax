"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  PhoneCall,
  Share2,
  Clipboard,
  CheckCircle,
  ArrowLeft,
  Bike,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  Download,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface OrderPageProps {
  params: {
    id: string;
  };
}

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export default function OrderTrackingPage({ params }: OrderPageProps) {
  const orderId = params.id;

  // Local state for order details
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [orderTotal, setOrderTotal] = useState(0);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [address, setAddress] = useState<any>({
    street: "Lalpur Main Road",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834001",
  });
  const [name, setName] = useState("Priyanshu Ranchi");
  const [email, setEmail] = useState("customer@vegasports.in");
  const [phone, setPhone] = useState("8888888888");
  const [orderDate, setOrderDate] = useState<string>("2026-06-14");

  // Access control state
  const [isNotFound, setIsNotFound] = useState(false);

  // Warranty claim modal states
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [warrantyProduct, setWarrantyProduct] = useState("");
  const [warrantySerial, setWarrantySerial] = useState("");
  const [warrantyIssue, setWarrantyIssue] = useState("");
  const [warrantySubmitting, setWarrantySubmitting] = useState(false);

  // Load order data from database, local storage, or fallback to mocks
  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.status === 404 || res.status === 403 || res.status === 401) {
          setIsNotFound(true);
          return true;
        }
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setOrderTotal(data.total);
          setItemsList(data.items);
          setAddress(data.address);
          setName(data.customer);
          setEmail(data.email);
          setPhone(data.phone);
          if (data.date) setOrderDate(data.date);
          return true;
        }
      } catch (err) {
        console.warn(
          "DB offline or failed to fetch order. Checking simulation storage.",
        );
      }
      return false;
    }

    function loadSimulatedOrder() {
      try {
        const currentSimOrders = JSON.parse(
          localStorage.getItem("vega_sim_orders") || "[]",
        );
        const found = currentSimOrders.find((o: any) => o.id === orderId);
        if (found) {
          setStatus(found.status);
          setOrderTotal(found.total);
          setItemsList(
            found.items.map((i: any) => ({
              id: i.id || "prod-mock",
              name: i.name,
              price: i.price,
              quantity: i.qty || i.quantity || 1,
              image:
                i.image ||
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
              gstRate: i.gstRate || 18,
            })),
          );
          setAddress(found.address);
          setName(found.customer);
          setEmail(found.email);
          setPhone(found.phone);
          if (found.date) setOrderDate(found.date);
          return true;
        }
      } catch (e) {
        console.warn("Error reading simulated orders", e);
      }
      return false;
    }

    async function initialize() {
      const dbSuccess = await fetchOrder();
      if (dbSuccess) return;

      const simSuccess = loadSimulatedOrder();
      if (simSuccess) return;

      // Final default fallback (mock order details)
      const saved = localStorage.getItem("vega_saved_address");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAddress({
          street: parsed.street || "Lalpur Main Road",
          city: parsed.city || "Ranchi",
          state: parsed.state || "Jharkhand",
          pincode: parsed.pincode || "834001",
        });
        setName(parsed.name || "Priyanshu Ranchi");
        setEmail(parsed.email || "customer@vegasports.in");
        setPhone(parsed.phone || "8888888888");
      }

      setOrderDate(new Date().toISOString().split("T")[0]);
      setOrderTotal(4775000); // Rs 47,750 default mock total
      setItemsList([
        {
          id: "prod-aero-x",
          name: "VEGA Aero-X Carbon Cycle",
          price: 4500000,
          quantity: 1,
          image:
            "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
          gstRate: 18,
        },
        {
          id: "VEGA-ACC-HELM",
          name: "Aero Shield Helmet",
          price: 249900,
          quantity: 1,
          image:
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop",
          gstRate: 12,
        },
      ]);
    }

    initialize();
  }, [orderId]);

  // Expected Delivery calculation helper
  const getExpectedDeliveryDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + 3);
      return date.toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "3 Days";
    }
  };

  // Timeline Step mapping
  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: "PENDING", label: "Order Placed", desc: "Received at Ranchi HQ" },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      desc: "Inventory allocated & ready",
    },
    {
      key: "PROCESSING",
      label: "Packed",
      desc: "Secured in cargo travel crate",
    },
    { key: "SHIPPED", label: "Shipped", desc: "Dispatched via Shiprocket" },
    {
      key: "OUT_FOR_DELIVERY",
      label: "Out For Delivery",
      desc: "Rider in your sector",
    },
    { key: "DELIVERED", label: "Delivered", desc: "Unboxing started" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  // Copy Tracking link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Tracking link copied to clipboard!");
  };

  // Trigger hidden iframe print / Save as PDF
  const handlePrintInvoice = () => {
    const iframe = document.getElementById(
      "invoice-iframe",
    ) as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      alert("Invoice registry is loading, please try again in a moment.");
    }
  };

  // Handle warranty claims form submission
  const handleSubmitWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyProduct || !warrantySerial || !warrantyIssue) {
      alert("Please fill in all fields to submit your claim.");
      return;
    }
    setWarrantySubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/warranty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: warrantyProduct,
          serialNo: warrantySerial,
          issueDesc: warrantyIssue,
        }),
      });
      if (res.ok) {
        alert(
          "Warranty claim registered successfully! Our technicians will contact you shortly.",
        );
        setIsWarrantyModalOpen(false);
        setWarrantyProduct("");
        setWarrantySerial("");
        setWarrantyIssue("");
      } else {
        const data = await res.json();
        alert(`Failed to submit claim: ${data.error || "Please try again."}`);
      }
    } catch (err) {
      alert("[Simulation] Warranty claim submitted successfully!");
      setIsWarrantyModalOpen(false);
      setWarrantyProduct("");
      setWarrantySerial("");
      setWarrantyIssue("");
    } finally {
      setWarrantySubmitting(false);
    }
  };

  // Curated product recommendations matching order items
  const recommendations = [
    {
      id: "rec-1",
      name: "VEGA Carbon Bottle Cage",
      price: 149900,
      image:
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
    },
    {
      id: "rec-2",
      name: "Aero Shield LED Taillight",
      price: 219900,
      image:
        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop",
    },
    {
      id: "rec-3",
      name: "High Pressure Digital Pump",
      price: 349900,
      image:
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
    },
  ];

  // Trigger Next.js 404 page if order is missing or unauthorized
  if (isNotFound) {
    notFound();
  }

  return (
    <div className="bg-[var(--obsidian)] min-h-screen pt-8 pb-20 text-[var(--white)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-8">
          <Link
            href="/products"
            className="text-xs uppercase font-sans font-bold tracking-wider text-[var(--silver)] hover:text-white flex items-center space-x-1.5"
          >
            <ArrowLeft size={12} />
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--steel)]/40 pb-8 mb-8">
          <div>
            <span className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-[var(--agni)]">
              Order Summary
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase text-white">
                Order Details
              </h1>
              <span className="px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold tracking-wider bg-[var(--carbon)] text-[var(--gold-light)] border border-[var(--steel)]/60 rounded-md select-all">
                #{orderId}
              </span>
            </div>
            <p
              className="text-xs text-[var(--smoke)] font-mono mt-1"
              suppressHydrationWarning
            >
              Expected Delivery: {getExpectedDeliveryDateString(orderDate)}
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {status === "DELIVERED" && (
              <button
                onClick={handlePrintInvoice}
                className="px-4 py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 rounded text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-agni-glow"
              >
                <Download size={12} />
                <span>GST Invoice</span>
              </button>
            )}
            {/* <button
              onClick={handleCopyLink}
              className="px-4 py-2 border border-[var(--steel)] hover:border-white rounded text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
            >
              <Share2 size={12} />
              <span>Share Link</span>
            </button> */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(orderId);
                alert("Order ID copied!");
              }}
              className="px-4 py-2 border border-[var(--steel)] hover:border-white rounded text-xs font-sans font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
            >
              <Clipboard size={12} />
              <span>Copy ID</span>
            </button>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: TIMELINE, DETAILS, WARRANTEES (Lg 8cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Timeline component card */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 sm:p-8">
              <h3 className="text-sm font-sans font-bold uppercase text-white mb-8 border-b border-[var(--steel)]/30 pb-3">
                Shipping Progress
              </h3>

              <div className="relative pl-8 sm:pl-0 sm:flex sm:justify-between items-start">
                {/* Desktop horizontal timeline line bar */}
                <div className="hidden sm:block absolute top-[22px] left-[5%] right-[5%] h-0.5 bg-[var(--steel)] z-0" />
                {/* Desktop horizontal active line fill bar */}
                <div
                  className="hidden sm:block absolute top-[22px] left-[5%] h-0.5 bg-[var(--agni)] z-0 transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (steps.length - 1)) * 90}%`,
                  }}
                />

                {/* Mobile vertical line bar */}
                <div className="sm:hidden absolute top-4 bottom-4 left-[15px] w-0.5 bg-[var(--steel)] z-0" />
                {/* Mobile vertical active line fill bar */}
                <div
                  className="sm:hidden absolute top-4 left-[15px] w-0.5 bg-[var(--agni)] z-0 transition-all duration-500"
                  style={{
                    height: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
                  }}
                />

                {/* Steps Nodes */}
                {steps.map((step, idx) => {
                  const active = idx <= currentStepIndex;
                  const current = idx === currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className="relative z-10 flex sm:flex-col items-center mb-8 last:mb-0 sm:mb-0 text-left sm:text-center group"
                    >
                      {/* Step Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          current
                            ? "bg-[var(--obsidian)] border-[var(--agni)] shadow-agni-glow text-[var(--agni)]"
                            : active
                              ? "bg-[var(--agni)] border-[var(--agni)] text-neutral-50"
                              : "bg-[var(--charcoal)] border-[var(--steel)] text-[var(--smoke)]"
                        }`}
                      >
                        {idx + 1 === 6 && active ? (
                          <CheckCircle size={18} />
                        ) : idx + 1 === 5 && active ? (
                          <Bike size={18} className="animate-bounce" />
                        ) : (
                          <span className="text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Label Text Details */}
                      <div className="ml-4 sm:ml-0 sm:mt-4">
                        <h4
                          className={`text-xs font-sans font-bold transition-colors ${
                            current
                              ? "text-[var(--agni-light)]"
                              : active
                                ? "text-white"
                                : "text-[var(--smoke)]"
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-[var(--smoke)] font-sans mt-0.5 max-w-[120px]">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Items List Grid */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                Order Items Details
              </h3>
              <div className="space-y-6">
                {itemsList.map((item) => {
                  const qty = item.quantity || item.qty || 1;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 last:pb-0 border-b border-[var(--steel)]/20 last:border-b-0 text-xs font-sans"
                    >
                      <div className="w-16 h-16 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0 border border-[var(--steel)]/30">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover animate-fadeIn"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm">
                          {item.name}
                        </h4>
                        <p className="text-[var(--smoke)] mt-0.5 font-mono text-[10px]">
                          GST Rate: {item.gstRate || 18}% (CGST{" "}
                          {(item.gstRate || 18) / 2}% + SGST{" "}
                          {(item.gstRate || 18) / 2}%)
                        </p>
                        <p className="text-[var(--silver)] mt-1 max-w-lg">
                          Includes structural carbon fiber inspection
                          certificate and manual adjustment settings booklet.
                        </p>
                      </div>
                      <div className="text-left sm:text-right font-mono font-bold text-white flex-shrink-0">
                        <div>
                          {qty} x ₹{(item.price / 100).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[var(--gold)] mt-0.5">
                          ₹{((item.price * qty) / 100).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product Accessory Recommendations */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-sans font-bold uppercase text-white border-b border-[var(--steel)]/30 pb-3">
                Recommended Accessories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="w-full h-24 bg-[var(--obsidian)] rounded-lg relative overflow-hidden border border-[var(--steel)]/30">
                      <Image
                        src={rec.image}
                        alt={rec.name}
                        fill
                        className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                        sizes="120px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-sans font-bold text-white truncate">
                        {rec.name}
                      </h4>
                      <div className="text-[10px] text-[var(--gold)] mt-0.5 font-mono font-bold">
                        ₹{(rec.price / 100).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        alert("Added recommended accessory to cart!")
                      }
                      className="w-full py-1.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-white rounded text-[10px] font-sans font-bold uppercase tracking-wider transition-colors"
                    >
                      Add Accessory
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS, SUPPORT, WARRANTY (Lg 4cols) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Delivery address details card */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white border-b border-[var(--steel)]/30 pb-3">
                Shipping Address
              </h3>

              <div className="text-xs font-sans space-y-3">
                <div className="flex items-start space-x-2.5">
                  <MapPin
                    size={14}
                    className="text-[var(--agni)] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <h5 className="font-bold text-white">{name}</h5>
                    <p className="text-[var(--silver)] mt-1 leading-relaxed">
                      {address.street},<br />
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                </div>
                <div className="border-t border-[var(--steel)]/30 pt-3 text-[var(--smoke)] space-y-1">
                  <div>
                    Phone:{" "}
                    <span className="text-white font-mono font-semibold">
                      {phone}
                    </span>
                  </div>
                  <div>
                    Email:{" "}
                    <span className="text-white font-mono font-semibold">
                      {email}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Summary details card */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white border-b border-[var(--steel)]/30 pb-3">
                Receipt Details
              </h3>

              <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar">
                {itemsList.map((item) => {
                  const qty = item.quantity || item.qty || 1;
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs font-sans"
                    >
                      <span className="text-[var(--silver)] truncate max-w-[180px]">
                        {item.name} x{qty}
                      </span>
                      <span className="font-mono text-white">
                        ₹{((item.price * qty) / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[var(--steel)]/30 pt-3 flex justify-between text-xs font-sans font-bold text-white">
                <span>Total Amount Paid</span>
                <span className="font-mono text-[var(--agni)]">
                  ₹{(orderTotal / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Warranty terms and actions card */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3">
                <ShieldCheck size={14} className="text-[var(--gold)]" />
                <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white">
                  Warranty & Policy
                </h3>
              </div>
              <div className="text-[10px] font-sans text-[var(--silver)] space-y-2.5 leading-relaxed">
                <div className="flex justify-between border-b border-[var(--steel)]/20 pb-1">
                  <span>Carbon Frame</span>
                  <span className="font-bold text-white">5 Years</span>
                </div>
                <div className="flex justify-between border-b border-[var(--steel)]/20 pb-1">
                  <span>Fork & Components</span>
                  <span className="font-bold text-white">2 Years</span>
                </div>
                <div className="flex justify-between border-b border-[var(--steel)]/20 pb-1">
                  <span>Accessories & Helmets</span>
                  <span className="font-bold text-white">1 Year</span>
                </div>
                <p className="text-[9px] text-[var(--smoke)] leading-normal mt-1">
                  Warranty claims require frame serial numbers and detailed
                  breakdown audit reports.
                </p>
              </div>

              <button
                onClick={() => {
                  if (itemsList.length > 0) {
                    setWarrantyProduct(itemsList[0].name);
                  }
                  setIsWarrantyModalOpen(true);
                }}
                className="w-full py-2 bg-[var(--carbon)] hover:bg-[var(--steel)] border border-[var(--steel)] text-white text-xs font-sans font-bold uppercase tracking-wider rounded transition-colors"
              >
                File Warranty Claim
              </button>
            </div>

            {/* Support Quick links card */}
            <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs uppercase font-sans tracking-[0.2em] font-bold text-white border-b border-[var(--steel)]/30 pb-3">
                Need Assistance?
              </h3>
              <p className="text-xs text-[var(--silver)] font-sans leading-relaxed">
                If you have questions regarding cycle frame adjustments or
                courier delivery delays, contact our Ranchi Support directly.
              </p>

              <div className="space-y-2.5 pt-2">
                <a
                  href={`https://wa.me/919999999999?text=Hi, need assistance with my order ID: ${orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-neutral-50 text-xs font-sans font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-2 transition-colors"
                >
                  <PhoneCall size={12} />
                  <span>WhatsApp Ranchi Support</span>
                </a>
                <a
                  href={`https://wa.me/919999999999?text=Hi%20VEGA%20Support%2C%20I%20would%20like%20to%20request%20a%20replacement%20for%20my%20Order%20ID%3A%20${orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 border border-[var(--agni)]/50 hover:bg-[var(--agni)]/10 text-[var(--agni-light)] text-xs font-sans font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-2 transition-colors"
                >
                  <Bike size={12} />
                  <span>Request Replacement</span>
                </a>
                <Link
                  href="/account"
                  className="w-full block text-center py-2.5 border border-[var(--steel)] text-white text-xs font-sans font-bold uppercase tracking-wider rounded hover:border-white transition-colors"
                >
                  View My Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden iframe for background printing / saving invoice without opening a new tab */}
      {status === "DELIVERED" && (
        <iframe
          id="invoice-iframe"
          src={`/order/${orderId}/invoice`}
          style={{ display: "none" }}
          title="Invoice Print Frame"
        />
      )}

      {/* Warranty Claim Form Modal */}
      {isWarrantyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="border-b border-[var(--steel)]/30 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-sans font-bold uppercase text-white tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="text-[var(--gold)]" size={16} />
                <span>Warranty Registration</span>
              </h3>
              <button
                onClick={() => setIsWarrantyModalOpen(false)}
                className="text-[var(--smoke)] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitWarranty}
              className="space-y-4 font-sans text-xs"
            >
              {/* Product selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Claim Product
                </label>
                <select
                  value={warrantyProduct}
                  onChange={(e) => setWarrantyProduct(e.target.value)}
                  required
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                >
                  <option value="">Select product item...</option>
                  {itemsList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Serial / Frame Number
                </label>
                <input
                  type="text"
                  value={warrantySerial}
                  onChange={(e) => setWarrantySerial(e.target.value)}
                  placeholder="e.g. AXC-10029-RCH"
                  required
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-700 font-mono"
                />
              </div>

              {/* Problem description */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">
                  Describe Damage / Failure
                </label>
                <textarea
                  value={warrantyIssue}
                  onChange={(e) => setWarrantyIssue(e.target.value)}
                  placeholder="Explain structural cracks, parts issues, or gear malfunctions..."
                  rows={4}
                  required
                  className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)] placeholder-neutral-700 leading-relaxed"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={warrantySubmitting}
                  className="flex-grow py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:opacity-50 text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  {warrantySubmitting ? "Filing Registry..." : "Submit Claims"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWarrantyModalOpen(false)}
                  className="px-4 py-3 bg-[var(--carbon)] hover:bg-neutral-800 border border-[var(--steel)] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
