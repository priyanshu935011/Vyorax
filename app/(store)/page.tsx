import HomeClient from "@/components/store/HomeClient";
import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS, MOCK_SLIDES } from "@/lib/mockData";

export const revalidate = 60; // Incremental Static Regeneration (ISR) - revalidate every 60 seconds

export default async function HomePage() {
  let featuredProducts = [];
  let slides = [];
  let homepageConfig = null;

  // Fetch featured products
  try {
    featuredProducts = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        reviews: {
          where: { isApproved: true },
        },
      },
      take: 3,
    });

    if (featuredProducts.length === 0) {
      featuredProducts = MOCK_PRODUCTS.filter((p) => p.isFeatured);
    }
  } catch (error: any) {
    console.warn("Database offline. Gracefully falling back to mock products. Error:", error.message);
    featuredProducts = MOCK_PRODUCTS.filter((p) => p.isFeatured);
  }

  // Fetch home slides
  try {
    slides = await prisma.homeSlide.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    if (slides.length === 0) {
      slides = MOCK_SLIDES;
    }
  } catch (error: any) {
    console.warn("Database offline. Gracefully falling back to mock slides. Error:", error.message);
    slides = MOCK_SLIDES;
  }

  // Fetch homepage configurations
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    if (settings && settings.homepageConfig) {
      homepageConfig = settings.homepageConfig;
    }
  } catch (error: any) {
    console.warn("Database offline. Gracefully falling back on homepageConfig. Error:", error.message);
  }

  const sanitizedProducts = featuredProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    images: p.images,
    shortDescription: p.shortDescription,
    stock: p.stock,
    sku: p.sku,
    rating: (p as any).reviews && (p as any).reviews.length > 0
      ? Number(((p as any).reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / (p as any).reviews.length).toFixed(1))
      : 4.8,
    reviewsCount: (p as any).reviews && (p as any).reviews.length > 0
      ? (p as any).reviews.length
      : 2,
  }));

  return <HomeClient featuredProducts={sanitizedProducts} initialSlides={slides} initialConfig={homepageConfig} />;
}
