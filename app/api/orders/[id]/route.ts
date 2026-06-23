import { NextResponse } from "next/server";
import { prisma, getOrCreateUserId } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Relaxed Authorization check:
    // If the requester is logged in, ensure they are either the owner or an admin.
    // If they are not logged in, allow public tracking using the unique order CUID.
    const session = await auth();
    if (session && session.user) {
      const resolvedUserId = await getOrCreateUserId(session);
      const isAdmin = session.user.role === "ADMIN";
      const isOwner = 
        (order.userId && order.userId === resolvedUserId) ||
        (order.guestEmail && order.guestEmail.toLowerCase() === session.user.email?.toLowerCase());

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    // Format order to match the frontend expectations
    const addr = order.address as any;
    const customerName = order.user?.name || addr?.name || "Guest Customer";
    const customerEmail = order.user?.email || order.guestEmail || "";
    const customerPhone = order.user?.phone || addr?.phone || "";

    const formattedOrder = {
      id: order.id,
      customer: customerName,
      email: customerEmail,
      phone: customerPhone,
      date: order.createdAt.toISOString().split("T")[0],
      total: order.total,
      status: order.status,
      paymentId: order.razorpayPaymentId || "Mock Bypass",
      courier: order.trackingId ? "Vyorax Delivery" : "",
      trackingId: order.trackingId || "",
      address: order.address,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        qty: item.quantity,
        price: item.price,
        image: item.product.images[0] || "",
        gstRate: item.product.category?.gstRate ?? 18,
      })),
    };

    return NextResponse.json(formattedOrder);
  } catch (error: any) {
    console.error(`Order GET error for ID ${params.id}:`, error.message);
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
}
