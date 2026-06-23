import { auth } from "@/lib/auth";
import { prisma, getOrCreateUserId } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve database cart items including product details
    const dbItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const formattedItems = dbItems.map((item) => {
      const p = item.product;
      const isCycle =
        p.sku.includes("CYC") ||
        p.name.toLowerCase().includes("carbon") ||
        p.name.toLowerCase().includes("mtb") ||
        p.name.toLowerCase().includes("hybrid") ||
        p.name.toLowerCase().includes("rider") ||
        p.name.toLowerCase().includes("swift");

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.images[0] || "",
        quantity: item.quantity,
        stock: p.stock,
        sku: p.sku,
        isCycle,
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error: any) {
    console.error("Cart GET error:", error.message);
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const body = await req.json();
    const { items, action } = body; // items: Array of { id: string, quantity: number }, action: "merge" | "replace"

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    if (action === "merge") {
      // 1. Fetch current database cart
      const dbItems = await prisma.cartItem.findMany({
        where: { userId },
      });

      const validItems = items.filter(item => !item.isGift);
      if (validItems.length > 0) {
        const productIds = validItems.map(item => item.id);

        // Verify products exist in bulk
        const existingProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true }
        });
        const existingIds = new Set(existingProducts.map(p => p.id));

        const updates = [];
        const creations = [];

        for (const item of validItems) {
          if (!existingIds.has(item.id)) continue;

          const existing = dbItems.find((d) => d.productId === item.id);
          if (existing) {
            updates.push(
              prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: Math.min(existing.quantity + item.quantity, 99) },
              })
            );
          } else {
            creations.push({
              userId,
              productId: item.id,
              quantity: item.quantity
            });
          }
        }

        const promises: any[] = [...updates];
        if (creations.length > 0) {
          promises.push(prisma.cartItem.createMany({ data: creations }));
        }

        if (promises.length > 0) {
          await prisma.$transaction(promises);
        }
      }
    } else {
      // action === "replace" or default: overwrite the database cart with the client cart state
      // 1. Delete all existing records for the user
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      // 2. Filter out gifts and get unique product IDs
      const validItems = items.filter(item => !item.isGift);
      if (validItems.length > 0) {
        const productIds = validItems.map(item => item.id);
        
        // 3. Verify products exist in bulk
        const existingProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true }
        });
        const existingIds = new Set(existingProducts.map(p => p.id));

        const cartItemsToCreate = validItems
          .filter(item => existingIds.has(item.id))
          .map(item => ({
            userId,
            productId: item.id,
            quantity: item.quantity
          }));

        if (cartItemsToCreate.length > 0) {
          await prisma.cartItem.createMany({
            data: cartItemsToCreate
          });
        }
      }
    }

    // Fetch and return the fully populated updated list
    const updatedDbItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const formattedItems = updatedDbItems.map((item) => {
      const p = item.product;
      const isCycle =
        p.sku.includes("CYC") ||
        p.name.toLowerCase().includes("carbon") ||
        p.name.toLowerCase().includes("mtb") ||
        p.name.toLowerCase().includes("hybrid") ||
        p.name.toLowerCase().includes("rider") ||
        p.name.toLowerCase().includes("swift");

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.images[0] || "",
        quantity: item.quantity,
        stock: p.stock,
        sku: p.sku,
        isCycle,
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error: any) {
    console.error("Cart POST error:", error.message);
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
}
