"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Percent, ShoppingBag, BarChart3, AlertCircle } from "lucide-react";

export default function AdminAnalyticsPage() {
  // Sales Category comparison
  const categoryData = [
    { name: "Cycles", sales: 1250000, margin: 40 },
    { name: "Fitness", sales: 340000, margin: 35 },
    { name: "Sports Gear", sales: 125000, margin: 48 },
  ];

  // Monthly revenue trend (Rs)
  const monthlyData = [
    { month: "Jan", revenue: 250000 },
    { month: "Feb", revenue: 380000 },
    { month: "Mar", revenue: 520000 },
    { month: "Apr", revenue: 410000 },
    { month: "May", revenue: 680000 },
    { month: "Jun", revenue: 720000 },
  ];

  // Conversion rates (sessions vs checkouts vs orders)
  const conversionData = [
    { name: "Jun 05", sessions: 250, checkout: 45, orders: 12 },
    { name: "Jun 06", sessions: 380, checkout: 80, orders: 24 },
    { name: "Jun 07", sessions: 490, checkout: 110, orders: 35 },
    { name: "Jun 08", sessions: 310, checkout: 62, orders: 18 },
    { name: "Jun 09", sessions: 420, checkout: 90, orders: 28 },
    { name: "Jun 10", sessions: 580, checkout: 130, orders: 48 },
    { name: "Jun 11", sessions: 520, checkout: 115, orders: 40 },
  ];

  const stats = [
    { label: "Abandoned Cart Rate", value: "32.4%", desc: "-4% from last month", icon: Percent, color: "text-[var(--agni)]" },
    { label: "Average Order Value (AOV)", value: "₹24,500", desc: "+8% from last month", icon: ShoppingBag, color: "text-[var(--gold)]" },
    { label: "Traffic Conversion Rate", value: "3.8%", desc: "+0.5% from last week", icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-sans font-bold text-white uppercase tracking-wider">Business Analytics</h1>
        <p className="text-xs text-[var(--silver)] font-sans mt-1">Review revenue curves, conversion metrics, and category margins.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--smoke)] font-bold">{item.label}</span>
                <Icon size={16} className={item.color} />
              </div>
              <div>
                <p className="text-2xl font-display font-extrabold text-white">{item.value}</p>
                <span className="text-[10px] text-[var(--smoke)] font-sans">{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Revenue Trend */}
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white mb-6 border-b border-[var(--steel)]/30 pb-4">
            Monthly Sales Progression (₹)
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--carbon)", border: "1px solid var(--steel)" }}
                  labelStyle={{ color: "white", fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--agni)"
                  strokeWidth={2.5}
                  name="Monthly Revenue"
                  dot={{ r: 4, fill: "var(--agni)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white mb-6 border-b border-[var(--steel)]/30 pb-4">
            Category Sales Performance (₹)
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--carbon)", border: "1px solid var(--steel)" }}
                  labelStyle={{ color: "white", fontSize: 10 }}
                />
                <Bar dataKey="sales" name="Sales (₹)" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel Curve */}
        <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white mb-6 border-b border-[var(--steel)]/30 pb-4">
            Checkout Funnel Traffic Conversion (Daily Sessions vs Orders)
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--smoke)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--carbon)", border: "1px solid var(--steel)" }}
                  labelStyle={{ color: "white", fontSize: 10 }}
                />
                <Area type="monotone" dataKey="sessions" stroke="var(--silver)" fill="rgba(168,168,168,0.05)" name="Sessions" />
                <Area type="monotone" dataKey="checkout" stroke="var(--gold)" fill="rgba(200,151,58,0.05)" name="Checkouts Initiated" />
                <Area type="monotone" dataKey="orders" stroke="var(--agni)" fill="rgba(255,77,26,0.05)" name="Completed Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
