import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS, MOCK_REVIEWS } from "@/lib/mockData";
import ProductDetailClient from "@/components/store/ProductDetailClient";

export const revalidate = 60; // Incremental Static Regeneration - 60s revalidation

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Fetch helper with fallback
async function getProductData(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (product) {
      // Find related products lists
      let relatedProductsList: any[] = [];
      if (product.relatedProducts && product.relatedProducts.length > 0) {
        relatedProductsList = await prisma.product.findMany({
          where: {
            id: { in: product.relatedProducts },
            isActive: true,
          },
          take: 4,
        });
      }
      return { 
        product: { ...product, relatedProductsList }, 
        source: "database" 
      };
    }
  } catch (e) {
    console.warn(`Database query failed for product slug: ${slug}. Falling back to mock data.`);
  }

  // Fallback to offline mock data
  const mockProduct = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (mockProduct) {
    // Fill mock related products list
    const relatedProductsList = MOCK_PRODUCTS.filter((p) =>
      mockProduct.relatedProducts.includes(p.id)
    );
    return { 
      product: { 
        ...mockProduct, 
        reviews: MOCK_REVIEWS.filter((r) => r.productId === mockProduct.id).map((r) => ({
          id: r.id,
          productId: r.productId,
          userId: null,
          guestName: r.userName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          images: [] as string[],
          verified: r.verified,
          isApproved: true,
          createdAt: new Date(r.createdAt),
        })),
        relatedProductsList, 
      }, 
      source: "mock" 
    };
  }

  return { product: null, source: "none" };
}

// Fetch all products list for comparison modal
async function getAllActiveProducts() {
  try {
    const list = await prisma.product.findMany({
      where: { isActive: true },
    });
    if (list.length > 0) return list;
  } catch (e) {
    // ignore
  }
  return MOCK_PRODUCTS;
}

// Fetch all static slugs for static pre-rendering
export async function generateStaticParams() {
  try {
    const list = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true }
    });
    if (list.length > 0) {
      return list.map((p) => ({ slug: p.slug }));
    }
  } catch (e) {
    // ignore
  }
  return MOCK_PRODUCTS.map((p) => ({ slug: p.slug }));
}

// Dynamic SEO Metadata API
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { product } = await getProductData(params.slug);
  
  if (!product) {
    return {
      title: "Product Not Found — Vyorax",
    };
  }

  return {
    title: `${product.name} — Vyorax`,
    description: product.metaDescription || product.shortDescription,
    openGraph: {
      title: `${product.name} — Vyorax`,
      description: product.shortDescription,
      images: [{ url: product.images[0], width: 1200, height: 630, alt: product.name }],
      type: "website",
    },
    alternates: {
      canonical: `https://vyorax.in/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { product } = await getProductData(params.slug);
  
  if (!product) {
    notFound();
  }

  const allProducts = await getAllActiveProducts();

  // Create JSON-LD schema
  const avgRating = (product as any).rating || 4.8;
  const reviewsCount = product.reviews?.length || 2;
  const brandName = product.brand || "Vyorax";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description || product.shortDescription,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      price: Number(product.price) / 100,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://vyorax.in/products/${product.slug}`,
    },
    aggregateRating: reviewsCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviewsCount,
    } : undefined,
  };

  return (
    <>
      {/* Inject Structured Data schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ProductDetailClient product={product} allProducts={allProducts} />
    </>
  );
}
