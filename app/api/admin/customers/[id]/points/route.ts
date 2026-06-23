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
    const decodedId = decodeURIComponent(id);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { phone: decodedId },
          { email: decodedId }
        ]
      },
      select: {
        id: true,
        vegaPoints: true,
      }
    });

    if (!user) {
      return NextResponse.json({ vegaPoints: 0, transactions: [] });
    }

    const transactions = await prisma.vegaPointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      vegaPoints: user.vegaPoints,
      transactions,
    });
  } catch (error: any) {
    console.error("GET customer points error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const decodedId = decodeURIComponent(id);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { phone: decodedId },
          { email: decodedId }
        ]
      }
    });

    if (!user) {
      return new NextResponse("Customer not found", { status: 404 });
    }

    const body = await req.json();
    const { amount, type, reason, expiresAt } = body;

    const changeAmount = Math.max(1, Math.floor(Number(amount) || 0));
    if (!type || !["MANUAL_ADD", "MANUAL_SUB"].includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    let actualAmount = changeAmount;
    if (type === "MANUAL_SUB") {
      actualAmount = -changeAmount;
    }

    let newPoints = user.vegaPoints + actualAmount;
    if (newPoints < 0) {
      newPoints = 0; // Cap at 0
    }
    const computedChange = newPoints - user.vegaPoints;

    if (computedChange === 0) {
      return NextResponse.json({
        success: true,
        vegaPoints: user.vegaPoints,
        message: "No points changed.",
      });
    }

    if (computedChange < 0) {
      const { consumePoints } = await import("@/lib/loyalty");
      await consumePoints(user.id, Math.abs(computedChange));
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { vegaPoints: newPoints },
    });

    const transaction = await prisma.vegaPointsTransaction.create({
      data: {
        userId: user.id,
        amount: computedChange,
        remainingAmount: computedChange > 0 ? computedChange : 0,
        type,
        reason: reason || "Manual adjustment by administrator",
        expiresAt: computedChange > 0 && expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      vegaPoints: updatedUser.vegaPoints,
      transaction,
    });
  } catch (error: any) {
    console.error("POST customer points error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
