import { auth } from "@/lib/auth";
import { prisma, getOrCreateUserId } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const { productName, serialNo, issueDesc } = await request.json();

    if (!productName || !serialNo || !issueDesc) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = 
      (order.userId && order.userId === session.user.id) ||
      (order.guestEmail && order.guestEmail.toLowerCase() === session.user.email?.toLowerCase());

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden - You do not own this order" }, { status: 403 });
    }

    // Save claim
    const claim = await prisma.warrantyClaim.create({
      data: {
        orderId,
        productName,
        serialNo,
        issueDesc,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    console.error("Warranty submission error:", error.message);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}
