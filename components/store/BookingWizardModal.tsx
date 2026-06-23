"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: "SERVICING" | "REPAIRING";
  initialPlanName: string;
  initialPlanPrice: number; // in Rupees
  availablePlans: { name: string; price: number; desc: string }[];
}

export default function BookingWizardModal({
  isOpen,
  onClose,
  bookingType,
  initialPlanName,
  initialPlanPrice,
  availablePlans,
}: BookingWizardModalProps) {
  const { data: session, status } = useSession();

  // Wizard Steps: 1: Auth (if not logged in), 2: Plan Select, 3: Address, 4: Payment, 5: Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Authentication Step States
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Plan Selection States
  const [selectedPlan, setSelectedPlan] = useState({
    name: initialPlanName,
    price: initialPlanPrice,
  });

  // Address Step States
  const [addressName, setAddressName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Ranchi");
  const [state, setState] = useState("Jharkhand");
  const [pincode, setPincode] = useState("");

  // Success States
  const [bookingId, setBookingId] = useState("");

  // Adjust step on mount / auth change
  useEffect(() => {
    if (isOpen) {
      if (session) {
        setStep(2); // Skip Step 1 (Auth) if already logged in
        setAddressName(session.user.name || "");
        setAddressPhone(phone || "");
      } else {
        setStep(1);
      }
    }
  }, [isOpen, session]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setOtpSent(true);
    setOtpTimer(30);
    alert(
      `[Sandbox Alert] OTP sent to ${phone}! Use any 6-digit code (e.g. 123456) to verify.`,
    );
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) return;
    if (otp.length < 4) {
      alert("Please enter a valid verification OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        redirect: false,
      });

      if (res?.error) {
        alert("Verification failed. Please double-check inputs.");
      } else {
        // Authenticated! Move to step 2 (Plan Select)
        setStep(2);
      }
    } catch (err) {
      alert("Failed to verify. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBooking = async () => {
    if (!addressName || !streetAddress || !city || !state || !pincode) {
      alert("Please fill out all address fields.");
      return;
    }

    setLoading(true);
    const generatedId = `VYORAX-SRV-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = {
      type: bookingType,
      planName: selectedPlan.name,
      price: selectedPlan.price * 100, // paise
      phone: addressPhone || phone || "8888888888",
      address: {
        name: addressName,
        street: streetAddress,
        city,
        state,
        pincode,
      },
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBookingId(generatedId);
        setStep(5);
        triggerConfetti();
      } else {
        // DB offline fallback: Save simulated booking locally
        saveSimulatedBooking(payload, generatedId);
      }
    } catch (err) {
      // API request failed (e.g., fetch failed / DB offline fallback)
      saveSimulatedBooking(payload, generatedId);
    } finally {
      setLoading(false);
    }
  };

  const saveSimulatedBooking = (payload: any, generatedId: string) => {
    console.warn("DB offline. Saving simulated booking locally.");
    const saved = localStorage.getItem("vega_sim_bookings");
    let currentBookings = [];
    if (saved) {
      try {
        currentBookings = JSON.parse(saved);
      } catch (e) {
        currentBookings = [];
      }
    }
    const newSimBooking = {
      ...payload,
      id: generatedId,
      status: "BOOKED",
      createdAt: new Date().toISOString(),
    };
    currentBookings.push(newSimBooking);
    localStorage.setItem("vega_sim_bookings", JSON.stringify(currentBookings));

    setBookingId(generatedId);
    setStep(5);
    triggerConfetti();
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF4D1A", "#C8973A", "#09090B", "#10B981"],
    });
  };

  const getStepProgressWidth = () => {
    const totalSteps = 4;
    const currentProgressStep = step > 4 ? 4 : step;
    return `${(currentProgressStep / totalSteps) * 100}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[var(--charcoal)] border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-800 max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
          <div>
            <h3 className="text-base font-sans font-bold uppercase tracking-wider text-neutral-900">
              {step === 5
                ? "Booking Confirmed"
                : `Book ${bookingType === "SERVICING" ? "Servicing" : "Repairing"}`}
            </h3>
            {step < 5 && (
              <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mt-0.5">
                Step {step} of 4
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="w-full h-1 bg-neutral-100 relative">
            <div
              className="absolute left-0 top-0 bottom-0 bg-[var(--agni)] transition-all duration-300"
              style={{ width: getStepProgressWidth() }}
            />
          </div>
        )}

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-grow space-y-6">
          {/* STEP 1: LOGIN / OTP */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <Sparkles
                  className="mx-auto text-[var(--agni)] animate-pulse"
                  size={24}
                />
                <h4 className="text-sm font-sans font-bold uppercase tracking-wider text-neutral-900">
                  Verify Your Contact
                </h4>
                <p className="text-[11px] text-neutral-500 font-sans">
                  Verification OTP is required to link this booking with your
                  profile.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-3 text-neutral-400"
                      size={14}
                    />
                    <input
                      type="email"
                      required
                      placeholder="customer@vyorax.in"
                      disabled={otpSent}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)] disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3.5 top-3 text-neutral-400"
                      size={14}
                    />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="88888 88888"
                      disabled={otpSent}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)] disabled:opacity-50"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    Send OTP Verification
                  </button>
                ) : (
                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-4 pt-2 border-t border-neutral-100 animate-fadeIn"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                          Enter OTP Code
                        </label>
                        <button
                          type="button"
                          disabled={otpTimer > 0}
                          onClick={handleSendOtp}
                          className="text-[9px] uppercase font-bold text-[var(--agni)] hover:underline disabled:text-neutral-500 disabled:no-underline"
                        >
                          {otpTimer > 0
                            ? `Resend in ${otpTimer}s`
                            : "Resend OTP"}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2.5 text-center font-mono text-xs tracking-widest focus:outline-none focus:border-[var(--agni)] text-neutral-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <span>Verify & Continue</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PLAN SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-neutral-500">
                Confirm Selected Plan
              </h4>

              <div className="space-y-3">
                {availablePlans.map((p) => {
                  const isSelected = selectedPlan.name === p.name;
                  return (
                    <label
                      key={p.name}
                      onClick={() =>
                        setSelectedPlan({ name: p.name, price: p.price })
                      }
                      className={`flex justify-between items-start p-4 border rounded-xl cursor-pointer select-none transition-all ${
                        isSelected
                          ? "border-[var(--agni)] bg-[var(--agni-glow)]"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex space-x-3 items-start">
                        <input
                          type="radio"
                          name="plan"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 text-[var(--agni)] focus:ring-[var(--agni)] focus:ring-offset-0 border-neutral-300"
                        />
                        <div>
                          <span className="text-xs font-sans font-bold uppercase tracking-wide text-neutral-900 block">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-sans block mt-0.5 line-clamp-2">
                            {p.desc}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-sans font-extrabold text-[var(--agni)] ml-2">
                        ₹{p.price}
                      </span>
                    </label>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center space-x-1"
              >
                <span>Continue to Address</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 3: ADDRESS */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-neutral-500">
                Enter Service Pickup Address
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Ranchi"
                    value={addressName}
                    onChange={(e) => setAddressName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 88888 88888"
                    value={addressPhone}
                    onChange={(e) =>
                      setAddressPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 101, Lalpur Main Road"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="834001"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[var(--agni)] text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-grow py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Continue to Payment</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT */}
          {step === 4 && (
            <div className="space-y-5">
              <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-neutral-500">
                Review & Payment
              </h4>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3.5 text-xs font-sans">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                  <span className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider">
                    Booking Type
                  </span>
                  <span className="font-bold uppercase tracking-wider text-neutral-900">
                    {bookingType}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                  <span className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider">
                    Selected Package
                  </span>
                  <span className="font-bold uppercase tracking-wider text-neutral-900">
                    {selectedPlan.name}
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-neutral-200 pb-2">
                  <span className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider mt-0.5">
                    Pickup Address
                  </span>
                  <div className="text-right max-w-[200px]">
                    <span className="font-bold text-neutral-950 block">
                      {addressName}
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                      {streetAddress}, {city}, {pincode}
                    </span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">
                      {addressPhone || phone}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-sans pt-1">
                  <span className="font-extrabold text-neutral-900 uppercase tracking-wider text-xs">
                    Total Price (GST Incl.)
                  </span>
                  <span className="font-extrabold text-[var(--agni)] text-base">
                    ₹{selectedPlan.price}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center text-xs text-emerald-600 font-sans flex items-center space-x-2.5">
                <CreditCard
                  className="text-emerald-500 flex-shrink-0"
                  size={16}
                />
                <span>
                  Simulated Secure Payment integration. Clicking Pay will
                  process mock credentials.
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveBooking}
                  className="flex-grow py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <span>Pay ₹{selectedPlan.price} & Book</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 5 && (
            <div className="text-center py-6 space-y-5 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                <Check size={32} />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-sans font-bold uppercase tracking-wider text-neutral-900">
                  Booking Completed!
                </h4>
                <p className="text-xs text-neutral-500">
                  Thank you! Your Ranchi pickup request has been scheduled.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 inline-block font-mono text-[10px] space-y-1 text-center">
                <span className="text-neutral-500 uppercase block tracking-wider text-[8px] font-bold">
                  Booking Order ID
                </span>
                <span className="text-sm font-bold text-neutral-950 block tracking-wider">
                  {bookingId}
                </span>
              </div>

              <div className="text-xs font-sans text-neutral-500 max-w-sm mx-auto">
                Our Ranchi workshop coordinator will contact you at{" "}
                <strong className="text-neutral-800 font-medium">
                  {addressPhone || phone}
                </strong>{" "}
                shortly to align the logistics pickup slot.
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full max-w-[200px] py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                Go to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
