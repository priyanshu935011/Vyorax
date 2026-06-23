"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, useSettingsStore } from "@/lib/store";
import { CreditCard, CheckCircle, MapPin, Truck, ShieldAlert, Sparkles, ShoppingBag } from "lucide-react";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Ranchi");
  const [state, setState] = useState("Jharkhand");
  const [pincode, setPincode] = useState("");
  
  // Checkout status states
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"checkout" | "success">("checkout");

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "emi">("razorpay");
  const [selectedEmiBank, setSelectedEmiBank] = useState("hdfc");
  const [selectedEmiMonths, setSelectedEmiMonths] = useState(3);
  const { emiConfig } = useSettingsStore();

  useEffect(() => {
    if (emiConfig?.banks?.length > 0) {
      const firstEnabled = emiConfig.banks.find((b: any) => b.enabled);
      if (firstEnabled) {
        setSelectedEmiBank(firstEnabled.id);
      }
    }
  }, [emiConfig]);

  // Saved address for fast checkout simulation
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  // City serviceability and delivery fee states
  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const [checkingCity, setCheckingCity] = useState(false);
  const [cityError, setCityError] = useState("");
  const [deliveryFeeStandard, setDeliveryFeeStandard] = useState(25000);
  const [deliveryFeeCycle, setDeliveryFeeCycle] = useState(50000);
  const [freeShippingMinThreshold, setFreeShippingMinThreshold] = useState(500000);
  const [couponDetails, setCouponDetails] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0); // in paise

  // Loyalty states
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(10);
  const [availablePoints, setAvailablePoints] = useState(0);

  useEffect(() => {
    // Check if there is some cart items, if not redirecting is handled in UI
    const saved = localStorage.getItem("vega_saved_address");
    if (saved) {
      setHasSavedAddress(true);
      const parsed = JSON.parse(saved);
      setEmail(parsed.email || "");
      setName(parsed.name || "");
      setPhone(parsed.phone || "");
      setStreet(parsed.street || "");
      setCity(parsed.city || "Ranchi");
      setState(parsed.state || "Jharkhand");
      setPincode(parsed.pincode || "");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.vegaPoints !== undefined) {
            setAvailablePoints(data.vegaPoints);
          }
        })
        .catch(() => {
          const saved = localStorage.getItem("vega_sim_points");
          setAvailablePoints(saved ? Number(saved) : 250);
        });

      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.homepageConfig?.loyaltyConfig?.maxRedeemPercent !== undefined) {
            setMaxRedeemPercent(Number(data.homepageConfig.loyaltyConfig.maxRedeemPercent));
          }
        })
        .catch(() => {
          const saved = localStorage.getItem("vega_sim_settings");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.homepageConfig?.loyaltyConfig?.maxRedeemPercent !== undefined) {
                setMaxRedeemPercent(Number(parsed.homepageConfig.loyaltyConfig.maxRedeemPercent));
              }
            } catch (e) {}
          }
        });
    }
  }, [isLoggedIn]);


  useEffect(() => {
    if (city && city.trim().length > 0) {
      setCheckingCity(true);
      setCityError("");
      const normalizedCity = city.trim().toLowerCase();
      fetch(`/api/delivery/check?city=${encodeURIComponent(city)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.serviceable) {
            setIsServiceable(true);
            if (data.deliveryFeeStandard !== undefined) setDeliveryFeeStandard(data.deliveryFeeStandard);
            if (data.deliveryFeeCycle !== undefined) setDeliveryFeeCycle(data.deliveryFeeCycle);
            if (data.freeShippingMin !== undefined) setFreeShippingMinThreshold(data.freeShippingMin);
          } else {
            // Check local simulated settings
            const simSettingsStr = localStorage.getItem("vega_sim_settings");
            if (simSettingsStr) {
              try {
                const simSettings = JSON.parse(simSettingsStr);
                const cities = simSettings.homepageConfig?.deliveryCities;
                if (Array.isArray(cities) && cities.some((c: any) => {
                  const name = typeof c === "string" ? c : c.name || "";
                  return name.trim().toLowerCase() === normalizedCity;
                })) {
                  setIsServiceable(true);
                  if (simSettings.homepageConfig?.deliveryFeeStandard !== undefined) {
                    setDeliveryFeeStandard(simSettings.homepageConfig.deliveryFeeStandard);
                  }
                  if (simSettings.homepageConfig?.deliveryFeeCycle !== undefined) {
                    setDeliveryFeeCycle(simSettings.homepageConfig.deliveryFeeCycle);
                  }
                  if (simSettings.freeShippingMin !== undefined) {
                    setFreeShippingMinThreshold(simSettings.freeShippingMin * 100);
                  }
                  return;
                }
              } catch(e) {}
            }
            setIsServiceable(false);
            setCityError(data.message || "City is not in our delivery zone.");
          }
        })
        .catch(() => {
          // If fetch fails (completely offline), also check local simulated settings
          const simSettingsStr = localStorage.getItem("vega_sim_settings");
          let allowedCities = ["Ranchi"];
          if (simSettingsStr) {
            try {
              const simSettings = JSON.parse(simSettingsStr);
              if (Array.isArray(simSettings.homepageConfig?.deliveryCities)) {
                allowedCities = simSettings.homepageConfig.deliveryCities;
              }
              if (simSettings.homepageConfig?.deliveryFeeStandard !== undefined) {
                setDeliveryFeeStandard(simSettings.homepageConfig.deliveryFeeStandard);
              }
              if (simSettings.homepageConfig?.deliveryFeeCycle !== undefined) {
                setDeliveryFeeCycle(simSettings.homepageConfig.deliveryFeeCycle);
              }
              if (simSettings.freeShippingMin !== undefined) {
                setFreeShippingMinThreshold(simSettings.freeShippingMin * 100);
              }
            } catch(e) {}
          }
          const allowedCitiesNames = allowedCities.map((c: any) => typeof c === "string" ? c : c.name || "");
          if (allowedCitiesNames.some(name => name.trim().toLowerCase() === normalizedCity)) {
            setIsServiceable(true);
          } else {
            setIsServiceable(false);
            setCityError(`We currently only deliver in: ${allowedCitiesNames.join(", ")}.`);
          }
        })
        .finally(() => {
          setCheckingCity(false);
        });
    } else {
      setIsServiceable(null);
      setCityError("");
    }
  }, [city]);

  const subtotal = getCartTotal();

  // Load and validate saved coupon on checkout mount or subtotal changes
  useEffect(() => {
    if (!isLoggedIn) {
      setCouponDetails(null);
      setCouponDiscount(0);
      localStorage.removeItem("vega_applied_coupon");
      return;
    }
    const saved = localStorage.getItem("vega_applied_coupon");
    if (!saved) {
      setCouponDetails(null);
      setCouponDiscount(0);
      return;
    }

    try {
      const details = JSON.parse(saved);
      const couponCodeUpper = details.code.trim().toUpperCase();

      // Resolve initial phone/email from session/saved address to avoid keystroke dependencies
      let checkPhone = "";
      let checkEmail = "";
      if (session?.user) {
        if (session.user.phone) checkPhone = session.user.phone;
        if (session.user.email) checkEmail = session.user.email;
      }
      const savedAddr = localStorage.getItem("vega_saved_address");
      if (savedAddr) {
        try {
          const addr = JSON.parse(savedAddr);
          if (addr.phone) checkPhone = addr.phone;
          if (addr.email) checkEmail = addr.email;
        } catch (err) {}
      }

      // 1. Check local simulated limits
      let localLimitReached = false;
      try {
        const simOrdersStr = localStorage.getItem("vega_sim_orders");
        if (simOrdersStr) {
          const simOrders = JSON.parse(simOrdersStr);
          const usedCount = simOrders.filter((o: any) => o.couponCode?.toUpperCase() === couponCodeUpper).length;
          
          const simSettingsStr = localStorage.getItem("vega_sim_settings");
          let limit = null;
          let uLimit = null;
          if (simSettingsStr) {
            const simSettings = JSON.parse(simSettingsStr);
            const cpn = simSettings.homepageConfig?.coupons?.find((c: any) => c.code === couponCodeUpper);
            if (cpn) {
              limit = cpn.usageLimit;
              uLimit = cpn.userLimit;
            }
          }
          
          if (limit && usedCount >= Number(limit)) {
            localLimitReached = true;
          }

          if (uLimit) {
            const userUsedCount = simOrders.filter((o: any) => 
              o.couponCode?.toUpperCase() === couponCodeUpper && 
              (o.phone === checkPhone || o.email?.toLowerCase() === checkEmail.toLowerCase())
            ).length;
            if (userUsedCount >= Number(uLimit)) {
              localLimitReached = true;
            }
          }
        }
      } catch (e) {}

      if (localLimitReached) {
        localStorage.removeItem("vega_applied_coupon");
        setCouponDetails(null);
        setCouponDiscount(0);
        alert("Already used");
        return;
      }

      // Apply initial discount locally first
      setCouponDetails(details);
      let calculatedDiscount = 0;
      if (details.discountType === "percentage") {
        calculatedDiscount = Math.round(subtotal * (details.discountValue / 100));
      } else if (details.discountType === "flat") {
        calculatedDiscount = details.discountValue;
      } else if (details.discountType === "gift") {
        calculatedDiscount = 0;
      }
      setCouponDiscount(calculatedDiscount);

      // 2. Validate with API
      fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: details.code,
          phone: checkPhone,
          email: checkEmail,
          cartItems: items.filter(item => !item.isGift),
          subtotal,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid) {
            localStorage.removeItem("vega_applied_coupon");
            setCouponDetails(null);
            setCouponDiscount(0);
            alert(data.error || "Coupon is no longer valid.");
          }
        })
        .catch(() => {});
    } catch (e) {
      setCouponDetails(null);
      setCouponDiscount(0);
      localStorage.removeItem("vega_applied_coupon");
    }
  }, [subtotal, isLoggedIn, items, session]);

  const hasCycle = items.some((item) => item.isCycle === true || item.sku?.includes("CYC") || item.name?.toLowerCase().includes("carbon") || item.name?.toLowerCase().includes("mtb") || item.name?.toLowerCase().includes("hybrid") || item.name?.toLowerCase().includes("rider") || item.name?.toLowerCase().includes("swift"));
  const baseShippingCharge = hasCycle ? deliveryFeeCycle : deliveryFeeStandard;
  const shippingCharge = subtotal >= freeShippingMinThreshold || subtotal === 0 ? 0 : baseShippingCharge;

  const orderValueForLoyalty = Math.max(0, subtotal + shippingCharge - couponDiscount);
  const maxPointsByCap = Math.floor((orderValueForLoyalty * (maxRedeemPercent / 100)) / 100);
  const maxPointsAllowed = Math.min(availablePoints, maxPointsByCap);

  const handleTogglePoints = (checked: boolean) => {
    setUsePoints(checked);
    if (checked) {
      setPointsToRedeem(maxPointsAllowed);
    } else {
      setPointsToRedeem(0);
    }
  };
  const pointsDiscount = usePoints ? pointsToRedeem * 100 : 0;
  const total = Math.max(0, subtotal + shippingCharge - couponDiscount - pointsDiscount);

  // Save details for next time
  const saveAddressToLocal = () => {
    const data = { email, name, phone, street, city, state, pincode };
    localStorage.setItem("vega_saved_address", JSON.stringify(data));
    setHasSavedAddress(true);
  };

  // Trigger local mock checkout success (Sandbox mode bypass)
  const handleMockCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone || !street || !pincode) {
      alert("Please fill in all delivery details.");
      return;
    }
    setLoading(true);
    saveAddressToLocal();

    // Create a mock order ID
    const randomOrderId = `VYORAX-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Create order in database (optional api call, falls back if offline)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: email,
          name,
          phone,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
          total,
          address: { street, city, state, pincode },
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Checkout failed. Please check coupon limit or details.");
        if (errorData.error === "Already used") {
          localStorage.removeItem("vega_applied_coupon");
          setCouponDetails(null);
          setCouponDiscount(0);
        }
        setLoading(false);
        return;
      }

      const orderData = await response.json();
      const finalOrderId = orderData.id || randomOrderId;

      // Save to local storage simulated orders for sandbox persistence
      try {
        const newSimOrder = {
          id: finalOrderId,
          customer: name,
          email: email,
          phone: phone,
          date: new Date().toISOString().split("T")[0],
          total: total,
          status: "PENDING",
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
          paymentId: "pay_mock_bypass",
          courier: "",
          trackingId: "",
          address: { street, city, state, pincode },
          items: items.map((i) => ({
            name: i.name,
            qty: i.quantity,
            price: i.price,
            image: i.image,
          })),
        };
        const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
        localStorage.setItem("vega_sim_orders", JSON.stringify([newSimOrder, ...currentSimOrders]));

        if (isLoggedIn && usePoints && pointsToRedeem > 0) {
          const currentPoints = Number(localStorage.getItem("vega_sim_points") || "250");
          const nextPoints = Math.max(0, currentPoints - pointsToRedeem);
          localStorage.setItem("vega_sim_points", String(nextPoints));
          
          const simTxs = JSON.parse(localStorage.getItem("vega_sim_transactions") || "[]");
          const newTx = {
            id: `tx-sim-${Date.now()}`,
            amount: -pointsToRedeem,
            type: "REDEEMED",
            reason: `Redeemed for order #${finalOrderId}`,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem("vega_sim_transactions", JSON.stringify([newTx, ...simTxs]));
        }
      } catch (e) {}

      // Simulate network lag
      setTimeout(() => {
        setLoading(false);
        setOrderId(finalOrderId);
        setCheckoutStep("success");
        localStorage.removeItem("vega_applied_coupon");
        clearCart();
        // Fire Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 1000);
    } catch (err) {
      // Save to local storage simulated orders for sandbox persistence
      try {
        const newSimOrder = {
          id: randomOrderId,
          customer: name,
          email: email,
          phone: phone,
          date: new Date().toISOString().split("T")[0],
          total: total,
          status: "PENDING",
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
          paymentId: "pay_mock_bypass",
          courier: "",
          trackingId: "",
          address: { street, city, state, pincode },
          items: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            name: i.name,
            qty: i.quantity,
            price: i.price,
            image: i.image,
          })),
        };
        const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
        localStorage.setItem("vega_sim_orders", JSON.stringify([newSimOrder, ...currentSimOrders]));
      } catch (e) {}

      // Database offline sandbox backup
      setTimeout(() => {
        setLoading(false);
        setOrderId(randomOrderId);
        setCheckoutStep("success");
        localStorage.removeItem("vega_applied_coupon");
        clearCart();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 1000);
    }
  };

  const getEmiDetailsForCheckout = (bankId: string) => {
    if (!emiConfig) return [];
    const bank = emiConfig.banks?.find((b: any) => b.id === bankId);
    if (!bank || !bank.enabled) return [];

    const tenures = [3, 6, 9, 12, 18, 24];

    return tenures.map((months) => {
      let isNoCost = false;
      let interestRate = bank.interestRate || emiConfig.standardInterestRate || 14;

      if (bank.noCostEnabled && (emiConfig.noCostMonths || []).includes(months)) {
        isNoCost = true;
        interestRate = 0;
      }

      const monthlyRate = interestRate / 12 / 100;
      let emi = 0;
      if (monthlyRate === 0) {
        emi = Math.round(total / months);
      } else {
        emi = Math.round(
          (total * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1)
        );
      }

      const totalCost = emi * months;
      const totalInterest = totalCost - total;

      return {
        months,
        interestRate,
        emi,
        totalInterest,
        totalCost,
        isNoCost,
      };
    });
  };

  const handleEmiCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone || !street || !pincode) {
      alert("Please fill in all delivery details.");
      return;
    }
    setLoading(true);
    saveAddressToLocal();

    const emiOrderId = `VYORAX-EMI-${Math.floor(100000 + Math.random() * 900000)}`;
    const selectedBankObj = emiConfig?.banks?.find((b: any) => b.id === selectedEmiBank);
    const bankName = selectedBankObj ? selectedBankObj.name : selectedEmiBank;

    try {
      // Create order in database
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: email,
          name,
          phone,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
          total,
          address: { street, city, state, pincode },
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
        }),
      });

      let finalOrderId = emiOrderId;
      if (response.ok) {
        const orderData = await response.json();
        finalOrderId = orderData.id;
        
        // Flush database cart
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        }).catch(() => {});
      }

      // Add to simulated order log
      try {
        const newSimOrder = {
          id: finalOrderId,
          customer: name,
          email: email,
          phone: phone,
          date: new Date().toISOString().split("T")[0],
          total: total,
          status: "ORDERED",
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
          paymentId: `pay_emi_${selectedEmiBank}_${selectedEmiMonths}m`,
          paymentMethod: `EMI - ${bankName} (${selectedEmiMonths}m)`,
          courier: "VEGA Delivery",
          trackingId: `TRK-EMI-${Math.floor(100000 + Math.random() * 900000)}`,
          address: { street, city, state, pincode },
          items: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            name: i.name,
            qty: i.quantity,
            price: i.price,
            image: i.image,
          })),
        };
        const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
        localStorage.setItem("vega_sim_orders", JSON.stringify([newSimOrder, ...currentSimOrders]));

        if (isLoggedIn && usePoints && pointsToRedeem > 0) {
          const currentPoints = Number(localStorage.getItem("vega_sim_points") || "250");
          const nextPoints = Math.max(0, currentPoints - pointsToRedeem);
          localStorage.setItem("vega_sim_points", String(nextPoints));
          
          const simTxs = JSON.parse(localStorage.getItem("vega_sim_transactions") || "[]");
          const newTx = {
            id: `tx-sim-${Date.now()}`,
            amount: -pointsToRedeem,
            type: "REDEEMED",
            reason: `Redeemed for order #${finalOrderId}`,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem("vega_sim_transactions", JSON.stringify([newTx, ...simTxs]));
        }
      } catch (e) {}

      setTimeout(() => {
        setLoading(false);
        setOrderId(finalOrderId);
        setCheckoutStep("success");
        localStorage.removeItem("vega_applied_coupon");
        clearCart();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 1000);
    } catch (err) {
      // Offline fallback
      try {
        const newSimOrder = {
          id: emiOrderId,
          customer: name,
          email: email,
          phone: phone,
          date: new Date().toISOString().split("T")[0],
          total: total,
          status: "ORDERED",
          couponCode: couponDetails?.code || null,
          pointsRedeemed: usePoints ? pointsToRedeem : 0,
          paymentId: `pay_emi_${selectedEmiBank}_${selectedEmiMonths}m`,
          paymentMethod: `EMI - ${bankName} (${selectedEmiMonths}m)`,
          courier: "VEGA Delivery",
          trackingId: `TRK-EMI-${Math.floor(100000 + Math.random() * 900000)}`,
          address: { street, city, state, pincode },
          items: items.map((i) => ({
            id: i.id,
            slug: i.slug,
            name: i.name,
            qty: i.quantity,
            price: i.price,
            image: i.image,
          })),
        };
        const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
        localStorage.setItem("vega_sim_orders", JSON.stringify([newSimOrder, ...currentSimOrders]));
      } catch (e) {}

      setTimeout(() => {
        setLoading(false);
        setOrderId(emiOrderId);
        setCheckoutStep("success");
        localStorage.removeItem("vega_applied_coupon");
        clearCart();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }, 1000);
    }
  };

  // Razorpay integration pay script
  const handleRazorpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone || !street || !pincode) {
      alert("Please fill in all delivery details.");
      return;
    }
    setLoading(true);
    saveAddressToLocal();

    try {
      // 1. Create order on Next.js backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          couponCode: couponDetails?.code || null,
          email: email,
          phone: phone,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
          subtotal: subtotal
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Order creation failed. Please check coupon or details.");
        if (errorData.error === "Already used") {
          localStorage.removeItem("vega_applied_coupon");
          setCouponDetails(null);
          setCouponDiscount(0);
        }
        setLoading(false);
        return;
      }
      const order = await res.json();

      // 2. Open Razorpay Widget modal options
      const options = {
        key: order.keyId, // Razorpay Key ID from database SiteSettings
        amount: order.amount,
        currency: "INR",
        name: "Vyorax",
        description: "Premium Cycles & Fitness Gear Checkout",
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
        order_id: order.id,
        handler: async function (response: any) {
          // Verify signature on backend
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              address: { street, city, state, pincode },
              guestEmail: email,
              phone,
              items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price })),
              total,
              couponCode: couponDetails?.code || null,
              pointsRedeemed: usePoints ? pointsToRedeem : 0,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            // Save to local storage simulated orders for sandbox persistence
            try {
              const newSimOrder = {
                id: verifyData.orderId,
                customer: name,
                email: email,
                phone: phone,
                date: new Date().toISOString().split("T")[0],
                total: total,
                status: "CONFIRMED",
                couponCode: couponDetails?.code || null,
                pointsRedeemed: usePoints ? pointsToRedeem : 0,
                paymentId: response.rayorpay_payment_id || "pay_razorpay",
                courier: "",
                trackingId: "",
                address: { street, city, state, pincode },
                items: items.map((i) => ({
                  id: i.id,
                  slug: i.slug,
                  name: i.name,
                  qty: i.quantity,
                  price: i.price,
                  image: i.image,
                })),
              };
              const currentSimOrders = JSON.parse(localStorage.getItem("vega_sim_orders") || "[]");
              localStorage.setItem("vega_sim_orders", JSON.stringify([newSimOrder, ...currentSimOrders]));

              if (isLoggedIn && usePoints && pointsToRedeem > 0) {
                const currentPoints = Number(localStorage.getItem("vega_sim_points") || "250");
                const nextPoints = Math.max(0, currentPoints - pointsToRedeem);
                localStorage.setItem("vega_sim_points", String(nextPoints));
                
                const simTxs = JSON.parse(localStorage.getItem("vega_sim_transactions") || "[]");
                const newTx = {
                  id: `tx-sim-${Date.now()}`,
                  amount: -pointsToRedeem,
                  type: "REDEEMED",
                  reason: `Redeemed for order #${verifyData.orderId}`,
                  createdAt: new Date().toISOString()
                };
                localStorage.setItem("vega_sim_transactions", JSON.stringify([newTx, ...simTxs]));
              }
            } catch (e) {}

            setLoading(false);
            setOrderId(verifyData.orderId);
            setCheckoutStep("success");
            localStorage.removeItem("vega_applied_coupon");
            clearCart();
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });
          } else {
            alert("Payment signature validation failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#FF4D1A", // Agni theme accent color
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
      
      rzp1.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

    } catch (err: any) {
      console.warn("Razorpay API not initialized. Falling back to local sandbox checkout bypass.", err.message);
      // Trigger sandbox fallback
      handleMockCheckout(e);
    }
  };

  // Fast Checkout Action
  const handleFastCheckout = (e: React.FormEvent) => {
    // Fills form instantly from storage and triggers order placement
    handleRazorpayCheckout(e);
  };

  if (checkoutStep === "success") {
    return (
      <div className="bg-[var(--obsidian)] min-h-[80vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[var(--forest)]/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wider">ORDER PLACED!</h1>
            <p className="text-xs text-[var(--smoke)] font-sans uppercase font-bold tracking-wider">
              Order ID: <span className="text-white font-mono">{orderId}</span>
            </p>
          </div>

          <p className="text-sm text-[var(--silver)] font-sans leading-relaxed">
            Thank you for shopping at Vyorax. We have sent a confirmation email to <strong className="text-white">{email}</strong> with your invoice and shipping details. Your order is being packed for shipment!
          </p>

          {/* Action Links */}
          <div className="pt-6 space-y-3">
            <Link
              href={`/order/${orderId}`}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-[var(--agni)] hover:bg-[var(--agni-light)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              <span>Track My Shipment</span>
            </Link>
            <Link
              href="/products"
              className="w-full block py-3 border border-[var(--steel)] text-white text-xs font-bold uppercase tracking-wider rounded hover:border-white transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--obsidian)] min-h-screen pt-8 pb-20">
      
      {/* Razorpay checkout script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase text-white tracking-wider mb-8 border-b border-[var(--steel)]/40 pb-6">
          Checkout Flow
        </h1>

        {items.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--steel)]/60 rounded-2xl bg-[var(--charcoal)]">
            <ShoppingBag size={48} className="text-[var(--smoke)] mb-4" />
            <h3 className="text-lg font-sans font-bold mb-2">No items in your checkout bag</h3>
            <p className="text-sm text-[var(--smoke)] max-w-xs mb-6">
              Please browse the garage and add premium products to get started.
            </p>
            <Link
              href="/products"
              className="px-6 py-2.5 bg-[var(--agni)] text-neutral-50 text-xs font-bold uppercase tracking-wider rounded hover:bg-[var(--agni-light)] transition-colors"
            >
              Go Shop Cycles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: FORM DATA (Lg 7cols) */}
            <form onSubmit={handleRazorpayCheckout} className="lg:col-span-7 space-y-6">
              
              {/* Fast Checkout banner if saved addresses exist */}
              {hasSavedAddress && (
                <div className="bg-[var(--carbon)] border border-[var(--gold)]/40 rounded-xl p-4 flex items-center justify-between shadow-gold-glow">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-sans font-bold text-white flex items-center">
                      <Sparkles size={12} className="mr-1 text-[var(--gold)]" /> Fast Checkout Saved Address
                    </h4>
                    <p className="text-[10px] text-[var(--silver)] font-sans">
                      Order directly to: {name}, {street}, {city} - {pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFastCheckout}
                    disabled={loading}
                    className="px-4 py-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black text-xs font-sans font-bold uppercase rounded tracking-wide transition-colors"
                  >
                    1-Tap Checkout
                  </button>
                </div>
              )}

              {/* Contact section */}
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-sans font-bold uppercase text-white flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3 mb-2">
                  <span className="text-[var(--agni)]">01.</span>
                  <span>Contact Details</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Priyanshu Ranchi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="8888888888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@vyorax.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>
              </div>

              {/* Delivery section */}
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-sans font-bold uppercase text-white flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3 mb-2">
                  <span className="text-[var(--agni)]">02.</span>
                  <span>Delivery Address</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 101, Lalpur Main Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2 sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">City</label>
                    <input
                      type="text"
                      required
                      placeholder="Ranchi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">State</label>
                    <input
                      type="text"
                      required
                      placeholder="Jharkhand"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--smoke)]">Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="834001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-[var(--carbon)] border border-[var(--steel)] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[var(--smoke)] focus:outline-none focus:border-[var(--agni)]"
                    />
                  </div>
                </div>
                 {cityError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-sans">
                    ⚠️ {cityError}
                  </div>
                )}
                {isServiceable === true && !checkingCity && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-sans">
                    ✓ City is serviceable for VEGA Delivery!
                  </div>
                )}
                {checkingCity && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 font-sans flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span>Verifying delivery coverage...</span>
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <div className="bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-sans font-bold uppercase text-white flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3 mb-2">
                  <span className="text-[var(--agni)]">03.</span>
                  <span>Payment Gateway</span>
                </h3>

                {/* Tab selector if EMI is available */}
                {emiConfig?.enabled !== false && total >= (emiConfig?.minAmount ?? 300000) && (
                  <div className="flex border border-[var(--steel)]/40 rounded-xl overflow-hidden bg-[var(--obsidian)] text-xs mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`flex-1 py-2.5 font-bold uppercase tracking-wider transition-colors text-center ${
                        paymentMethod === "razorpay"
                          ? "bg-[var(--agni)] text-white"
                          : "text-[var(--silver)] hover:text-white"
                      }`}
                    >
                      Razorpay Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("emi")}
                      className={`flex-1 py-2.5 font-bold uppercase tracking-wider transition-colors text-center ${
                        paymentMethod === "emi"
                          ? "bg-[var(--agni)] text-white"
                          : "text-[var(--silver)] hover:text-white"
                      }`}
                    >
                      EMI Installments
                    </button>
                  </div>
                )}

                {paymentMethod === "razorpay" ? (
                  <>
                    <div className="p-4 bg-[var(--carbon)] rounded-xl border border-[var(--steel)]/60 flex items-start space-x-3.5">
                      <CreditCard size={18} className="text-[var(--agni)] mt-0.5 flex-shrink-0" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-sans font-bold text-white">Razorpay payments</h4>
                        <p className="text-[10px] text-[var(--smoke)] leading-relaxed">
                          UPI, NetBanking, Debit/Credit Cards, Wallets, and No-Cost EMI supported. Safe and encrypted transactions.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading || isServiceable === false || checkingCity}
                        className="flex-grow py-3.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:bg-[var(--steel)] disabled:opacity-50 text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                      >
                        {loading ? "Initializing payment..." : `Pay ₹${(total / 100).toLocaleString("en-IN")} via Razorpay`}
                      </button>
                      <button
                        type="button"
                        onClick={handleMockCheckout}
                        disabled={loading || isServiceable === false || checkingCity}
                        className="py-3.5 px-6 border border-[var(--steel)] hover:border-white text-white text-xs font-bold uppercase tracking-wider rounded transition-all disabled:bg-[var(--steel)] disabled:opacity-50"
                      >
                        Sandbox Bypass Testing
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                        Select Bank for EMI
                      </label>
                      <select
                        value={selectedEmiBank}
                        onChange={(e) => setSelectedEmiBank(e.target.value)}
                        className="w-full bg-[var(--carbon)] border border-[var(--steel)]/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--agni)]"
                      >
                        {emiConfig.banks?.filter((b: any) => b.enabled).map((bank: any) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-[var(--smoke)] block">
                        Choose Installment Plan (Tenure)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {getEmiDetailsForCheckout(selectedEmiBank).map((plan: any) => (
                          <button
                            key={plan.months}
                            type="button"
                            onClick={() => setSelectedEmiMonths(plan.months)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              selectedEmiMonths === plan.months
                                ? "bg-[var(--agni)]/15 border-[var(--agni)] text-white shadow-agni-glow"
                                : "bg-[var(--carbon)] border-[var(--steel)]/60 text-[var(--silver)] hover:text-white"
                            }`}
                          >
                            <span className="block font-bold text-xs">{plan.months} Months</span>
                            <span className="block font-mono text-[10px] text-white mt-1">₹{(plan.emi / 100).toLocaleString("en-IN")}/mo</span>
                            <span className="block text-[8px] text-[var(--smoke)] mt-0.5">
                              {plan.isNoCost ? "0% (No Cost)" : `${plan.interestRate}% interest`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* EMI Detail Breakup Card */}
                    {(() => {
                      const plans = getEmiDetailsForCheckout(selectedEmiBank);
                      const selectedPlan = plans.find((p: any) => p.months === selectedEmiMonths);
                      if (!selectedPlan) return null;
                      return (
                        <div className="bg-[var(--carbon)] border border-[var(--steel)]/60 p-4 rounded-xl text-xs space-y-1.5 text-[var(--smoke)]">
                          <div className="flex justify-between">
                            <span>Monthly EMI:</span>
                            <span className="font-bold text-white font-mono">₹{(selectedPlan.emi / 100).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest Rate:</span>
                            <span className="font-bold text-white">
                              {selectedPlan.isNoCost ? "0% (No Cost EMI)" : `${selectedPlan.interestRate}% p.a.`}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-[var(--steel)]/20 pt-1.5 mt-1.5">
                            <span className="text-white font-bold">Total Payment:</span>
                            <span className="font-bold text-[var(--gold-light)] font-mono">₹{(selectedPlan.totalCost / 100).toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-[9px] text-neutral-500 text-center pt-1 font-mono">
                            Includes ₹{(selectedPlan.totalInterest / 100).toLocaleString("en-IN")} total bank interest charges.
                          </p>
                        </div>
                      );
                    })()}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleEmiCheckout}
                        disabled={loading || isServiceable === false || checkingCity}
                        className="w-full py-3.5 bg-[var(--agni)] hover:bg-[var(--agni-light)] disabled:bg-[var(--steel)] disabled:opacity-50 text-neutral-50 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                      >
                        {loading ? "Processing..." : "Place Order via EMI"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </form>

            {/* RIGHT: ORDER SUMMARY (Lg 5cols) */}
            <div className="lg:col-span-5 bg-[var(--charcoal)] border border-[var(--steel)]/60 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-white flex items-center space-x-2 border-b border-[var(--steel)]/30 pb-3">
                <Truck size={16} className="text-[var(--gold)]" />
                <span>Order Summary</span>
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex space-x-3 text-xs font-sans">
                    <div className="w-12 h-12 rounded bg-[var(--obsidian)] relative overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-white truncate">{item.name}</h4>
                      <span className="text-[10px] text-[var(--smoke)] uppercase font-mono mt-0.5 font-sans">
                        {item.isGift ? (
                          <span className="text-emerald-400 font-sans font-bold text-[9px] uppercase tracking-wider font-sans">Gift Item</span>
                        ) : (
                          `Qty: ${item.quantity} · ₹${(item.price / 100).toLocaleString("en-IN")}`
                        )}
                      </span>
                    </div>
                    <div className="text-right flex flex-col justify-center flex-shrink-0">
                      {item.isGift ? (
                        <>
                          <span className="text-[10px] text-[var(--smoke)] line-through font-mono">
                            ₹{((item.originalPrice || 0) / 100).toLocaleString("en-IN")}
                          </span>
                          <span className="font-sans font-bold text-emerald-400 text-[10px] uppercase">
                            FREE
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-white font-semibold">
                          ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vyorax Club Points Redemption */}
              {isLoggedIn && availablePoints > 0 && (
                <div className="border-t border-[var(--steel)]/30 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[var(--gold)]" />
                      <span>Redeem Vyorax Club Points</span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => handleTogglePoints(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--carbon)] border border-[var(--steel)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--agni)]"></div>
                    </label>
                  </div>

                  {usePoints && maxPointsAllowed > 0 && (
                    <div className="space-y-2.5 animate-fadeIn p-3.5 bg-[var(--carbon)] border border-[var(--steel)]/50 rounded-xl">
                      <div className="flex justify-between text-[10px] text-[var(--smoke)] uppercase font-bold tracking-wider">
                        <span>Points to Redeem:</span>
                        <span className="text-white font-mono">{pointsToRedeem} / {maxPointsAllowed} pts</span>
                      </div>
                      
                      <input
                        type="range"
                        min={0}
                        max={maxPointsAllowed}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                        className="w-full h-1 bg-[var(--steel)]/60 rounded-lg appearance-none cursor-pointer accent-[var(--agni)]"
                      />

                      <div className="text-[10px] text-[var(--smoke)] leading-relaxed">
                        ✓ Redeeming <strong>{pointsToRedeem} points</strong> saves you <strong>₹{pointsToRedeem}</strong> on this order. (Max cap: {maxRedeemPercent}%)
                      </div>
                    </div>
                  )}

                  {usePoints && maxPointsAllowed === 0 && (
                    <p className="text-[10px] text-amber-400 italic">
                      Cart total is too low or already fully discounted.
                    </p>
                  )}
                </div>
              )}

              {/* Summary Totals */}
              <div className="border-t border-[var(--steel)]/30 pt-4 space-y-2.5 text-xs font-sans text-[var(--silver)]">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-white">₹{(subtotal / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{hasCycle ? "Cycle Delivery Fee" : "Standard Delivery Fee"}</span>
                  <span className="font-mono text-white">
                    {shippingCharge === 0 ? (
                      <span className="text-[var(--forest)] font-bold uppercase">Free</span>
                    ) : (
                      `₹${(shippingCharge / 100).toLocaleString("en-IN")}`
                    )}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in">
                    <span>Discount ({couponDetails?.code})</span>
                    <span className="font-mono">-₹{(couponDiscount / 100).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in">
                    <span>Vyorax Club Discount</span>
                    <span className="font-mono">-₹{(pointsDiscount / 100).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {couponDetails && couponDetails.discountType === "gift" && (
                  <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in">
                    <span>Gift Promo ({couponDetails.code})</span>
                    <span className="text-[10px] font-sans border border-emerald-500/30 px-1 py-0.2 rounded bg-emerald-500/5 uppercase">FREE Gift</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--steel)]/30 pt-3 text-sm font-sans font-bold text-white">
                  <span>Total Order</span>
                  <span className="font-mono text-[var(--agni)] text-base">
                    ₹{(total / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Security Shield badge */}
              <div className="bg-[var(--carbon)] rounded px-4 py-3 border border-[var(--steel)]/50 text-[10px] font-sans flex items-start space-x-2 text-[var(--smoke)] leading-relaxed">
                <ShieldAlert size={14} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Vyorax Assurance:</strong> All cycles include transport damage protection. Returns/refunds processed within 7 days of delivery for Ranchi zones.
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
