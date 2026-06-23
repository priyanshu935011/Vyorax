import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function checkAdminAuth() {
  const session = await auth();
  return session && session.user.role === "ADMIN";
}

export async function GET() {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    const config = settings?.homepageConfig as any;
    const coupons = config?.coupons || [];

    const couponsWithUsage = await Promise.all(
      coupons.map(async (coupon: any) => {
        try {
          const usedCount = await prisma.order.count({
            where: {
              couponCode: coupon.code,
              status: { not: "CANCELLED" },
            },
          });
          return { ...coupon, usedCount };
        } catch (e) {
          return { ...coupon, usedCount: 0 };
        }
      })
    );

    return NextResponse.json(couponsWithUsage);
  } catch (error: any) {
    console.error("Coupons GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { code, desc, discountType, discountValue, minPurchase, targetType, targetValue, expiryDate, usageLimit, userLimit } = body;

    if (!code || !discountType || discountValue === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Load current settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    const currentConfig = (settings?.homepageConfig as any) || {};
    const couponsList = Array.isArray(currentConfig.coupons) ? currentConfig.coupons : [];

    // Create new coupon item
    const newCoupon = {
      id: `cpn-${Date.now()}`,
      code: code.trim().toUpperCase(),
      desc: desc?.trim() || "",
      discountType,
      discountValue: discountType === "gift" ? discountValue : Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      targetType: targetType || "all",
      targetValue: targetValue?.trim() || "",
      expiryDate: expiryDate ? expiryDate : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userLimit: userLimit ? Number(userLimit) : null,
      createdAt: new Date().toISOString(),
    };

    // Prevent duplicates
    if (couponsList.some((c: any) => c.code === newCoupon.code)) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }

    const updatedCoupons = [...couponsList, newCoupon];
    const updatedConfig = {
      ...currentConfig,
      coupons: updatedCoupons,
    };

    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        homepageConfig: updatedConfig,
      },
      update: {
        homepageConfig: updatedConfig,
      },
    });

    return NextResponse.json(newCoupon);
  } catch (error: any) {
    console.error("Coupons POST error:", error.message);
    return new NextResponse("Failed to save coupon", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, code, desc, discountType, discountValue, minPurchase, targetType, targetValue, expiryDate, usageLimit, userLimit } = body;

    if (!id || !code || !discountType || discountValue === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Load current settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings || !settings.homepageConfig) {
      return new NextResponse("No configurations found", { status: 404 });
    }

    const currentConfig = settings.homepageConfig as any;
    const couponsList = Array.isArray(currentConfig.coupons) ? currentConfig.coupons : [];

    // Find and update the coupon
    const couponIndex = couponsList.findIndex((c: any) => c.id === id);
    if (couponIndex === -1) {
      return new NextResponse("Coupon not found", { status: 404 });
    }

    // Prevent duplicate codes across other coupons
    if (couponsList.some((c: any) => c.code === code.trim().toUpperCase() && c.id !== id)) {
      return NextResponse.json({ error: "Another coupon with this code already exists" }, { status: 400 });
    }

    const updatedCoupon = {
      ...couponsList[couponIndex],
      code: code.trim().toUpperCase(),
      desc: desc?.trim() || "",
      discountType,
      discountValue: discountType === "gift" ? discountValue : Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      targetType: targetType || "all",
      targetValue: targetValue?.trim() || "",
      expiryDate: expiryDate ? expiryDate : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userLimit: userLimit ? Number(userLimit) : null,
    };

    const updatedCoupons = [...couponsList];
    updatedCoupons[couponIndex] = updatedCoupon;

    const updatedConfig = {
      ...currentConfig,
      coupons: updatedCoupons,
    };

    await prisma.siteSettings.update({
      where: { id: "singleton" },
      data: {
        homepageConfig: updatedConfig,
      },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error: any) {
    console.error("Coupons PUT error:", error.message);
    return new NextResponse("Failed to update coupon", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing coupon ID", { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings || !settings.homepageConfig) {
      return new NextResponse("No configurations found", { status: 404 });
    }

    const currentConfig = settings.homepageConfig as any;
    const couponsList = Array.isArray(currentConfig.coupons) ? currentConfig.coupons : [];

    const updatedCoupons = couponsList.filter((c: any) => c.id !== id);
    const updatedConfig = {
      ...currentConfig,
      coupons: updatedCoupons,
    };

    await prisma.siteSettings.update({
      where: { id: "singleton" },
      data: {
        homepageConfig: updatedConfig,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Coupons DELETE error:", error.message);
    return new NextResponse("Failed to delete coupon", { status: 500 });
  }
}
