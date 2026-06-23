"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { notFound } from "next/navigation";

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export default function OrderInvoicePage({ params }: InvoicePageProps) {
  const orderId = params.id;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoiceData() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("DB offline. Trying simulated storage.");
      }

      // Check simulated storage
      try {
        const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
        const found = currentSimOrders.find((o: any) => o.id === orderId);
        if (found) {
          setOrder({
            id: found.id,
            customer: found.customer,
            email: found.email,
            phone: found.phone,
            date: found.date || new Date().toISOString().split("T")[0],
            total: found.total,
            status: found.status,
            paymentId: found.paymentId || "Mock Bypass",
            address: found.address,
            items: found.items.map((i: any) => ({
              id: i.id || "prod-mock",
              name: i.name,
              qty: i.qty || i.quantity || 1,
              price: i.price,
              gstRate: i.gstRate || 18,
            })),
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error reading simulated orders", e);
      }

      setError("Invoice details not found.");
      setLoading(false);
    }

    loadInvoiceData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[var(--agni)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-wider text-neutral-400">Compiling tax registry details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    notFound();
  }

  // GST Invoice math calculations
  // total is in paise. Divide by 100 to get Rupees.
  let grandTotalTaxable = 0;
  let grandTotalCGST = 0;
  let grandTotalSGST = 0;
  let grandTotalAmount = order.total / 100;

  const invoiceItems = order.items.map((item: any) => {
    const qty = item.qty || 1;
    const itemTotalInclusive = (item.price * qty) / 100; // in Rupees
    const rate = item.gstRate || 18; // percentage (e.g. 18)

    // Calculate backward from inclusive price: Base = Total / (1 + Rate/100)
    const basePrice = itemTotalInclusive / (1 + rate / 100);
    const gstValue = itemTotalInclusive - basePrice;
    
    // CGST and SGST are split evenly 50/50
    const cgst = gstValue / 2;
    const sgst = gstValue / 2;

    grandTotalTaxable += basePrice;
    grandTotalCGST += cgst;
    grandTotalSGST += sgst;

    return {
      ...item,
      basePrice: basePrice / qty, // unit price exclusive of tax
      taxableValue: basePrice,
      cgst,
      sgst,
      total: itemTotalInclusive,
    };
  });

  return (
    <div className="min-h-screen bg-white text-black font-sans p-6 sm:p-12 print:p-0">
      {/* Print Controls Ribbon */}
      <div className="max-w-4xl mx-auto mb-8 bg-neutral-100 p-4 rounded-xl flex justify-between items-center print:hidden border border-neutral-200">
        <Link
          href={`/order/${orderId}`}
          className="text-xs uppercase font-bold tracking-wider text-neutral-600 hover:text-neutral-900 flex items-center space-x-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Tracker</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-white rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <Printer size={14} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Main A4 Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white border border-neutral-300 print:border-none p-8 sm:p-12 print:p-0 rounded-2xl print:rounded-none">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-neutral-900 pb-6 mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-[var(--agni)] font-sans">
              VYORAX
            </h1>
            <p className="text-xs text-neutral-500 font-bold uppercase mt-1">Premium Performance Cycling & Gear</p>
            <div className="text-[10px] text-neutral-600 mt-3 space-y-0.5 leading-normal">
              <div>Vyorax Ranchi HQ, Lalpur Main Road</div>
              <div>Ranchi, Jharkhand - 834001, India</div>
              <div>Email: billing@vyorax.in | Phone: +91 99999 99999</div>
              <div className="font-semibold text-neutral-900 mt-1">GSTIN: 20AAECC1234F1Z5 (Mock Registration)</div>
            </div>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl font-black uppercase text-neutral-900 tracking-wide flex items-center sm:justify-end gap-1.5 font-sans">
              <FileText size={18} className="text-[var(--agni)]" />
              <span>TAX INVOICE</span>
            </h2>
            <div className="text-[10px] text-neutral-600 mt-3 space-y-1 font-mono">
              <div>Invoice No: <span className="font-bold text-neutral-900">{orderId.replace("cm", "VYORAX-")}</span></div>
              <div>Date: <span className="font-bold text-neutral-900">{order.date}</span></div>
              <div>Order Waybill: <span className="font-bold text-neutral-900">{orderId}</span></div>
              <div>Payment Mode: <span className="font-bold text-neutral-900">Prepaid Razorpay</span></div>
              <div>Transaction ID: <span className="font-bold text-neutral-900 text-[9px]">{order.paymentId || "RP-BYPASS-00912"}</span></div>
            </div>
          </div>
        </div>

        {/* Billing and Shipping section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs leading-relaxed">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1.5 mb-2.5">
              Billed To (Customer Details)
            </h3>
            <div className="font-bold text-neutral-800 text-sm">{order.customer}</div>
            <div className="text-neutral-600 mt-1">
              <div>Email: {order.email}</div>
              <div>Phone: {order.phone}</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1.5 mb-2.5">
              Shipping Address
            </h3>
            <div className="text-neutral-700">
              <div className="font-semibold">{order.customer}</div>
              <div>{order.address?.street}</div>
              <div>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</div>
              <div className="font-semibold mt-1">Phone: {order.phone}</div>
            </div>
          </div>
        </div>

        {/* GST Invoice Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse text-[10px] font-sans">
            <thead>
              <tr className="border-y-2 border-neutral-950 bg-neutral-50 uppercase text-[9px] font-bold text-neutral-800">
                <th className="py-2 px-1 w-[4%] text-center">#</th>
                <th className="py-2 px-1 w-[40%]">Product Description</th>
                <th className="py-2 px-1 text-center w-[8%]">Qty</th>
                <th className="py-2 px-1 text-right w-[11%]">Unit Price (excl.)</th>
                <th className="py-2 px-1 text-center w-[8%]">GST %</th>
                <th className="py-2 px-1 text-right w-[10%]">CGST</th>
                <th className="py-2 px-1 text-right w-[10%]">SGST</th>
                <th className="py-2 px-1 text-right w-[12%]">Net Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item: any, index: number) => {
                const rate = item.gstRate || 18;
                return (
                  <tr key={item.id || index} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                    <td className="py-3 px-1 text-center text-neutral-500 font-semibold">{index + 1}</td>
                    <td className="py-3 px-1">
                      <div className="font-bold text-neutral-900">{item.name}</div>
                      <span className="text-[8px] text-neutral-400 font-mono">HSN: 87120010 (Bicycles)</span>
                    </td>
                    <td className="py-3 px-1 text-center font-bold">{item.qty}</td>
                    <td className="py-3 px-1 text-right font-mono">₹{item.basePrice.toFixed(2)}</td>
                    <td className="py-3 px-1 text-center font-mono font-semibold text-neutral-700">
                      <div>{rate}%</div>
                      <div className="text-[8px] text-neutral-400">({rate/2}%+{rate/2}%)</div>
                    </td>
                    <td className="py-3 px-1 text-right font-mono text-neutral-600">₹{item.cgst.toFixed(2)}</td>
                    <td className="py-3 px-1 text-right font-mono text-neutral-600">₹{item.sgst.toFixed(2)}</td>
                    <td className="py-3 px-1 text-right font-bold font-mono">₹{item.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary and GST breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs mb-8">
          <div>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <span className="font-bold uppercase tracking-wider text-neutral-700 text-[10px] block mb-2">
                Tax Declaration & Terms
              </span>
              <p className="text-[9px] text-neutral-600 leading-normal">
                1. This is a computer-generated tax invoice and requires no physical signatures.<br />
                2. Goods once sold are not subject to returns unless covered by Vyorax carbon warranty.<br />
                3. Total GST values shown reflect equal parts Central Goods & Services Tax (CGST) and State Goods & Services Tax (SGST) applicable at Ranchi sector rates.
              </p>
            </div>
          </div>
          <div className="space-y-2.5 text-right">
            <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
              <span className="font-medium text-[10px] uppercase">Total Taxable Value (Base)</span>
              <span className="font-mono">₹{grandTotalTaxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
              <span className="font-medium text-[10px] uppercase">Central Tax (CGST)</span>
              <span className="font-mono">₹{grandTotalCGST.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600 border-b border-neutral-100 pb-1.5">
              <span className="font-medium text-[10px] uppercase">State Tax (SGST)</span>
              <span className="font-mono">₹{grandTotalSGST.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-900 border-t-2 border-neutral-900 pt-2 font-black text-sm uppercase">
              <span>Grand Total (Incl. GST)</span>
              <span className="font-mono text-[var(--agni)] text-base">₹{grandTotalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Acknowledgement */}
        <div className="border-t border-neutral-300 pt-6 mt-12 text-center text-[10px] text-neutral-500 font-sans leading-normal">
          <p className="font-bold text-neutral-800 uppercase tracking-widest mb-1">Thank you for riding with Vyorax Ranchi!</p>
          <p>For support queries, contact support@vyorax.in or +91 99999 99999.</p>
        </div>

      </div>
    </div>
  );
}
