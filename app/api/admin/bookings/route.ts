import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLoyaltyConfig } from "@/lib/loyalty";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const bookings = await prisma.serviceBooking.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Database query failed, returning offline simulation status", error);
    return NextResponse.json([]); // Client will handle local storage simulation
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: { status },
    });

    if (status === "COMPLETED" && updated.userId) {
      const existingTx = await prisma.vegaPointsTransaction.findFirst({
        where: {
          userId: updated.userId,
          reason: {
            contains: `service booking #${id}`,
          },
        },
      });

      if (!existingTx) {
        const config = await getLoyaltyConfig();
        const servicePriceRupees = updated.price / 100;
        const earnedPoints = Math.floor(servicePriceRupees * (config.earnServices / 100));

        if (earnedPoints > 0) {
          await prisma.user.update({
            where: { id: updated.userId },
            data: {
              vegaPoints: {
                increment: earnedPoints,
              },
            },
          });

          await prisma.vegaPointsTransaction.create({
            data: {
              userId: updated.userId,
              amount: earnedPoints,
              type: "EARNED",
              reason: `Earned from completing service booking #${id}`,
            },
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Database update failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
