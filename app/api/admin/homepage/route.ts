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

    return NextResponse.json(settings?.homepageConfig || null);
  } catch (error: any) {
    console.error("Homepage config GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { homepageConfig } = await req.json();

    if (homepageConfig === undefined) {
      return new NextResponse("Homepage configuration is required", { status: 400 });
    }

    const updatedSettings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        homepageConfig,
      },
      update: {
        homepageConfig,
      },
    });

    return NextResponse.json(updatedSettings.homepageConfig);
  } catch (error: any) {
    console.error("Homepage config PUT error:", error.message);
    return new NextResponse("Failed to update homepage configuration", { status: 500 });
  }
}
