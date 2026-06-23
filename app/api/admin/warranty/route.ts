import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Auth guard helper
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

    const claims = await prisma.warrantyClaim.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            guestEmail: true,
          },
        },
      },
    });

    return NextResponse.json(claims);
  } catch (error: any) {
    console.error("Admin Warranty GET error:", error.message);
    return new NextResponse("Failed to fetch claims", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return new NextResponse("Missing claim ID or status", { status: 400 });
    }

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return new NextResponse("Invalid status value", { status: 400 });
    }

    const updatedClaim = await prisma.warrantyClaim.update({
      where: { id },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedClaim);
  } catch (error: any) {
    console.error("Admin Warranty PUT error:", error.message);
    return new NextResponse("Failed to update claim", { status: 500 });
  }
}
