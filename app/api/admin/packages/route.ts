import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name, price, desc, includes, isActive } = body;

    if (!type || !name || price === undefined || !desc || !includes) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const newPackage = await prisma.servicePackage.create({
      data: {
        type,
        name,
        price: Number(price),
        desc,
        includes: Array.isArray(includes) ? includes : [includes],
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(newPackage);
  } catch (error) {
    console.error("Database package creation failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, type, name, price, desc, includes, isActive } = body;

    if (!id) {
      return new NextResponse("Missing package ID", { status: 400 });
    }

    const updated = await prisma.servicePackage.update({
      where: { id },
      data: {
        type,
        name,
        price: price !== undefined ? Number(price) : undefined,
        desc,
        includes: Array.isArray(includes) ? includes : undefined,
        isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Database package update failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing package ID", { status: 400 });
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database package deletion failed", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
