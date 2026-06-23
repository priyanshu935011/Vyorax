import { prisma } from "./db";

export function getProductCategoryGroup(slug: string): "cycles" | "accessories" | "other" {
  const s = slug.toLowerCase();
  if (s.includes("cycle") || s === "mtb" || s === "men" || s === "women" || s === "kids") {
    return "cycles";
  }
  return "accessories";
}

export async function getLoyaltyConfig() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    const config = (settings?.homepageConfig as any) || {};
    const loyaltyConfig = config.loyaltyConfig || {};
    return {
      earnCycles: Number(loyaltyConfig.earnCycles ?? 2),
      earnAccessories: Number(loyaltyConfig.earnAccessories ?? 5),
      earnServices: Number(loyaltyConfig.earnServices ?? 5),
      maxRedeemPercent: Number(loyaltyConfig.maxRedeemPercent ?? 10),
      signupPoints: Number(loyaltyConfig.signupPoints ?? 100),
      signupExpiryDays: Number(loyaltyConfig.signupExpiryDays ?? 365),
      signupEnabled: loyaltyConfig.signupEnabled !== false,
      firstOrderPoints: Number(loyaltyConfig.firstOrderPoints ?? 200),
      firstOrderExpiryDays: Number(loyaltyConfig.firstOrderExpiryDays ?? 30),
      firstOrderEnabled: loyaltyConfig.firstOrderEnabled !== false,
      birthdayPoints: Number(loyaltyConfig.birthdayPoints ?? 150),
      birthdayExpiryDays: Number(loyaltyConfig.birthdayExpiryDays ?? 30),
      birthdayEnabled: loyaltyConfig.birthdayEnabled !== false,
      profilePoints: Number(loyaltyConfig.profilePoints ?? 100),
      profileExpiryDays: Number(loyaltyConfig.profileExpiryDays ?? 30),
      profileEnabled: loyaltyConfig.profileEnabled !== false,
    };
  } catch (e) {
    console.warn("Failed to fetch loyalty config:", e);
    return {
      earnCycles: 2,
      earnAccessories: 5,
      earnServices: 5,
      maxRedeemPercent: 10,
      signupPoints: 100,
      signupExpiryDays: 365,
      signupEnabled: true,
      firstOrderPoints: 200,
      firstOrderExpiryDays: 30,
      firstOrderEnabled: true,
      birthdayPoints: 150,
      birthdayExpiryDays: 30,
      birthdayEnabled: true,
      profilePoints: 100,
      profileExpiryDays: 30,
      profileEnabled: true,
    };
  }
}

export async function calculateOrderEarnedPoints(items: { id: string; quantity: number; price: number }[]) {
  const config = await getLoyaltyConfig();
  let totalEarned = 0;

  for (const item of items) {
    let dbProduct = await prisma.product.findUnique({
      where: { id: item.id },
      include: { category: true },
    });

    if (!dbProduct) {
      dbProduct = await prisma.product.findUnique({
        where: { sku: item.id },
        include: { category: true },
      });
    }

    let earnPercent = config.earnAccessories;
    if (dbProduct) {
      const catGroup = getProductCategoryGroup(dbProduct.category.slug);
      if (catGroup === "cycles") {
        earnPercent = config.earnCycles;
      }
    }

    const itemQty = item.quantity || 1;
    const itemTotalRupees = (item.price * itemQty) / 100;
    totalEarned += Math.floor(itemTotalRupees * (earnPercent / 100));
  }

  return totalEarned;
}

/**
 * Migrate legacy points records by setting remainingAmount = amount for active user points.
 */
export async function initializeUserLoyaltyFIFO(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vegaPoints: true }
    });
    if (!user || user.vegaPoints <= 0) return;

    // Check if user already has transactions with remainingAmount > 0
    const activeEarningSum = await prisma.vegaPointsTransaction.aggregate({
      where: {
        userId,
        amount: { gt: 0 },
        remainingAmount: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      _sum: { remainingAmount: true }
    });

    const sumActive = activeEarningSum._sum.remainingAmount || 0;
    if (sumActive > 0) {
      return; // Already initialized or has active points
    }

    // We need to initialize. Load all transactions for this user.
    const allTxs = await prisma.vegaPointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });

    const positiveTxs = allTxs.filter(t => t.amount > 0);
    const negativeTxs = allTxs.filter(t => t.amount < 0);

    // 1. Reset all positive transactions to remainingAmount = amount
    for (const tx of positiveTxs) {
      await prisma.vegaPointsTransaction.update({
        where: { id: tx.id },
        data: { remainingAmount: tx.amount }
      });
    }

    // 2. Consume points for all negative transactions in FIFO order
    for (const negTx of negativeTxs) {
      const amountToDeduct = Math.abs(negTx.amount);
      let remainingToDeduct = amountToDeduct;

      const activeEarnings = await prisma.vegaPointsTransaction.findMany({
        where: { userId, amount: { gt: 0 }, remainingAmount: { gt: 0 } },
        orderBy: { createdAt: "asc" }
      });

      for (const tx of activeEarnings) {
        if (remainingToDeduct <= 0) break;
        const deduct = Math.min(tx.remainingAmount, remainingToDeduct);
        await prisma.vegaPointsTransaction.update({
          where: { id: tx.id },
          data: { remainingAmount: { decrement: deduct } }
        });
        remainingToDeduct -= deduct;
      }
    }
  } catch (error) {
    console.error("Failed to initialize FIFO loyalty transactions:", error);
  }
}

