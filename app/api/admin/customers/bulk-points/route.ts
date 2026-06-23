import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function checkAdminAuth() {
  const session = await auth();
  return session && session.user.role === "ADMIN";
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { amount, expiryDays, reason, isSimulation } = body;

    const pointsAmount = Math.max(1, Math.floor(Number(amount) || 0));
    const reasonText = (reason || "Bulk points distribution by administrator").trim();

    let expiresAt: Date | null = null;
    if (expiryDays && !isNaN(Number(expiryDays)) && Number(expiryDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));
    }

    if (isSimulation) {
      // Simulation mode handles localStorage updates directly from Client
      return NextResponse.json({
        success: true,
        message: "Simulation mode bulk points triggered successfully.",
      });
    }

    // Database mode
    // Find all customers (exclude ADMIN users)
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, vegaPoints: true }
    });

    if (customers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No customers found in database to award points.",
        count: 0
      });
    }

    // Award points and log transactions
    await prisma.$transaction(
      customers.map((c) => {
        return prisma.user.update({
          where: { id: c.id },
          data: {
            vegaPoints: {
              increment: pointsAmount
            }
          }
        });
      })
    );

    // Create point transactions in bulk
    await prisma.vegaPointsTransaction.createMany({
      data: customers.map((c) => ({
        userId: c.id,
        amount: pointsAmount,
        remainingAmount: pointsAmount,
        type: "MANUAL_ADD",
        reason: reasonText,
        expiresAt: expiresAt
      }))
    });

    return NextResponse.json({
      success: true,
      message: `Successfully awarded ${pointsAmount} points to ${customers.length} customers.`,
      count: customers.length
    });
  } catch (error: any) {
    console.error("POST bulk points error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
