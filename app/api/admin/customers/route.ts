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

    // 1. Fetch registered users who are CUSTOMERs
    const dbUsers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        orders: true,
      },
    });

    // 2. Fetch all guest orders (userId is null)
    const guestOrders = await prisma.order.findMany({
      where: { userId: null, guestEmail: { not: null } },
    });

    // 3. Map registered users to customer records
    const customersMap = new Map<string, any>();

    for (const u of dbUsers) {
      const orders = u.orders || [];
      const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
      
      const key = (u.phone || u.email || u.id).toLowerCase();
      
      customersMap.set(key, {
        id: u.id,
        name: u.name || "Registered Rider",
        email: u.email || "N/A",
        phone: u.phone || "N/A",
        ordersCount: orders.length,
        totalSpent,
        joined: u.createdAt.toISOString().split("T")[0],
        isGuest: false,
      });
    }

    // 4. Map guest orders to guest customer records
    for (const o of guestOrders) {
      const addr = typeof o.address === "object" && o.address !== null ? (o.address as any) : {};
      const phoneVal = o.guestPhone || addr.phone;
      const emailVal = o.guestEmail;
      
      if (!phoneVal && !emailVal) continue;
      
      const key = (phoneVal || emailVal || "").toLowerCase();
      const guestName = addr.name || (phoneVal ? `Guest ${phoneVal.slice(-4)}` : emailVal?.split("@")[0] || "Guest Customer");

      if (customersMap.has(key)) {
        const existing = customersMap.get(key);
        existing.ordersCount += 1;
        existing.totalSpent += o.total;
        if (existing.phone === "N/A" && phoneVal) {
          existing.phone = phoneVal;
        }
        if (existing.email === "N/A" && emailVal) {
          existing.email = emailVal;
        }
      } else {
        const guestKey = key + "-guest";
        if (customersMap.has(guestKey)) {
          const existing = customersMap.get(guestKey);
          existing.ordersCount += 1;
          existing.totalSpent += o.total;
          if (existing.phone === "N/A" && phoneVal) {
            existing.phone = phoneVal;
          }
          if (existing.email === "N/A" && emailVal) {
            existing.email = emailVal;
          }
        } else {
          customersMap.set(guestKey, {
            id: phoneVal || emailVal,
            name: guestName,
            email: emailVal || "N/A",
            phone: phoneVal || "N/A",
            ordersCount: 1,
            totalSpent: o.total,
            joined: o.createdAt.toISOString().split("T")[0],
            isGuest: true,
          });
        }
      }
    }

    const customersList = Array.from(customersMap.values());
    
    // Sort by joined date descending
    customersList.sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());

    return NextResponse.json(customersList);
  } catch (error: any) {
    console.error("Customers GET error:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
