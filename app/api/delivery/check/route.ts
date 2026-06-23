import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePincodeToCity, calculateDeliveryDate } from "@/lib/delivery";

const DEFAULT_CITIES = [{ name: "Ranchi", days: 2 }];
const DEFAULT_FREE_MIN = 500000; // ₹5,000 in paise
const DEFAULT_FEE_STANDARD = 25000; // ₹250 in paise
const DEFAULT_FEE_CYCLE = 50000; // ₹500 in paise

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get("city");
  const pincodeParam = searchParams.get("pincode");

  let cityName: string | null = null;
  
  if (pincodeParam && pincodeParam.trim().length === 6 && !isNaN(Number(pincodeParam))) {
    cityName = resolvePincodeToCity(pincodeParam);
    if (!cityName) {
      return NextResponse.json({
        serviceable: false,
        message: `Pincode ${pincodeParam} is outside our delivery service areas.`,
      });
    }
  } else if (cityParam && cityParam.trim().length > 0) {
    cityName = cityParam.trim();
  }

  if (!cityName) {
    return NextResponse.json({ error: "Missing or invalid city/pincode name" }, { status: 400 });
  }

  const normalizedCityInput = cityName.trim().toLowerCase();
  let serviceableCities: any[] = DEFAULT_CITIES;
  let freeShippingMin = DEFAULT_FREE_MIN;
  let deliveryFeeStandard = DEFAULT_FEE_STANDARD;
  let deliveryFeeCycle = DEFAULT_FEE_CYCLE;

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    
    if (settings) {
      if (settings.freeShippingMin !== undefined && settings.freeShippingMin !== null) {
        freeShippingMin = settings.freeShippingMin;
      }
      
      if (settings.homepageConfig) {
        const config = settings.homepageConfig as any;
        if (Array.isArray(config.deliveryCities)) {
          serviceableCities = config.deliveryCities;
        }
        if (config.deliveryFeeStandard !== undefined && config.deliveryFeeStandard !== null) {
          deliveryFeeStandard = Number(config.deliveryFeeStandard);
        }
        if (config.deliveryFeeCycle !== undefined && config.deliveryFeeCycle !== null) {
          deliveryFeeCycle = Number(config.deliveryFeeCycle);
        }
      }
    }
  } catch (error: any) {
    console.warn("Database offline. Falling back to default delivery settings. Error:", error.message);
  }

  // Normalize serviceable cities to objects with { name: string, days: number }
  const normalizedServiceable = serviceableCities.map((c: any) => {
    if (typeof c === "string") {
      return { name: c.trim().toLowerCase(), days: 2 }; // Default to 2 days
    }
    return { name: (c.name || "").trim().toLowerCase(), days: c.days ?? 2 };
  });

  const matchedCity = normalizedServiceable.find(
    (c) => c.name === normalizedCityInput
  );

  if (matchedCity) {
    const formattedDate = calculateDeliveryDate(matchedCity.days);
    
    // Capitalize city name for response display
    const displayName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();

    return NextResponse.json({
      serviceable: true,
      city: displayName,
      deliveryDate: formattedDate,
      deliveryDays: matchedCity.days,
      charges: 0, // dynamic client-side calculation will overwrite this
      courierName: "Vyorax Delivery",
      freeShippingMin,
      deliveryFeeStandard,
      deliveryFeeCycle,
    });
  }

  const allowedCitiesList = normalizedServiceable.map((c) => c.name.charAt(0).toUpperCase() + c.name.slice(1));
  return NextResponse.json({
    serviceable: false,
    message: `Out of our active delivery zone. We currently only deliver in: ${allowedCitiesList.join(", ")}.`,
  });
}
