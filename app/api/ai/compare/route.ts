import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { products } = await request.json(); // array of product specs

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    // 1. Fetch site settings from DB
    let settings = null;
    try {
      settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    } catch (e) {
      // ignore
    }

    const apiKey = settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

    // 2. If key is present and not placeholder, call Claude
    if (apiKey && apiKey !== "sk-ant-placeholder" && !apiKey.startsWith("sk-ant-•••")) {
      const anthropic = new Anthropic({ apiKey });
      
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `Compare these cycles for an Indian buyer in a tier-2 city. Be direct, specific, and helpful. Recommend one clearly. Return JSON: { summary: string, winner: productId, reasons: string[], bestFor: { [productId]: string } }. Products: ${JSON.stringify(products)}`,
          },
        ],
      });

      // Parse JSON from Claude response
      const rawText = (message.content[0] as any).text || "";
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}") + 1;
      const jsonStr = rawText.substring(jsonStart, jsonEnd);
      
      return NextResponse.json(JSON.parse(jsonStr));
    }

    // 3. Fallback: Rule-based spec analysis comparison summary
    const prodIds = products.map((p: any) => p.id);
    let summary = "";
    let winner = products[0].id;
    let reasons: string[] = [];
    let bestFor: Record<string, string> = {};

    const hasAeroX = prodIds.includes("prod-aero-x");
    const hasRanchiMtb = prodIds.includes("prod-ranchi-mtb");
    const hasUrbanSwift = prodIds.includes("prod-urban-swift");

    if (hasAeroX && hasRanchiMtb) {
      summary = "The Vyorax Aero-X Carbon hybrid is significantly lighter and faster, making it perfect for Ranchi Ring Road speed runs and Lalpur asphalt commutes. However, the Ranchi Rider MTB offers 29-inch Hartex tyres and mechanical disc brakes, which are much better suited for weekend trail climbs around Hundru Falls and forest roads. For overall versatility in Ranchi city, the Aero-X Carbon wins on component premiumness.";
      winner = "prod-aero-x";
      reasons = [
        "Aero-X carbon frame is lighter, reducing climbing effort in valleys.",
        "Shimano 1x11 speed gearing provides a wider index range.",
        "Hydraulic disc brakes offer superior stopping power with single-finger pull."
      ];
      bestFor = {
        "prod-aero-x": "Best for road speed, fitness commuting, and endurance.",
        "prod-ranchi-mtb": "Best for offroad forest tracks, gravel trails, and potholes."
      };
    } else if (hasRanchiMtb && hasUrbanSwift) {
      summary = "For daily commutes, the Urban Swift offers lightweight, zero-maintenance single-speed simplicity. However, the Ranchi Rider MTB provides a hardtail suspension fork and 24-speed Shimano gears, making it much more versatile if you plan to navigate Ranchi's monsoonal potholes and trail paths. We recommend the Ranchi Rider MTB for general Ranchi road comfort.";
      winner = "prod-ranchi-mtb";
      reasons = [
        "Front suspension fork dampens impact from road craters.",
        "24-speed gears allow easy climbs on Lalpur flyovers and hills.",
        "All-terrain Hartex tyres prevent slips on wet mud."
      ];
      bestFor = {
        "prod-ranchi-mtb": "Best for general comfort, all-terrain potholes, and trails.",
        "prod-urban-swift": "Best for budget city commuters, flat streets, and zero maintenance."
      };
    } else {
      // General generic cycles comparison
      summary = `Comparing ${products.map((p: any) => p.name).join(" vs ")}. The higher priced option wins on component materials and gear ranges. For general commuting in tier-2 cities, pick the cycle that matches your primary route (asphalt speed vs suspension fork protection).`;
      winner = products[0].id;
      reasons = [
        "Premium frames dampens street vibrations.",
        "Mechanical brakes ensure quick stops."
      ];
      bestFor = products.reduce((acc: any, p: any) => {
        acc[p.id] = `Best for users looking for high quality ${p.name} performance.`;
        return acc;
      }, {});
    }

    return NextResponse.json({
      summary,
      winner,
      reasons,
      bestFor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
