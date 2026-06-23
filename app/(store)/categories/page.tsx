import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mockData";
import CategoriesClient from "./CategoriesClient";

export const revalidate = 60; // Revalidate every 60s

export default async function CategoriesPage() {
  let categories = [];
  let products = [];

  // 1. Fetch categories
  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    if (categories.length === 0) {
      categories = MOCK_CATEGORIES;
    }
  } catch (err) {
    console.warn("Db offline, falling back to mock categories");
    categories = MOCK_CATEGORIES;
  }

  // 2. Fetch products
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        reviews: {
          where: { isApproved: true }
        }
      }
    });
    if (products.length === 0) {
      products = MOCK_PRODUCTS;
    }
  } catch (err) {
    console.warn("Db offline, falling back to mock products");
    products = MOCK_PRODUCTS;
  }

  // Sanitize products data
  const sanitizedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    images: p.images,
    shortDescription: p.shortDescription,
    stock: p.stock,
    sku: p.sku,
    categoryId: p.categoryId,
    rating: p.reviews && p.reviews.length > 0
      ? Number((p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length).toFixed(1))
      : p.rating || 4.8,
    reviewsCount: p.reviews && p.reviews.length > 0
      ? p.reviews.length
      : p.reviewsCount || 2,
  }));

  const parentCategories = categories.filter((c: any) => !c.parentId);
  const subCategories = categories.filter((c: any) => c.parentId !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold uppercase tracking-wider text-white">
          Shop by Category
        </h1>
        <p className="text-xs text-[var(--smoke)] mt-1.5 font-sans">
          Select a category registry to browse elite bikes, gear, and performance equipment.
        </p>
      </div>

      <CategoriesClient
        parentCategories={parentCategories}
        subCategories={subCategories}
        products={sanitizedProducts}
      />
    </div>
  );
}
