import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { applyPointsForOrder, cancelPointsForOrder } from "@/lib/loyalty";

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

    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // Format to match the admin dashboard format
    const formattedOrders = orders.map((o) => {
      const addr = o.address as any;
      const customerName = o.user?.name || addr?.name || "Guest Customer";
      const customerEmail = o.user?.email || o.guestEmail || "";
      const customerPhone = o.user?.phone || addr?.phone || "";

      return {
        id: o.id,
        customer: customerName,
        email: customerEmail,
        phone: customerPhone,
        date: o.createdAt.toISOString().split("T")[0],
        total: o.total,
        status: o.status,
        paymentId: o.razorpayPaymentId || "Mock Bypass",
        courier: o.trackingId ? "Vyorax Delivery" : "",
        trackingId: o.trackingId || "",
        address: o.address,
        items: o.items.map((item) => ({
          name: item.product.name,
          qty: item.quantity,
          price: item.price,
          image: item.product.images[0] || "",
        })),
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error("Admin orders GET error:", error.message);
    return new NextResponse("Database error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, status, courier, trackingId } = await req.json();

    if (!id) {
      return new NextResponse("Missing order ID", { status: 400 });
    }

    // Find existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      // Add status history entry
      const history = Array.isArray(existingOrder.statusHistory) ? existingOrder.statusHistory : [];
      updateData.statusHistory = [
        ...history,
        {
          status,
          timestamp: new Date().toISOString(),
          message: `Order status updated to ${status}.`,
        },
      ];
    }
    if (courier !== undefined || trackingId !== undefined) {
      updateData.trackingId = trackingId || existingOrder.trackingId || "";
      updateData.trackingUrl = trackingId ? `https://vega-shipping/${trackingId}` : "";
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (status) {
      if (status === "CONFIRMED" || status === "PROCESSING" || status === "SHIPPED" || status === "DELIVERED") {
        await applyPointsForOrder(id);
      } else if (status === "CANCELLED" || status === "REFUNDED") {
        await cancelPointsForOrder(id);
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Admin orders PUT error:", error.message);
    return new NextResponse("Failed to update order", { status: 500 });
  }
}
