import { auth } from "@/lib/auth";
import { prisma, getOrCreateUserId } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = await getOrCreateUserId(session);
    if (!userId) {
      return new NextResponse("User not found", { status: 404 });
    }

    const bookings = await prisma.serviceBooking.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Bookings API GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = await getOrCreateUserId(session);
    if (!userId) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { type, planName, price, phone, address } = await req.json();

    if (!type || !planName || !price || !phone || !address) {
      return new NextResponse("Required fields missing", { status: 400 });
    }

    const newBooking = await prisma.serviceBooking.create({
      data: {
        userId,
        type,
        planName,
        price: Number(price),
        phone,
        address, // Save JSON address {name, street, city, state, pincode}
        status: "BOOKED",
      },
    });

    return NextResponse.json(newBooking);
  } catch (error: any) {
    console.error("Bookings API POST error:", error.message);
    return new NextResponse("Failed to save booking", { status: 500 });
  }
}
