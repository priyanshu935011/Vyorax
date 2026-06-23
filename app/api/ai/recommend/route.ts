import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    let skus: string[] = [];
    if (productId.includes("aero-x") || productId.includes("prod-aero-x")) {
      skus = ["GIRO-ACC-HELM", "CATEYE-ACC-LIGHT", "TOPEAK-ACC-PUMP"];
    } else if (productId.includes("ranchi") || productId.includes("prod-ranchi-mtb")) {
      skus = ["TOPEAK-ACC-PUMP", "GIRO-ACC-HELM", "KRYPTONITE-ACC-LOCK"];
    } else if (productId.includes("urban") || productId.includes("prod-urban-swift")) {
      skus = ["KRYPTONITE-ACC-LOCK", "CATEYE-ACC-LIGHT", "GIRO-ACC-HELM"];
    } else {
      skus = ["GIRO-ACC-HELM", "KRYPTONITE-ACC-LOCK"];
    }

    // Fetch from database
    let dbProducts: any[] = [];
    try {
      dbProducts = await prisma.product.findMany({
        where: {
          sku: { in: skus },
          isActive: true,
        },
      });
    } catch (dbErr) {
      console.warn("AI Recommend route database query failed. Falling back to offline mocks.");
    }

    // Map according to order of skus
    const recommended = skus.map(sku => {
      const p = dbProducts.find(prod => prod.sku === sku);
      if (p) {
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          slug: p.slug,
          price: p.price,
          image: p.images?.[0] || "",
        };
      }
      
      // Fallback mock items with correct slugs
      const mockFallback: { [key: string]: any } = {
        "GIRO-ACC-HELM": {
          id: "prod-helmet",
          name: "Giro Aero Shield Helmet",
          sku: "GIRO-ACC-HELM",
          slug: "giro-aero-shield-helmet",
          price: 249900,
          image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop",
        },
        "CATEYE-ACC-LIGHT": {
          id: "prod-light",
          name: "Cateye USB Laser Tail Light",
          sku: "CATEYE-ACC-LIGHT",
          slug: "cateye-usb-laser-tail-light",
          price: 99900,
          image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=200&auto=format&fit=crop",
        },
        "TOPEAK-ACC-PUMP": {
          id: "prod-pump",
          name: "Topeak Mini High-Pressure Pump",
          sku: "TOPEAK-ACC-PUMP",
          slug: "topeak-mini-high-pressure-pump",
          price: 79900,
          image: "https://images.unsplash.com/photo-1601362840469-817887520935?q=80&w=200&auto=format&fit=crop",
        },
        "KRYPTONITE-ACC-LOCK": {
          id: "prod-lock",
          name: "Kryptonite Heavy Duty U-Lock",
          sku: "KRYPTONITE-ACC-LOCK",
          slug: "kryptonite-heavy-duty-u-lock",
          price: 119900,
          image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=200&auto=format&fit=crop",
        }
      };
      
      return mockFallback[sku];
    }).filter(Boolean);

    return NextResponse.json({
      accessories: recommended,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
