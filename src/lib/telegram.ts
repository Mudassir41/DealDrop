const TELEGRAM_API = "https://api.telegram.org/bot";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "Markdown";
  reply_markup?: any;
}

export async function sendTelegramMessage(msg: TelegramMessage) {
  const url = `${TELEGRAM_API}${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: msg.chat_id,
      text: msg.text,
      parse_mode: msg.parse_mode || "HTML",
      reply_markup: msg.reply_markup ? JSON.stringify(msg.reply_markup) : undefined,
    }),
  });
  return res.json();
}

export function formatDealMessage(deal: {
  storeName: string;
  productName: string;
  discountPct: number;
  unitsAvailable: number;
  distance?: number;
  expiresIn?: string;
  dealId: string;
}) {
  const distText = deal.distance ? `${deal.distance}m away` : "Near you";

  const text = `📍 <b>Flash Deal Near You!</b>

<b>${deal.storeName}</b> · ${distText}
─────────────────────
🛍 ${deal.productName}
💰 <b>${deal.discountPct}% OFF</b> · Only ${deal.unitsAvailable} left
⏱ ${deal.expiresIn || "Limited time"} remaining
─────────────────────`;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: "📍 Get Directions", callback_data: `directions_${deal.dealId}` },
        { text: "✅ Claim Deal", callback_data: `claim_${deal.dealId}` },
      ],
      [
        { text: "🔕 Snooze 1 hour", callback_data: `snooze_60` },
      ],
    ],
  };

  return { text, reply_markup };
}

export async function setWebhook(url: string) {
  const apiUrl = `${TELEGRAM_API}${BOT_TOKEN}/setWebhook`;
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}
