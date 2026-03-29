import { NextRequest, NextResponse } from "next/server";
import { setWebhook } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const webhookUrl = `${url.origin}/api/telegram/webhook`;
    const token = process.env.TELEGRAM_BOT_TOKEN || "not-set";
    
    const result = await setWebhook(webhookUrl);
    
    return NextResponse.json({
      success: true,
      webhookUrl,
      tokenLoaded: token !== "not-set" ? `${token.slice(0, 5)}...` : "false",
      telegramResponse: result
    });
  } catch (error) {
    console.error("Failed to setup webhook:", error);
    return NextResponse.json({ success: false, error: "Failed to set webhook" }, { status: 500 });
  }
}
