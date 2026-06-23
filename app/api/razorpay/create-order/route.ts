import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const { amount, couponCode, email, phone, items, subtotal } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    if (couponCode) {
      const customerIdentifier = phone || email;
      const validation = await validateCoupon(couponCode, customerIdentifier, items || [], subtotal || amount);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Load settings from database SiteSettings singleton
    let settings = null;
    try {
      settings = await prisma.siteSettings.findUnique({
        where: { id: "singleton" },
      });
    } catch (dbError) {
      console.warn("Failed to fetch SiteSettings from database, falling back to environment variables:", dbError);
    }

    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = settings?.razorpaySecret || process.env.RAZORPAY_SECRET;

    if (!keyId || !keySecret || keyId === "rzp_test_placeholder" || keySecret === "razorpay_secret_placeholder") {
      throw new Error("Razorpay credentials are not configured.");
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amount, // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
