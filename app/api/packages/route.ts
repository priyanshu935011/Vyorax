import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MOCK_SERVICE_PACKAGES } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "SERVICING" or "REPAIRING"

  try {
    const query: any = { isActive: true };
    if (type) {
      query.type = type;
    }

    const packages = await prisma.servicePackage.findMany({
      where: query,
      orderBy: { createdAt: "asc" },
    });

    // If there are no packages in DB, seed them or return mock
    if (packages.length === 0) {
      const filteredMock = type 
        ? MOCK_SERVICE_PACKAGES.filter((p) => p.type === type)
        : MOCK_SERVICE_PACKAGES;
      return NextResponse.json(filteredMock);
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.warn("Database is offline, falling back to mock service packages in API");
    const filteredMock = type 
      ? MOCK_SERVICE_PACKAGES.filter((p) => p.type === type)
      : MOCK_SERVICE_PACKAGES;
    return NextResponse.json(filteredMock);
  }
}
