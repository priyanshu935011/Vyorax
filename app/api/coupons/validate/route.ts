import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";
import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, phone, email, cartItems, subtotal } = body;

    // Use phone if present, otherwise fall back to email
    const customerIdentifier = phone || email;

    if (!code || !cartItems || subtotal === undefined) {
      return NextResponse.json({ valid: false, error: "Missing required fields" }, { status: 400 });
    }

    const validation = await validateCoupon(code, customerIdentifier, cartItems, subtotal);
    if (!validation.valid) {
      return NextResponse.json({ valid: false, error: validation.error });
    }

    const coupon = validation.coupon;

    // Process Free Gift Details
    let giftProduct = null;
    if (coupon.discountType === "gift") {
      const giftProductIdOrSku = coupon.discountValue;
      try {
        const dbProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { id: giftProductIdOrSku },
              { sku: giftProductIdOrSku },
              { slug: giftProductIdOrSku }
            ]
          }
        });
        if (dbProduct) {
          giftProduct = {
            id: dbProduct.id,
            name: dbProduct.name,
            price: dbProduct.price,
            image: dbProduct.images[0] || "",
            sku: dbProduct.sku,
            stock: dbProduct.stock,
            slug: dbProduct.slug,
          };
        }
      } catch (err) {
        // ignore
      }

      if (!giftProduct) {
        const mockP = MOCK_PRODUCTS.find(
          (p) => p.id === giftProductIdOrSku || p.sku === giftProductIdOrSku || p.slug === giftProductIdOrSku
        );
        if (mockP) {
          giftProduct = {
            id: mockP.id,
            name: mockP.name,
            price: mockP.price,
            image: mockP.images[0] || "",
            sku: mockP.sku,
            stock: mockP.stock,
            slug: mockP.slug,
          };
        }
      }
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      desc: coupon.desc,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase,
      giftProduct,
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error.message);
    return NextResponse.json({ valid: false, error: "Internal server error." }, { status: 500 });
  }
}
