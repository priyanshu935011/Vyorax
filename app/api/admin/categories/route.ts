import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Auth guard helper
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

    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Categories API GET error:", error.message);
    return new NextResponse("Database offline", { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, slug, parentId, gstRate } = await req.json();

    if (!name || !slug) {
      return new NextResponse("Name and slug are required", { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        parentId: parentId || null,
        gstRate: gstRate !== undefined ? parseInt(gstRate) : 18,
      },
    });

    return NextResponse.json(newCategory);
  } catch (error: any) {
    console.error("Categories API POST error:", error.message);
    return new NextResponse("Failed to create category", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, name, slug, parentId, gstRate } = await req.json();

    if (!id || !name || !slug) {
      return new NextResponse("ID, name and slug are required", { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        parentId: parentId || null,
        gstRate: gstRate !== undefined ? parseInt(gstRate) : undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("Categories API PUT error:", error.message);
    return new NextResponse("Failed to update category", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID is required", { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Categories API DELETE error:", error.message);
    return new NextResponse("Failed to delete category", { status: 500 });
  }
}