/**
 * Calculates dynamic active points balance, automatically handles expirations, and syncs User.vegaPoints cache.
 */
export async function getActivePointsBalance(userId: string): Promise<number> {
  try {
    await checkAndAwardBirthdayPoints(userId);
    await initializeUserLoyaltyFIFO(userId);

    const activeSum = await prisma.vegaPointsTransaction.aggregate({
      where: {
        userId,
        amount: { gt: 0 },
        remainingAmount: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      _sum: { remainingAmount: true }
    });

    const computedActivePoints = activeSum._sum.remainingAmount || 0;

    // Sync cached vegaPoints on User record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vegaPoints: true }
    });

    if (user && user.vegaPoints !== computedActivePoints) {
      await prisma.user.update({
        where: { id: userId },
        data: { vegaPoints: computedActivePoints }
      });
    }

    return computedActivePoints;
  } catch (e) {
    console.error("Error in getActivePointsBalance:", e);
    // Safe fallback: check user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vegaPoints: true }
    });
    return user?.vegaPoints || 0;
  }
}

/**
 * Deducts points from active unexpired transactions in FIFO order (closest to expiry first).
 */
export async function consumePoints(userId: string, amountToConsume: number) {
  await initializeUserLoyaltyFIFO(userId);

  // Load all positive transactions with remaining amount that are not expired
  const activeEarnings = await prisma.vegaPointsTransaction.findMany({
    where: {
      userId,
      amount: { gt: 0 },
      remainingAmount: { gt: 0 },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  // Sort: expiring soonest first, then non-expiring/oldest first
  const sortedEarnings = [...activeEarnings].sort((a, b) => {
    if (a.expiresAt && b.expiresAt) {
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    }
    if (a.expiresAt) return -1;
    if (b.expiresAt) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  let remainingToDeduct = amountToConsume;
  for (const tx of sortedEarnings) {
    if (remainingToDeduct <= 0) break;
    const deduct = Math.min(tx.remainingAmount, remainingToDeduct);
    await prisma.vegaPointsTransaction.update({
      where: { id: tx.id },
      data: {
        remainingAmount: {
          decrement: deduct
        }
      }
    });
    remainingToDeduct -= deduct;
  }
}

/**
 * Award Account Signup Points bonus.
 */
export async function handleSignupPoints(userId: string) {
  try {
    const config = await getLoyaltyConfig();
    if (!config.signupEnabled || config.signupPoints <= 0) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.signupExpiryDays);

    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: config.signupPoints,
        remainingAmount: config.signupPoints,
        type: "SIGNUP",
        reason: "Welcome bonus points for account signup",
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          increment: config.signupPoints,
        },
      },
    });
  } catch (error) {
    console.error("Failed to award signup points:", error);
  }
}

/**
 * Calculates profile completion percentage out of 5 key fields (Name, Email, Phone, Gender, Birthday)
 */
export function calculateProfileCompletion(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthday?: Date | string | null;
}) {
  let filledFields = 0;
  const totalFields = 5;

  if (user.name && user.name.trim().length > 0) filledFields++;
  if (user.email && user.email.trim().length > 0) filledFields++;
  if (user.phone && user.phone.trim().length > 0) filledFields++;
  if (user.gender && user.gender.trim().length > 0) filledFields++;
  if (user.birthday) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Check profile completion percentage and award points if 100% complete and reward is unclaimed.
 */
export async function checkAndAwardProfileCompletionPoints(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        gender: true,
        birthday: true,
        profileRewardClaimed: true,
      }
    });

    if (!user || user.profileRewardClaimed) return;

    const completionPercent = calculateProfileCompletion(user);
    if (completionPercent < 100) return;

    const config = await getLoyaltyConfig();
    if (!config.profileEnabled || config.profilePoints <= 0) return;

    // Award profile completion bonus
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.profileExpiryDays);

    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: config.profilePoints,
        remainingAmount: config.profilePoints,
        type: "PROFILE_COMPLETION",
        reason: "Welcome reward for profile details completion",
        expiresAt,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          increment: config.profilePoints,
        },
        profileRewardClaimed: true,
      },
    });

    // Sync active points balance cache
    await getActivePointsBalance(userId);
  } catch (error) {
    console.error("Failed to check/award profile completion points:", error);
  }
}

/**
 * Check and award Birthday Points bonus.
 */
