import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function checkAdminAuth() {
  const session = await auth();
  return session && session.user.role === "ADMIN";
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    let user = null;
    let email = "";
    let phone = "";

    const decodedId = decodeURIComponent(id);
    
    // 1. Try resolving registered user by ID, phone, or email
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { phone: decodedId },
          { email: decodedId }
        ]
      }
    });

    if (user) {
      try {
        const { getActivePointsBalance } = await import("@/lib/loyalty");
        await getActivePointsBalance(user.id);
      } catch (e) {
        console.warn("Active points sync failed in admin customer GET:", e);
      }

      // Re-fetch with relations
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          addresses: true,
          pointsTransactions: {
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      });
    }

    if (user) {
      email = user.email || "";
      phone = user.phone || "";
    } else {
      if (decodedId.includes("@")) {
        email = decodedId.trim().toLowerCase();
      } else {
        phone = decodedId.trim();
      }
    }

    // 2. Fetch Orders for this customer (registered user ID, guest phone, or guest email)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          user ? { userId: user.id } : undefined,
          phone ? { guestPhone: phone } : undefined,
          email ? { guestEmail: { equals: email, mode: "insensitive" } } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Fetch Servicing/Repair Bookings
    const bookings = await prisma.serviceBooking.findMany({
      where: {
        OR: [
          user ? { userId: user.id } : undefined,
          user && user.phone ? { phone: user.phone } : undefined,
          email ? { user: { email: { equals: email, mode: "insensitive" } } } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4. Fetch Warranty Claims for all order IDs
    const orderIds = orders.map((o) => o.id);
    const warrantyClaims = await prisma.warrantyClaim.findMany({
      where: {
        orderId: { in: orderIds },
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 5. Fetch Cart Items & Wishlist
    let cartItems: any[] = [];
    let wishlistItems: any[] = [];

    if (user) {
      cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });
      wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });
    }

    // 6. Map and return response
    let expirations: any[] = [];
    if (user) {
      try {
        expirations = await prisma.vegaPointsTransaction.findMany({
          where: {
            userId: user.id,
            amount: { gt: 0 },
            remainingAmount: { gt: 0 },
            expiresAt: { gt: new Date() }
          },
          orderBy: {
            expiresAt: "asc"
          },
          select: {
            remainingAmount: true,
            expiresAt: true
          }
        });
      } catch (e) {
        console.error("Failed to query expirations in admin details:", e);
      }
    }

    let profileCompletionPercent = 0;
    if (user) {
      try {
        const { calculateProfileCompletion } = await import("@/lib/loyalty");
        profileCompletionPercent = calculateProfileCompletion(user);
      } catch (e) {}
    }

    const profile = user
      ? {
          id: user.id,
          name: user.name || "Registered Rider",
          email: user.email || "N/A",
          phone: user.phone || "N/A",
          birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : null,
          gender: user.gender || "N/A",
          profileRewardClaimed: user.profileRewardClaimed || false,
          profileCompletionPercent,
          joined: user.createdAt.toISOString().split("T")[0],
          isGuest: false,
          addresses: user.addresses || [],
          vegaPoints: user.vegaPoints || 0,
          pointsTransactions: user.pointsTransactions || [],
          expirations,
        }
      : {
          id: decodedId,
          name: orders[0] ? (orders[0].address as any).name || `Guest ${decodedId.slice(-4)}` : `Guest ${decodedId.slice(-4)}`,
          email: email || "N/A",
          phone: phone || "N/A",
          joined: orders[orders.length - 1] ? orders[orders.length - 1].createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          isGuest: true,
          addresses: orders.map((o) => {
            const addr = (o.address as any) || {};
            return {
              id: o.id + "-addr",
              name: addr.name || `Guest ${decodedId.slice(-4)}`,
              street: addr.street || "",
              city: addr.city || "",
              state: addr.state || "",
              pincode: addr.pincode || "",
              phone: addr.phone || "",
            };
          }),
        };

    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({
      profile,
      orders,
      bookings,
      warrantyClaims,
      cartItems,
      wishlistItems,
      analytics: {
        totalSpent,
        ordersCount: orders.length,
        bookingsCount: bookings.length,
        claimsCount: warrantyClaims.length,
        cartCount: cartItems.length,
        wishlistCount: wishlistItems.length,
      },
    });
  } catch (error: any) {
    console.error("Single customer details API GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
