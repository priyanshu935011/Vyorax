import { prisma } from "./db";
import Anthropic from "@anthropic-ai/sdk";

export async function getClaudeClient(): Promise<Anthropic> {
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
  } catch (dbError) {
    // Database connection offline
  }

  const apiKey = settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-placeholder") {
    throw new Error("Anthropic API key not configured in settings or environment");
  }

  return new Anthropic({
    apiKey,
  });
}
