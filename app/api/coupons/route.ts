import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let coupons: any[] = [];
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "singleton" },
      });
      const config = settings?.homepageConfig as any;
      if (config && Array.isArray(config.coupons)) {
        coupons = config.coupons;
      }
    } catch (e) {
      console.warn("DB offline or settings table missing. Using mock coupons fallback.");
    }

    // Default mock coupons fallback for offline sandbox testing
    if (coupons.length === 0) {
      coupons = [
        {
          id: "mock-cpn-welcome",
          code: "WELCOME10",
          desc: "10% off for first-time customers (Min. ₹1,000)",
          discountType: "percentage",
          discountValue: 10,
          minPurchase: 100000, // ₹1,000 in paise
          targetType: "first_time",
          targetValue: "",
        },
        {
          id: "mock-cpn-mega",
          code: "MEGA500",
          desc: "Flat ₹500 off on orders above ₹3,000",
          discountType: "flat",
          discountValue: 50000, // ₹500 in paise
          minPurchase: 300000, // ₹3,000 in paise
          targetType: "all",
          targetValue: "",
        },
        {
          id: "mock-cpn-freebie",
          code: "FREEBIE",
          desc: "Free helmet on orders above ₹5,000",
          discountType: "gift",
          discountValue: "VEGA-ACC-HELM",
          minPurchase: 500000, // ₹5,000 in paise
          targetType: "all",
          targetValue: "",
        }
      ];
    }

    // Filter: only targetType === "all" and not expired
    const now = new Date();
    const availableCoupons = coupons.filter((coupon) => {
      if (coupon.targetType !== "all") {
        return false;
      }
      if (coupon.expiryDate) {
        const expiry = new Date(coupon.expiryDate);
        expiry.setHours(23, 59, 59, 999);
        if (now > expiry) {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json(availableCoupons);
  } catch (error: any) {
    console.error("Public Coupons GET error:", error.message);
    return new NextResponse("Failed to fetch coupons", { status: 500 });
  }
}
