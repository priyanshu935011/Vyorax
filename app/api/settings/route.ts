import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    
    if (!settings) {
      return NextResponse.json({
        freeShippingMin: 500000,
        homepageConfig: {}
      });
    }

    return NextResponse.json({
      freeShippingMin: settings.freeShippingMin,
      homepageConfig: settings.homepageConfig || {},
    });
  } catch (error: any) {
    console.error("Public settings API error:", error.message);
    return NextResponse.json({
      freeShippingMin: 500000,
      homepageConfig: {}
    });
  }
}
