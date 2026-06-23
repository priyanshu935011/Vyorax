import { prisma } from "@/lib/db";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export interface ValidateCouponResult {
  valid: boolean;
  error?: string;
  coupon?: any;
}

export async function validateCoupon(
  code: string,
  phone: string | undefined | null,
  cartItems: any[],
  subtotal: number
): Promise<ValidateCouponResult> {
  if (!code) {
    return { valid: false, error: "Coupon code is required." };
  }

  const normalizedCode = code.trim().toUpperCase();

  // 1. Load coupons from settings
  let coupons: any[] = [];
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    const config = settings?.homepageConfig as any;
    if (config && Array.isArray(config.coupons)) {
      coupons = config.coupons;
    }
  } catch (e) {
    console.warn("DB offline or settings table missing. Using mock coupons fallback.");
  }

  // Default mock coupons fallback for offline sandbox testing
  if (coupons.length === 0) {
    coupons = [
      {
        id: "mock-cpn-welcome",
        code: "WELCOME10",
        desc: "10% off for first-time customers (Min. ₹1,000)",
        discountType: "percentage",
        discountValue: 10,
        minPurchase: 100000, // ₹1,000 in paise
        targetType: "first_time",
        targetValue: "",
      },
      {
        id: "mock-cpn-mega",
        code: "MEGA500",
        desc: "Flat ₹500 off on orders above ₹3,000",
        discountType: "flat",
        discountValue: 50000, // ₹500 in paise
        minPurchase: 300000, // ₹3,000 in paise
        targetType: "all",
        targetValue: "",
      },
      {
        id: "mock-cpn-freebie",
        code: "FREEBIE",
        desc: "Free helmet on orders above ₹5,000",
        discountType: "gift",
        discountValue: "VEGA-ACC-HELM", // Product SKU or ID in mock data
        minPurchase: 500000, // ₹5,000 in paise
        targetType: "all",
        targetValue: "",
      }
    ];
  }

  // 2. Find coupon
  const coupon = coupons.find((c) => c.code === normalizedCode);
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code." };
  }

  // 3. Validate Minimum Order Subtotal
  const minPurchasePaise = Number(coupon.minPurchase) || 0;
  if (subtotal < minPurchasePaise) {
    return {
      valid: false,
      error: `Minimum purchase of ₹${(minPurchasePaise / 100).toLocaleString("en-IN")} is required for this coupon.`,
    };
  }

  // 4. Validate Expiry Date
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    const now = new Date();
    // Set expiry to end of that day (23:59:59)
    expiry.setHours(23, 59, 59, 999);
    if (now > expiry) {
      return {
        valid: false,
        error: "This coupon code has expired.",
      };
    }
  }

  // 5. Validate Overall Usage Limit
  if (coupon.usageLimit) {
    try {
      const usageCount = await prisma.order.count({
        where: {
          couponCode: coupon.code,
          status: { not: "CANCELLED" },
        },
      });
      if (usageCount >= Number(coupon.usageLimit)) {
        return {
          valid: false,
          error: "Already used",
        };
      }
    } catch (err) {
      console.warn("Could not check overall coupon usage in database.");
    }
  }

  // 6. Validate Per-User/Mobile Usage Limit
  if (coupon.userLimit) {
    if (!phone) {
      return {
        valid: false,
        error: "Mobile number is required to validate customer usage limits.",
      };
    }
    const cleanPhone = phone.trim();
    try {
      const userUsageCount = await prisma.order.count({
        where: {
          couponCode: coupon.code,
          status: { not: "CANCELLED" },
          OR: [
            { guestPhone: cleanPhone },
            { user: { phone: cleanPhone } }
          ]
        },
      });
      if (userUsageCount >= Number(coupon.userLimit)) {
        return {
          valid: false,
          error: "Already used",
        };
      }
    } catch (err) {
      console.warn("Could not check per-user coupon usage in database.");
    }
  }

  // 7. Validate Specific Customer Target (Target Phone Number)
  if (coupon.targetType === "customer") {
    if (!phone || phone.trim() !== coupon.targetValue.trim()) {
      return {
        valid: false,
        error: "This coupon is only valid for a specific customer mobile number.",
      };
    }
  }

  // 8. Validate First-Time Customers
  if (coupon.targetType === "first_time") {
    if (!phone) {
      return {
        valid: false,
        error: "Mobile number is required to validate first-time customer status.",
      };
    }
    const cleanPhone = phone.trim();
    try {
      const orderCount = await prisma.order.count({
        where: {
          OR: [
            { guestPhone: cleanPhone },
            { user: { phone: cleanPhone } }
          ]
        },
      });
      if (orderCount > 0) {
        return {
          valid: false,
          error: "This coupon is only valid for first-time customers.",
        };
      }
    } catch (err) {
      console.warn("Could not check orders count in database.");
    }
  }

  // 9. Validate Category Restrictions
  if (coupon.targetType === "category") {
    const targetCategory = coupon.targetValue.trim();
    let hasMatchingCategoryItem = false;

    try {
      const itemIds = cartItems.map((item: any) => item.id);
      const productsInCart = await prisma.product.findMany({
        where: { id: { in: itemIds } },
        include: { category: true },
      });

      hasMatchingCategoryItem = productsInCart.some(
        (p) =>
          p.categoryId === targetCategory ||
          p.category?.slug === targetCategory ||
          p.category?.name === targetCategory
      );
    } catch (e) {
      // Fallback: Check mock data items
      hasMatchingCategoryItem = cartItems.some((item: any) => {
        const mockP = MOCK_PRODUCTS.find((p) => p.id === item.id || p.sku === item.sku);
        if (mockP) {
          return (
            mockP.categoryId === targetCategory ||
            mockP.categoryName?.toLowerCase() === targetCategory.toLowerCase()
          );
        }
        return false;
      });
    }

    if (!hasMatchingCategoryItem) {
      return {
        valid: false,
        error: `This coupon is only valid for products in the category: ${targetCategory}.`,
      };
    }
  }

  return {
    valid: true,
    coupon,
  };
}