export async function checkAndAwardBirthdayPoints(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthday: true }
    });

    if (!user || !user.birthday) return;

    const config = await getLoyaltyConfig();
    if (!config.birthdayEnabled || config.birthdayPoints <= 0) return;

    const today = new Date();
    const bday = new Date(user.birthday);

    // Check if month and day match
    const isBirthdayToday = today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth();
    if (!isBirthdayToday) return;

    // Check if they already got a birthday bonus this calendar year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

    const existingBonus = await prisma.vegaPointsTransaction.findFirst({
      where: {
        userId,
        type: "BIRTHDAY",
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    if (existingBonus) return; // Already awarded this year

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.birthdayExpiryDays);

    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: config.birthdayPoints,
        remainingAmount: config.birthdayPoints,
        type: "BIRTHDAY",
        reason: "Annual Birthday Celebration Bonus!",
        expiresAt
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          increment: config.birthdayPoints
        }
      }
    });
  } catch (error) {
    console.error("Failed to check/award birthday points:", error);
  }
}

export async function applyPointsForOrder(orderId: string): Promise<boolean> {
  // Check if transactions already exist for this order to prevent duplicate processing
  const existingTx = await prisma.vegaPointsTransaction.findFirst({
    where: { orderId },
  });

  if (existingTx) {
    return false; // Already processed
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.userId) {
    return false;
  }

  const userId = order.userId;
  const earned = order.pointsEarned;
  const redeemed = order.pointsRedeemed;
  const config = await getLoyaltyConfig();

  if (redeemed > 0) {
    // Deduct redeemed points in FIFO order
    await consumePoints(userId, redeemed);

    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: -redeemed,
        remainingAmount: 0,
        type: "REDEEMED",
        reason: `Redeemed for order #${orderId}`,
        orderId,
      },
    });

    // Update user balance cache
    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          decrement: redeemed,
        },
      },
    });
  }

  if (earned > 0) {
    // Award earned points (never expire or configure standard order earning expiry if desired)
    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: earned,
        remainingAmount: earned,
        type: "EARNED",
        reason: `Earned from purchase order #${orderId}`,
        orderId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          increment: earned,
        },
      },
    });
  }

  // --- Check First Order Bonus preset ---
  if (config.firstOrderEnabled && config.firstOrderPoints > 0) {
    const pastOrdersCount = await prisma.order.count({
      where: {
        userId,
        id: { not: orderId },
        status: { not: "CANCELLED" },
      },
    });

    if (pastOrdersCount === 0) {
      // Award first order bonus
      const foExpiry = new Date();
      foExpiry.setDate(foExpiry.getDate() + config.firstOrderExpiryDays);

      await prisma.vegaPointsTransaction.create({
        data: {
          userId,
          amount: config.firstOrderPoints,
          remainingAmount: config.firstOrderPoints,
          type: "FIRST_ORDER",
          reason: `First order bonus points (Order #${orderId})`,
          expiresAt: foExpiry,
          orderId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          vegaPoints: {
            increment: config.firstOrderPoints,
          },
        },
      });
    }
  }

  // Sync cache again
  await getActivePointsBalance(userId);

  return true;
}

export async function cancelPointsForOrder(orderId: string): Promise<boolean> {
  // Check if we already did a cancellation refund for this order
  const refundTx = await prisma.vegaPointsTransaction.findFirst({
    where: {
      orderId,
      type: "CANCEL_REFUND",
    },
  });

  if (refundTx) {
    return false; // Already refunded
  }

  // Check if we applied points in the first place
  const appliedTx = await prisma.vegaPointsTransaction.findFirst({
    where: { orderId },
  });

  if (!appliedTx) {
    return false; // Points were never applied to the user
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || !order.userId) {
    return false;
  }

  const userId = order.userId;
  const earned = order.pointsEarned;
  const redeemed = order.pointsRedeemed;

  if (redeemed > 0) {
    // Refund redeemed points to user (never expire refunds for user friendliness)
    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: redeemed,
        remainingAmount: redeemed,
        type: "CANCEL_REFUND",
        reason: `Refund for cancelled order #${orderId}`,
        orderId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          increment: redeemed,
        },
      },
    });
  }

  if (earned > 0) {
    // Revoke earned points from user
    // Subtract from the specific transaction if still active, or subtract from user's active earnings
    const orderEarnedTx = await prisma.vegaPointsTransaction.findFirst({
      where: { orderId, type: "EARNED" }
    });

    if (orderEarnedTx) {
      await prisma.vegaPointsTransaction.update({
        where: { id: orderEarnedTx.id },
        data: { remainingAmount: 0 }
      });
    }

    await prisma.vegaPointsTransaction.create({
      data: {
        userId,
        amount: -earned,
        remainingAmount: 0,
        type: "CANCEL_REFUND",
        reason: `Revoked earnings for cancelled order #${orderId}`,
        orderId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        vegaPoints: {
          decrement: earned,
        },
      },
    });

    // Enforce that points balance doesn't drop below 0
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vegaPoints: true },
    });
    if (user && user.vegaPoints < 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { vegaPoints: 0 },
      });
    }
  }

  // Sync cache again
  await getActivePointsBalance(userId);

  return true;
}
