import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: any
  dbOfflineUntil: number | undefined
}

const OFFLINE_COOLDOWN_MS = 300000; // 5 minutes of caching offline state
const QUERY_TIMEOUT_MS = 2500; // 2.5 seconds database query timeout threshold

function queryTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Prisma query timed out (2500ms limit)")), ms)
  );
}

function checkDbOffline() {
  if (globalForPrisma.dbOfflineUntil && Date.now() < globalForPrisma.dbOfflineUntil) {
    throw new Error("Database connection is currently down (offline cache)");
  }
}

function markDbOffline(errorMsg: string) {
  console.warn(`[Prisma] Database connection offline. Error: ${errorMsg.slice(0, 100)}. Caching offline state for ${OFFLINE_COOLDOWN_MS}ms.`);
  globalForPrisma.dbOfflineUntil = Date.now() + OFFLINE_COOLDOWN_MS;
}

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export const prisma = basePrisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      checkDbOffline();
      try {
        const result = query(args);
        if (result instanceof Promise) {
          return Promise.race([result, queryTimeout(QUERY_TIMEOUT_MS)]).catch((err: any) => {
            const msg = err.message || "";
            if (
              msg.includes("timed out") ||
              msg.includes("timedout") ||
              msg.includes("Can't reach database") ||
              msg.includes("Authentication failed") ||
              err.code === "P1001" ||
              err.code === "P1002" ||
              err.code === "P1008" ||
              err.code === "P1017"
            ) {
              markDbOffline(msg);
            }
            throw err;
          });
        }
        return result;
      } catch (err: any) {
        const msg = err.message || "";
        if (
          msg.includes("timed out") ||
          msg.includes("timedout") ||
          msg.includes("Can't reach database") ||
          msg.includes("Authentication failed") ||
          err.code === "P1001" ||
          err.code === "P1002" ||
          err.code === "P1008" ||
          err.code === "P1017"
        ) {
          markDbOffline(msg);
        }
        throw err;
      }
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function getOrCreateUserId(session: any): Promise<string | null> {
  if (!session || !session.user) return null;
  const userId = session.user.id;
  const email = session.user.email;
  const phone = session.user.phone;
  if (!email && !phone) return userId || null;

  try {
    // 1. Try finding user by ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (dbUser) return dbUser.id;

    // 2. If not found by ID, try finding by phone
    if (phone) {
      dbUser = await prisma.user.findUnique({
        where: { phone }
      });
      if (dbUser) return dbUser.id;
    }

    // 3. Try finding by email
    if (email) {
      dbUser = await prisma.user.findUnique({
        where: { email }
      });
      if (dbUser) return dbUser.id;
    }

    // 4. If still not found, create the user
    dbUser = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        name: session.user.name || (phone ? `User ${phone.slice(-4)}` : email?.split("@")[0] || "Registered User"),
        role: session.user.role === "ADMIN" ? "ADMIN" : "CUSTOMER"
      }
    });
    return dbUser.id;
  } catch (error) {
    console.error("[getOrCreateUserId] Error resolving user ID:", error);
    return userId || null;
  }
}
