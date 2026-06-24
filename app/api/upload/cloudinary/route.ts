import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary server-side
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");

    // If Cloudinary is not configured, fall back to simulated sandbox upload
    if (!isConfigured) {
      console.warn("Cloudinary not configured. Returning simulated upload mock URL.");
      // Simulated delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUrl = isVideo
        ? "https://www.w3schools.com/html/movie.mp4"
        : "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=600&auto=format&fit=crop";

      return NextResponse.json({
        url: mockUrl,
        resource_type: isVideo ? "video" : "image",
        simulated: true,
      });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload buffer to Cloudinary
    return new Promise<Response>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: isVideo ? "video" : "image",
          folder: "vyorax_reviews",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(NextResponse.json({ error: error.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({
              url: result?.secure_url,
              resource_type: result?.resource_type,
            }));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error("Cloudinary upload route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
