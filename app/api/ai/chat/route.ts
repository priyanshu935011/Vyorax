import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";



export async function POST(request: Request) {
  try {
    const { messages, productContext, cartContext } = await request.json();
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Fetch Dynamic SiteSettings from DB
    let siteSettings = null;
    try {
      siteSettings = await prisma.siteSettings.findUnique({
        where: { id: "singleton" },
      });
    } catch (dbError) {
      // Database not reachable
    }

    const apiKey = siteSettings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    const aiEnabled = siteSettings?.aiEnabled ?? true;
    const systemPrompt = siteSettings?.aiSystemPrompt || "You are Vyorax's shopping assistant. You help customers find the right cycle, fitness gear, and sports equipment. You know all Vyorax products, their specs, pricing, and availability. You are friendly, speak Hinglish naturally, and give direct recommendations. Always end with a product suggestion or next step.";

    if (!aiEnabled) {
      return new Response("AI Assistant is disabled in admin settings", { status: 503 });
    }

    // 2. If valid Anthropic Key is present, trigger Claude streaming
    if (apiKey && apiKey !== "sk-ant-placeholder" && !apiKey.startsWith("sk-ant-•••")) {
      const anthropic = new Anthropic({ apiKey });
      
      const responseStream = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Context: ${JSON.stringify({ productContext, cartContext })}. User question: ${lastUserMessage}`,
          },
        ],
        stream: true,
      });

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of responseStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
          controller.close();
        },
      });

      return new Response(stream);
    }

    // 3. Fallback: Intelligent, character-by-character Hinglish text stream generator
    let reply = "";
    const lowerMessage = lastUserMessage.toLowerCase();

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey") || lowerMessage.includes("namaste")) {
      reply = "Namaste! Main Vyorax Assistant hoon. Ranchi ke roads ke liye cycles aur fitness gear choose karne me help kar sakta hoon. Aapko daily city commute ke liye chahiye, ya weekend off-road trails (like Jonha or Patratu climbs) explore karne ke liye? Let me know!";
    } else if (lowerMessage.includes("cycle") || lowerMessage.includes("bike") || lowerMessage.includes("mtb") || lowerMessage.includes("hybrid")) {
      reply = "Arre! We have 3 premium cycles built exactly for Indian conditions:\n\n1. **Vyorax Aero-X Carbon (₹45,000)**: Super light performace hybrid, carbon frame + Shimano 1x11 speed. Great for high-speed runs on Ranchi Ring Road.\n2. **Vyorax Ranchi Rider MTB (₹24,500)**: Solid hardtail alloy frame with 29\" Hartex tyres. Perfect for trail grip around Hundru falls.\n3. **Vyorax Urban Swift (₹15,999)**: Single-speed minimal fixie. Zero maintenance, perfect for Lalpur college commutes!\n\nAapki height aur ride style kya hai? Sizing check kar lete hain!";
    } else if (lowerMessage.includes("price") || lowerMessage.includes("pricing") || lowerMessage.includes("cost") || lowerMessage.includes("emi")) {
      reply = "Vyorax cycles and gear are premium yet affordable! Here are the details:\n\n* **Aero-X Carbon**: ₹45,000 (No-Cost EMI starting from ₹3,750/mo for 12 months)\n* **Ranchi Rider MTB**: ₹24,500 (EMI ₹2,286/mo)\n* **Urban Swift**: ₹15,999 (EMI ₹1,493/mo)\n* **Agni Dumbbell Set**: ₹11,999 (EMI ₹1,120/mo)\n\nWe accept UPI, Credit Cards, Wallets. Plus, we offer No-Cost EMI on selected tenures! Which one fits your budget?";
    } else if (lowerMessage.includes("shipping") || lowerMessage.includes("ranchi") || lowerMessage.includes("delivery") || lowerMessage.includes("pincode")) {
      reply = "Ranchi and Jharkhand zones (like Jamshedpur, Bokaro, Dhanbad) me shipping bilkul free hai above ₹5,000 orders! Ranchi local delivery takes just 2 Days. Rest of India takes 4-5 days via Shiprocket Express with complete transit insurance. What is your pincode?";
    } else if (lowerMessage.includes("dumb") || lowerMessage.includes("weight") || lowerMessage.includes("fitness")) {
      reply = "Strength training ke liye, checkout **Vyorax Agni Adjustable Dumbbells (₹11,999)**! Ye dial selection system use karte hain, replacing 15 pairs of dumbbells from 2.5kg to 24kg. Ranchi home gyms ke liye perfect space-saving setup hai!";
    } else {
      reply = `Thanks for asking! Regarding "${lastUserMessage}", I suggest checking out our **Vyorax Aero-X Carbon** or **Vyorax Ranchi Rider MTB**. Don't forget that Ranchi local delivery is free and takes just 48 hours! Try asking me to compare MTB and City cycles or ask for the Sizing quiz!`;
    }

    // Convert reply to character chunks stream with small intervals
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = reply.split(" ");
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i] + " "));
          await new Promise((resolve) => setTimeout(resolve, 60)); // 60ms delay per word
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
