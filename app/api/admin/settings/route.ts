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

    return NextResponse.json(settings || null);
  } catch (error: any) {
    console.error("Settings GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        freeShippingMin: Number(body.freeShippingMin) || 50000,
        razorpayKeyId: body.razorpayKeyId || "",
        razorpaySecret: body.razorpaySecret || "",
        anthropicApiKey: body.anthropicApiKey || "",
        aiSystemPrompt: body.aiSystemPrompt || "",
        aiEnabled: body.aiEnabled !== undefined ? body.aiEnabled : true,
        homepageConfig: body.homepageConfig || {},
      },
      update: {
        freeShippingMin: Number(body.freeShippingMin) || 50000,
        razorpayKeyId: body.razorpayKeyId || "",
        razorpaySecret: body.razorpaySecret || "",
        anthropicApiKey: body.anthropicApiKey || "",
        aiSystemPrompt: body.aiSystemPrompt || "",
        aiEnabled: body.aiEnabled !== undefined ? body.aiEnabled : true,
        homepageConfig: body.homepageConfig || {},
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("Settings PUT error:", error.message);
    return new NextResponse("Failed to save settings", { status: 500 });
  }
}
