"use client";

import { useState, useEffect } from "react";
import { Wrench, CheckCircle, Shield, Truck, HelpCircle } from "lucide-react";
import BookingWizardModal from "@/components/store/BookingWizardModal";
import { MOCK_SERVICE_PACKAGES } from "@/lib/mockData";

export default function ServicingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/packages?type=SERVICING");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setPlans(data);
            setSelectedPlan(data[0]);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch servicing plans", e);
      }

      // Local storage fallback
      const saved = localStorage.getItem("vega_sim_packages");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(
              (p: any) => p.type === "SERVICING" && p.isActive !== false,
            );
            if (filtered.length > 0) {
              setPlans(filtered);
              setSelectedPlan(filtered[0]);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Failed to parse simulated packages");
        }
      }

      // Default fallback
      const fallback = MOCK_SERVICE_PACKAGES.filter(
        (p) => p.type === "SERVICING" && p.isActive,
      );
      setPlans(fallback);
      setSelectedPlan(fallback[0]);
      setLoading(false);
    }
    loadPlans();
  }, []);

  const handleBookClick = (plan: any) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const faqs = [
    {
      q: "How often should I get my cycle serviced?",
      a: "For casual riders, we recommend a General Care service every 3-4 months. Regular commuters or off-road riders should opt for a Deep Tuning every 6 months, while high-mileage cyclists benefit from an annual Elite Overhaul.",
    },
    {
      q: "How does the home pick-up & delivery service work?",
      a: "Once you book a service, our Ranchi workshop manager will call you to schedule a pick-up. We collect your bike, perform the service at our garage, and deliver it back to your doorstep fully assembled.",
    },
    {
      q: "Do you charge extra for Ranchi home pickup & delivery?",
      a: "No! Premium Ranchi pick-up and delivery are completely free for all Servicing plans.",
    },
    {
      q: "What if my bike needs replacement parts?",
      a: "If we diagnose worn-out components (like chains, cables, or pads) during servicing, we will contact you with a cost estimate before replacing them. You will only pay the standard retail price for parts.",
    },
  ];

  return (
    <div className="bg-[#F9FAFB] min-h-screen text-neutral-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Banner Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[var(--agni)] text-xs font-sans font-bold uppercase tracking-wider">
            <Wrench size={12} />
            <span>Ranchi Workshop Garage</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-neutral-900 leading-tight">
            Professional Cycle Servicing
          </h1>
          <p className="text-sm md:text-base text-neutral-600 font-sans leading-relaxed">
            From precision gear indexing to full strip-down mechanical
            overhauls. Schedule a doorstep pickup in Ranchi and let our
            certified mechanics keep your ride in peak condition.
          </p>
        </div>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
            <Truck className="text-[var(--agni)]" size={24} />
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-neutral-900">
              Free Doorstep Pickup
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              We collect your bicycle from your location in Ranchi and return it
              serviced and detailed within 24-48 hours.
            </p>
          </div>
          <div className="p-6 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
            <Shield className="text-[var(--gold)]" size={24} />
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-neutral-900">
              Certified Mechanics
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              All services are performed by Shimano-certified technicians using
              specialized tools and professional grade greases.
            </p>
          </div>
          <div className="p-6 bg-[var(--charcoal)] border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
            <CheckCircle className="text-emerald-650" size={24} />
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-neutral-900">
              Service Warranty
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              Every service plan comes with a 10-day post-service warranty on
              tuning and alignment adjustments.
            </p>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-extrabold uppercase text-neutral-900 tracking-wider">
              Select Servicing Plan
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-sans">
              Transparent flat pricing. No hidden fees.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-[var(--charcoal)]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--agni)]"></div>
              <p className="text-xs text-neutral-500 mt-2 font-sans">
                Loading packages...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isPopular =
                  plan.name.includes("Deep") || plan.name.includes("Premium");
                return (
                  <div
                    key={plan.id || plan.name}
                    className={`relative flex flex-col justify-between border rounded-2xl bg-[var(--charcoal)] shadow-sm hover:shadow-md transition-all p-6 min-h-[460px] h-full ${
                      isPopular
                        ? "border-[var(--agni)] ring-1 ring-[var(--agni)]/30"
                        : "border-neutral-200"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--agni)] text-neutral-50 text-[9px] font-sans font-bold uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-sans font-bold uppercase tracking-wider text-neutral-900">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-neutral-500 font-sans mt-1 line-clamp-2">
                          {plan.desc}
                        </p>
                      </div>

                      <div className="flex items-baseline space-x-1 border-y border-neutral-100 py-3.5">
                        <span className="text-3xl font-display font-black text-neutral-900">
                          ₹{plan.price}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-sans font-bold uppercase tracking-wider">
                          / package
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                          What's Included:
                        </span>
                        {plan.includes.map((inc: string) => (
                          <div
                            key={inc}
                            className="flex items-start space-x-2.5 text-xs text-neutral-700"
                          >
                            <CheckCircle
                              className="text-emerald-600 mt-0.5 flex-shrink-0"
                              size={12}
                            />
                            <span className="font-sans font-medium">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookClick(plan)}
                      className={`w-full py-3 mt-6 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                        isPopular
                          ? "bg-[var(--agni)] hover:bg-orange-500 text-neutral-50"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-850"
                      }`}
                    >
                      Book Service Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-extrabold uppercase text-neutral-900 tracking-wider">
              Servicing FAQs
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-sans">
              Everything you need to know about our Ranchi service network.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="border border-neutral-200 rounded-xl overflow-hidden bg-[var(--charcoal)] shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex justify-between items-center p-4 text-left font-sans text-xs font-bold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-50"
                  >
                    <span>{faq.q}</span>
                    <HelpCircle
                      size={14}
                      className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 border-t border-neutral-100 text-xs text-neutral-600 font-sans leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Wizard Modal */}
      {selectedPlan && (
        <BookingWizardModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          bookingType="SERVICING"
          initialPlanName={selectedPlan.name}
          initialPlanPrice={selectedPlan.price}
          availablePlans={plans.map((p) => ({
            name: p.name,
            price: p.price,
            desc: p.desc,
          }))}
        />
      )}
    </div>
  );
}
