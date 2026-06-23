import ProductsClient from "@/components/store/ProductsClient";
import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mockData";
import { Suspense } from "react";

export const revalidate = 60; // Incremental Static Regeneration - cache revalidation every 60s

export default async function ProductsPage() {
  let products = [];
  let categories = [];

  try {
    products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
        reviews: {
          where: { isApproved: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    categories = await prisma.category.findMany();

    if (products.length === 0) {
      products = MOCK_PRODUCTS;
      categories = MOCK_CATEGORIES;
    }
  } catch (error: any) {
    console.warn("Database offline. Falling back to mock product garage list. Error:", error.message);
    products = MOCK_PRODUCTS;
    categories = MOCK_CATEGORIES;
  }

  // Map database elements to clean JSON objects for client serialization
  const sanitizedProducts = products.map((p) => {
    // Determine category details
    const categoryName = (p as any).category?.name || (p as any).categoryName || "Cycles";
    const categorySlug = (p as any).category?.slug || (p as any).categorySlug || (MOCK_CATEGORIES.find((c) => c.id === p.categoryId)?.slug) || "cycles";

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      images: p.images,
      shortDescription: p.shortDescription,
      description: p.description,
      stock: p.stock,
      sku: p.sku,
      brand: p.brand || "Vyorax",
      tags: p.tags,
      categoryName,
      categorySlug,
      rating: (p as any).reviews && (p as any).reviews.length > 0
        ? Number(((p as any).reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / (p as any).reviews.length).toFixed(1))
        : 4.8,
      reviewsCount: (p as any).reviews && (p as any).reviews.length > 0
        ? (p as any).reviews.length
        : 2,
      createdAt: (p as any).createdAt instanceof Date ? (p as any).createdAt.toISOString() : new Date().toISOString(),
    };
  });

  const sanitizedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: (c as any).parentId || null,
  }));

  return (
    <Suspense fallback={
      <div className="bg-[var(--obsidian)] min-h-screen text-[var(--white)] pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--steel)] border-t-[var(--agni)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--silver)] font-sans uppercase tracking-wider font-bold animate-pulse">
            Opening the garage door...
          </p>
        </div>
      </div>
    }>
      <ProductsClient initialProducts={sanitizedProducts} categories={sanitizedCategories} />
    </Suspense>
  );
}
