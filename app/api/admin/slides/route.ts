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

    const slides = await prisma.homeSlide.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(slides);
  } catch (error: any) {
    console.error("Slides API GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, subtitle, desc, image, ctaText, ctaHref, accent, bgGradient, order } = await req.json();

    if (!title || !subtitle || !desc || !image || !ctaText || !ctaHref) {
      return new NextResponse("Required fields missing", { status: 400 });
    }

    const newSlide = await prisma.homeSlide.create({
      data: {
        title,
        subtitle,
        desc,
        image,
        ctaText,
        ctaHref,
        accent: accent || "var(--agni)",
        bgGradient: bgGradient || "from-orange-600/20 via-neutral-900/5 to-transparent",
        order: Number(order) || 0,
        isActive: true,
      },
    });

    return NextResponse.json(newSlide);
  } catch (error: any) {
    console.error("Slides API POST error:", error.message);
    return new NextResponse("Failed to create slide", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, title, subtitle, desc, image, ctaText, ctaHref, accent, bgGradient, order, isActive } = await req.json();

    if (!id || !title || !subtitle || !desc || !image || !ctaText || !ctaHref) {
      return new NextResponse("Required fields missing", { status: 400 });
    }

    const updatedSlide = await prisma.homeSlide.update({
      where: { id },
      data: {
        title,
        subtitle,
        desc,
        image,
        ctaText,
        ctaHref,
        accent: accent || "var(--agni)",
        bgGradient: bgGradient || "from-orange-600/20 via-neutral-900/5 to-transparent",
        order: Number(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(updatedSlide);
  } catch (error: any) {
    console.error("Slides API PUT error:", error.message);
    return new NextResponse("Failed to update slide", { status: 500 });
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
      return new NextResponse("ID is required", { status: 400 });
    }

    await prisma.homeSlide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Slides API DELETE error:", error.message);
    return new NextResponse("Failed to delete slide", { status: 500 });
  }
}
