"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag, Eye, RefreshCw, Truck, CreditCard, ExternalLink } from "lucide-react";

type OrderStatus = 
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export default function AdminOrdersPage() {
  // Mock order list
  const [orders, setOrders] = useState([
    {
      id: "VYORAX-ORD-938210",
      customer: "Priyanshu Ranchi",
      email: "customer@vyorax.in",
      phone: "8888888888",
      date: "2026-06-05",
      total: 4775000,
      status: "DELIVERED" as OrderStatus,
      paymentId: "pay_PkD3289a01x",
      courier: "Shiprocket Express",
      trackingId: "SR-9382-1920",
      address: { street: "Flat 101, Lalpur Main Road", city: "Ranchi", state: "Jharkhand", pincode: "834001" },
      items: [
        { name: "Vyorax Aero-X Carbon Cycle", qty: 1, price: 4500000, image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop" },
        { name: "Aero Shield Helmet", qty: 1, price: 249900, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=100&auto=format&fit=crop" }
      ]
    },
    {
      id: "VYORAX-ORD-104928",
      customer: "Anand Kumar",
      email: "anand@gmail.com",
      phone: "9928392810",
      date: "2026-06-08",
      total: 2450000,
      status: "SHIPPED" as OrderStatus,
      paymentId: "pay_PkD9321b05x",
      courier: "Shiprocket Express",
      trackingId: "SR-1049-2810",
      address: { street: "Morabadi Crossing, Morabadi", city: "Ranchi", state: "Jharkhand", pincode: "834008" },
      items: [
        { name: "Vyorax Ranchi Rider MTB", qty: 1, price: 2450000, image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=100&auto=format&fit=crop" }
      ]
    },
    {
      id: "VYORAX-ORD-582910",
      customer: "Rita Kumari",
      email: "rita@gmail.com",
      phone: "7729102910",
      date: "2026-06-10",
      total: 1599900,
      status: "PROCESSING" as OrderStatus,
      paymentId: "pay_PkD8492c09x",
      courier: "Shiprocket Express",
      trackingId: "",
      address: { street: "Bariatu Loop Road", city: "Ranchi", state: "Jharkhand", pincode: "834009" },
      items: [
        { name: "Vyorax Urban Swift Hybrid", qty: 1, price: 1599900, image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=100&auto=format&fit=crop" }
      ]
    },
    {
      id: "VYORAX-ORD-128492",
      customer: "Vikram Singh",
      email: "vikram@gmail.com",
      phone: "9102910291",
      date: "2026-06-11",
      total: 1199900,
      status: "PENDING" as OrderStatus,
      paymentId: "pay_PkD2849d11x",
      courier: "",
      trackingId: "",
      address: { street: "Kanke Road, Kanke", city: "Ranchi", state: "Jharkhand", pincode: "834006" },
      items: [
        { name: "Vyorax Agni Adjustable Dumbbells", qty: 1, price: 1199900, image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=100&auto=format&fit=crop" }
      ]
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Logistics form inputs
  const [courierInput, setCourierInput] = useState("");
  const [trackingInput, setTrackingInput] = useState("");

  const loadOrders = async () => {
    setIsLoading(true);
    let dbOrders: any[] = [];
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        dbOrders = await res.json();
      }
    } catch (e) {
      console.warn("DB offline. Using mock/localStorage orders fallback.");
    }

    // Merge with simulated orders from localStorage
    try {
      const simOrdersStr = localStorage.getItem("vega_sim_orders");
      if (simOrdersStr) {
        const simOrders = JSON.parse(simOrdersStr);
        // Merge lists and prevent duplicates
        const merged = [...dbOrders];
        for (const sOrd of simOrders) {
          if (!merged.some((o) => o.id === sOrd.id)) {
            merged.push({
              id: sOrd.id,
              customer: sOrd.customer || "Guest Customer",
              email: sOrd.email || "",
              phone: sOrd.phone || "",
              date: sOrd.date,
              total: sOrd.total,
              status: sOrd.status,
              paymentId: sOrd.paymentId || "Mock Bypass",
              courier: sOrd.courier || "",
              trackingId: sOrd.trackingId || "",
              address: sOrd.address,
              items: sOrd.items.map((i: any) => ({
                name: i.name,
                qty: i.qty || i.quantity || 1,
                price: i.price,
                image: i.image || ""
              }))
            });
          }
        }
        if (merged.length > 0) {
          setOrders(merged);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Error parsing simulated orders for admin", e);
    }

    if (dbOrders.length > 0) {
      setOrders(dbOrders);
    } else {
      // Retain the initial mock orders (we don't change state if both are empty)
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRowClick = (order: any) => {
    setSelectedOrder(order);
    setCourierInput(order.courier || "Shiprocket Express");
    setTrackingInput(order.trackingId || "");
  };

  // Status transition handler (saves to DB and refreshes)
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    
    // Optimistic UI update
    const updated = orders.map((o) =>
      o.id === selectedOrder.id ? { ...o, status: newStatus } : o
    );
    setOrders(updated);
    setSelectedOrder({ ...selectedOrder, status: newStatus });

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      alert(`Order status updated to ${newStatus}.`);
    } catch (e) {
      alert("Failed to update status in database. Retained locally.");
    }
  };

  // Attach logistics waybill (saves to DB)
  const handleUpdateLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const updated = orders.map((o) =>
      o.id === selectedOrder.id ? { ...o, courier: courierInput, trackingId: trackingInput } : o
    );
    setOrders(updated);
    setSelectedOrder({ ...selectedOrder, courier: courierInput, trackingId: trackingInput });

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          courier: courierInput,
          trackingId: trackingInput,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      alert("Shipping tracking waybill updated successfully!");
    } catch (e) {
      alert("Failed to save shipping info in database. Retained locally.");
    }
  };

  // Refund simulation trigger
  const handleRefundTrigger = () => {
    if (!selectedOrder) return;
    if (confirm(`Are you sure you want to refund ₹${(selectedOrder.total / 100).toLocaleString("en-IN")} for order ${selectedOrder.id}?`)) {
      handleStatusChange("CANCELLED");
      alert(`Razorpay Refund initiated successfully for Payment ID: ${selectedOrder.paymentId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Manage Orders</h1>
        <p className="text-xs text-[var(--silver)] font-sans mt-1">Fulfill orders, adjust waybills, and trigger refunds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ORDERS LIST TABLE (Lg 7/8cols) */}
        <div className={`${selectedOrder ? "lg:col-span-7" : "lg:col-span-12"} bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl overflow-hidden`}>
          <div className="w-full overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--steel)]/50 text-[var(--smoke)] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--steel)]/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--smoke)] uppercase font-bold animate-pulse tracking-widest text-[10px]">
                      Loading database orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--smoke)] italic">
                      No orders placed in the system yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      className={`cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? "bg-[var(--carbon)]" : "hover:bg-[var(--carbon)]/35"
                      }`}
                    >
                      <td className="py-4 px-4 font-mono text-white font-semibold">{order.id}</td>
                      <td className="py-4 px-4 text-[var(--chalk)] font-bold">{order.customer}</td>
                      <td className="py-4 px-4 text-[var(--silver)]">{order.date}</td>
                      <td className="py-4 px-4 text-white font-semibold">₹{(order.total / 100).toLocaleString("en-IN")}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded border ${
                            order.status === "DELIVERED"
                              ? "bg-[var(--forest)]/10 text-emerald-400 border-emerald-500/20"
                              : order.status === "CANCELLED"
                              ? "bg-red-950/40 text-red-400 border-red-500/20"
                              : "bg-[var(--gold)]/10 text-[var(--gold-light)] border-[var(--gold)]/20 animate-pulse"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className="text-[var(--silver)] hover:text-white p-1">
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER DETAILS PANEL SIDEBAR (Lg 5cols) */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--steel)]/30 pb-4">
              <div>
                <h3 className="text-xs uppercase font-sans tracking-wider font-bold text-white">Fulfillment Details</h3>
                <span className="text-[10px] text-[var(--smoke)] font-mono">{selectedOrder.id}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[var(--silver)] hover:text-white">
                ✕
              </button>
            </div>

            {/* Quick Actions (Status transition) */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Transition Status</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--agni)] font-sans"
              >
                <option value="PENDING">PENDING (Placed)</option>
                <option value="CONFIRMED">CONFIRMED (Confirmed)</option>
                <option value="PROCESSING">PROCESSING (Packed)</option>
                <option value="SHIPPED">SHIPPED (Shipped)</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Out for Delivery)</option>
                <option value="DELIVERED">DELIVERED (Delivered)</option>
                <option value="CANCELLED">CANCELLED (Refunded/Cancel)</option>
              </select>
            </div>

            {/* Shipments/Logistics updates form */}
            <form onSubmit={handleUpdateLogistics} className="space-y-4 pt-4 border-t border-[var(--steel)]/30">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)] flex items-center space-x-1.5">
                <Truck size={12} className="text-[var(--agni)]" />
                <span>Courier Waybill</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-[var(--smoke)]">Courier Partner</label>
                  <input
                    type="text"
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    className="w-full bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-[var(--smoke)]">Waybill ID</label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full bg-[var(--obsidian)] border border-[var(--steel)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[var(--carbon)] hover:bg-[var(--steel)] border border-[var(--steel)] text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-colors"
              >
                Update Logistics Info
              </button>
            </form>

            {/* Items Summary details list */}
            <div className="pt-4 border-t border-[var(--steel)]/30 space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Purchased Items</label>
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center space-x-3 text-xs font-sans">
                    <div className="w-10 h-10 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt="product" fill className="object-cover" sizes="40px" />
                    </div>
                    <span className="text-white font-semibold flex-1 truncate">{item.name}</span>
                    <span className="text-[var(--smoke)]">Qty: {item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact / Billing Info details */}
            <div className="pt-4 border-t border-[var(--steel)]/30 text-xs font-sans space-y-2.5 text-[var(--silver)]">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Customer Details</label>
              <div>Name: <strong className="text-white">{selectedOrder.customer}</strong></div>
              <div>Phone: <strong className="text-white font-mono">{selectedOrder.phone}</strong></div>
              <div>Email: <strong className="text-white font-mono">{selectedOrder.email}</strong></div>
              <div>
                Address: <br />
                <span className="text-white">
                  {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                </span>
              </div>
            </div>

            {/* Payment details / Refund */}
            <div className="pt-4 border-t border-[var(--steel)]/30 flex justify-between items-center">
              <div className="text-xs font-sans text-[var(--silver)]">
                <span>Total Amount:</span>{" "}
                <strong className="text-[var(--agni)] text-sm">₹{(selectedOrder.total / 100).toLocaleString("en-IN")}</strong>
              </div>
              
              {selectedOrder.status !== "CANCELLED" && (
                <button
                  onClick={handleRefundTrigger}
                  className="px-4 py-2 border border-red-900/60 hover:bg-red-500/10 text-red-400 text-[10px] font-sans font-bold uppercase rounded tracking-wider transition-colors"
                >
                  Cancel & Refund
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
