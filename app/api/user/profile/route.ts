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

    // Dynamic active points expiration checker & cache sync
    try {
      const { getActivePointsBalance } = await import("@/lib/loyalty");
      await getActivePointsBalance(userId);
    } catch (e) {
      console.warn("Loyalty sync failed in profile GET:", e);
    }

    const { checkAndAwardProfileCompletionPoints, calculateProfileCompletion } = await import("@/lib/loyalty");
    await checkAndAwardProfileCompletionPoints(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        vegaPoints: true,
        birthday: true,
        gender: true,
        profileRewardClaimed: true,
        pointsTransactions: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileCompletionPercent = calculateProfileCompletion(user);

    // Query active expirations
    const expirations = await prisma.vegaPointsTransaction.findMany({
      where: {
        userId,
        amount: { gt: 0 },
        remainingAmount: { gt: 0 },
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        expiresAt: "asc"
      },
      select: {
        remainingAmount: true,
        expiresAt: true
      }
    });

    return NextResponse.json({
      ...user,
      profileCompletionPercent,
      expirations
    });
  } catch (error: any) {
    console.error("Profile GET error:", error.message);
    return NextResponse.json({ error: "Database offline" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { name, phone, email, birthday, gender } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        email: email || null,
        birthday: birthday ? new Date(birthday) : null,
        gender: gender || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        gender: true,
        profileRewardClaimed: true,
      },
    });

    // Check and trigger reward on completion
    const { checkAndAwardProfileCompletionPoints, calculateProfileCompletion } = await import("@/lib/loyalty");
    await checkAndAwardProfileCompletionPoints(userId);

    // Fetch updated details
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthday: true,
        gender: true,
        vegaPoints: true,
        profileRewardClaimed: true,
      }
    });

    const profileCompletionPercent = calculateProfileCompletion(finalUser || updatedUser);

    return NextResponse.json({
      success: true,
      user: {
        ...(finalUser || updatedUser),
        profileCompletionPercent
      }
    });
  } catch (error: any) {
    console.error("Profile PUT error:", error.message);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
