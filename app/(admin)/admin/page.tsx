"use client";

import Link from "next/link";
import { 
  TrendingUp, ShoppingCart, ShieldAlert, Award, 
  ArrowRight, AlertTriangle, UserMinus, Star
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";

export default function AdminOverviewPage() {
  // Mock analytics stats
  const kpis = [
    { label: "Today's Revenue", value: "₹1,45,000", desc: "+12% from yesterday", icon: TrendingUp, color: "text-[var(--agni)]" },
    { label: "Orders Today", value: "14", desc: "4 pending fulfillment", icon: ShoppingCart, color: "text-[var(--gold-light)]" },
    { label: "Low Stock Alerts", value: "2", desc: "Action required", icon: AlertTriangle, color: "text-red-400" },
    { label: "Abandoned Carts", value: "8", desc: "Delay: 1 Hour recovery active", icon: UserMinus, color: "text-indigo-400" },
  ];

  // Mock sales charts details (last 7 days for compact local view)
  const salesData = [
    { day: "Jun 05", sales: 45000, orders: 1 },
    { day: "Jun 06", sales: 89000, orders: 3 },
    { day: "Jun 07", sales: 120000, orders: 4 },
    { day: "Jun 08", sales: 74000, orders: 2 },
    { day: "Jun 09", sales: 110000, orders: 3 },
    { day: "Jun 10", sales: 165000, orders: 5 },
    { day: "Jun 11", sales: 145000, orders: 4 },
  ];

  const recentOrders = [
    { id: "VYORAX-ORD-938210", customer: "Priyanshu Ranchi", date: "Jun 05", total: 4775000, status: "DELIVERED" },
    { id: "VYORAX-ORD-104928", customer: "Anand Kumar", date: "Jun 08", total: 2450000, status: "SHIPPED" },
    { id: "VYORAX-ORD-582910", customer: "Rita Kumari", date: "Jun 10", total: 1599900, status: "PROCESSING" },
    { id: "VYORAX-ORD-128492", customer: "Vikram Singh", date: "Jun 11", total: 1199900, status: "PENDING" },
  ];

  const lowStockProducts = [
    { sku: "VYORAX-CYC-USWIFT", name: "Vyorax Urban Swift Hybrid", stock: 2 },
    { sku: "VYORAX-CYC-AEROX", name: "Vyorax Aero-X Carbon", stock: 4 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Dashboard Overview</h1>
        <p className="text-xs text-[var(--silver)] font-sans mt-1">Realtime analytics logs and order fullfilments.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--smoke)] font-bold">{kpi.label}</span>
                <Icon size={16} className={kpi.color} />
              </div>
              <div>
                <p className="text-2xl font-display font-extrabold text-white">{kpi.value}</p>
                <span className="text-[10px] text-[var(--smoke)] font-sans">{kpi.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Revenue line chart card (Lg 8cols) */}
        <div className="lg:col-span-8 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--steel)]/30 pb-4">
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white">Weekly Revenue (₹)</h3>
            <span className="text-[10px] font-sans font-bold text-[var(--gold)] uppercase">Ranchi Sales Curve</span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--carbon)", border: "1px solid var(--steel)" }}
                  labelStyle={{ color: "white", fontSize: 10 }}
                  itemStyle={{ color: "var(--agni-light)", fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales (₹)"
                  stroke="var(--agni)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--agni)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low stock card alerts (Lg 4cols) */}
        <div className="lg:col-span-4 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--steel)]/30 pb-4">
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white">Low Stock Alerts</h3>
              <ShieldAlert size={16} className="text-red-400" />
            </div>

            <div className="space-y-3.5">
              {lowStockProducts.map((p) => (
                <div key={p.sku} className="p-3 bg-[var(--obsidian)] border border-[var(--steel)]/40 rounded-lg flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{p.name}</p>
                    <span className="text-[9px] text-[var(--smoke)] uppercase font-mono">{p.sku}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 font-bold border border-red-500/20 text-[10px]">
                    {p.stock} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--steel)]/30 mt-6 text-center">
            <Link
              href="/admin/products"
              className="text-[10px] uppercase tracking-wider text-[var(--gold)] hover:text-white font-bold font-sans inline-flex items-center space-x-1"
            >
              <span>Manage Garage stock</span>
              <ArrowRight size={10} />
            </Link>
          </div>
        </div>

      </div>

      {/* Recent orders table section */}
      <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5">
        <div className="flex justify-between items-center mb-6 border-b border-[var(--steel)]/30 pb-4">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white">Recent Orders (Fulfillment Queue)</h3>
          <Link
            href="/admin/orders"
            className="text-[10px] uppercase tracking-wider text-[var(--silver)] hover:text-white font-bold font-sans"
          >
            Full Queue →
          </Link>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--steel)]/50 text-[var(--smoke)] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--steel)]/30">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--carbon)]/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-white font-semibold">
                    <Link href={`/admin/orders?id=${order.id}`} className="hover:text-[var(--agni-light)]">{order.id}</Link>
                  </td>
                  <td className="py-3.5 px-4 text-[var(--chalk)] font-bold">{order.customer}</td>
                  <td className="py-3.5 px-4 text-[var(--silver)]">{order.date}</td>
                  <td className="py-3.5 px-4 text-white font-semibold">₹{(order.total / 100).toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded border ${
                        order.status === "DELIVERED"
                          ? "bg-[var(--forest)]/10 text-emerald-400 border-emerald-500/20"
                          : "bg-[var(--gold)]/10 text-[var(--gold-light)] border-[var(--gold)]/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
