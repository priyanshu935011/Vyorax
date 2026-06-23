import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export async function GET() {
  try {
    // Attempt to query products from the database
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (dbProducts.length === 0) {
      return NextResponse.json(MOCK_PRODUCTS);
    }

    // Map database products to the standard mock interface format for uniform processing in the search component
    const mappedProducts = dbProducts.map((p) => {
      const categoryName = p.category?.name || "Cycles";
      const categorySlug = p.category?.slug || "cycles";
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: Number(p.price),
        comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
        images: p.images,
        categoryId: p.categoryId,
        categoryName,
        categorySlug,
        stock: p.stock,
        sku: p.sku,
        brand: p.brand || "Vyorax",
        tags: p.tags,
        specs: p.specs,
        rating: 4.8,
        reviewsCount: 2,
      };
    });

    return NextResponse.json(mappedProducts);
  } catch (error: any) {
    console.warn("Search API DB offline. Returning fallback mock products. Error:", error.message);
    return NextResponse.json(MOCK_PRODUCTS);
  }
}
