import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma, getOrCreateUserId } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupons";
import { calculateOrderEarnedPoints, getLoyaltyConfig, applyPointsForOrder } from "@/lib/loyalty";

export async function POST(request: Request) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      address,
      guestEmail,
      phone,
      items,
      total,
      couponCode,
      pointsRedeemed,
    } = await request.json();

    const customerIdentifier = phone || guestEmail || address?.phone;

    if (couponCode) {
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);
      const validation = await validateCoupon(couponCode, customerIdentifier, items, subtotal);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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

    const keySecret = settings?.razorpaySecret || process.env.RAZORPAY_SECRET;

    if (!keySecret || keySecret === "razorpay_secret_placeholder") {
      throw new Error("Razorpay secret key is not configured.");
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpaySignature;

    if (!isSignatureValid) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    // Check if session exists to map to a user ID
    let userId: string | undefined = undefined;
    try {
      const session = await auth();
      if (session) {
        const resolvedId = await getOrCreateUserId(session);
        if (resolvedId) userId = resolvedId;
      }
    } catch (authError) {
      console.warn("Authentication session lookup failed:", authError);
    }

    let calculatedPointsEarned = 0;
    let finalPointsRedeemed = 0;

    if (userId) {
      calculatedPointsEarned = await calculateOrderEarnedPoints(items);

      const pointsToRedeem = Number(pointsRedeemed) || 0;
      if (pointsToRedeem > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { vegaPoints: true },
        });
        const userPoints = user?.vegaPoints || 0;
        finalPointsRedeemed = Math.min(pointsToRedeem, userPoints);

        const config = await getLoyaltyConfig();
        const subtotalWithCoupon = total + finalPointsRedeemed * 100;
        const maxRedeemPaise = (subtotalWithCoupon * config.maxRedeemPercent) / 100;
        const maxRedeemPoints = Math.floor(maxRedeemPaise / 100);

        finalPointsRedeemed = Math.min(finalPointsRedeemed, maxRedeemPoints);
      }
    }

    // Resolve product IDs to ensure foreign key safety in the database
    const resolvedItems = [];
    for (const item of items) {
      let dbProduct = await prisma.product.findUnique({
        where: { id: item.id },
      });

      if (!dbProduct) {
        dbProduct = await prisma.product.findUnique({
          where: { sku: item.id },
        });
      }

      if (!dbProduct && item.sku) {
        dbProduct = await prisma.product.findUnique({
          where: { sku: item.sku },
        });
      }

      if (dbProduct) {
        resolvedItems.push({
          productId: dbProduct.id,
          quantity: item.quantity,
          price: item.price,
        });
      } else {
        const anyProduct = await prisma.product.findFirst();
        if (anyProduct) {
          resolvedItems.push({
            productId: anyProduct.id,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }
    }

    // Create the order in database with status CONFIRMED since payment is verified
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        guestEmail: guestEmail || null,
        guestPhone: customerIdentifier || null,
        total: total,
        address: address,
        couponCode: couponCode || null,
        status: OrderStatus.CONFIRMED,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        pointsEarned: calculatedPointsEarned,
        pointsRedeemed: finalPointsRedeemed,
        statusHistory: [
          {
            status: "CONFIRMED",
            timestamp: new Date().toISOString(),
            message: "Order placed and payment successfully verified via Razorpay.",
          },
        ],
        items: {
          create: resolvedItems,
        },
      },
    });

    // Clear the user's database cart if authenticated
    if (userId) {
      await prisma.cartItem.deleteMany({
        where: { userId },
      });
      // Apply the points earned/redeemed to user profile
      await applyPointsForOrder(order.id);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify signature" },
      { status: 500 }
    );
  }
}
