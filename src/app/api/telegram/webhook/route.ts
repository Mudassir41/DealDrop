import { NextRequest, NextResponse } from "next/server";
import { db, Customer } from "@/lib/store";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.message) {
      const { chat, text, location } = body.message;
      const chatId = chat.id;

      if (text === "/start") {
        const customer: Customer = {
          id: crypto.randomUUID(),
          telegram_chat_id: chatId,
          persona: "user",
          category_prefs: [],
          latitude: 0,
          longitude: 0,
          created_at: new Date().toISOString(),
        };
        db.addCustomer(customer);

        await sendTelegramMessage({
          chat_id: chatId,
          text: `👋 <b>Welcome to DealDrop!</b>\n\nI'll notify you about exclusive hyperlocal flash deals nearby. Please send me your location so I can find deals around you.`,
          reply_markup: {
            keyboard: [
              [{ text: "📍 Share Location", request_location: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      }

      if (location) {
        let customer = db.getCustomerByTelegramId(chatId);
        if (customer) {
          customer.latitude = location.latitude;
          customer.longitude = location.longitude;
        } else {
          customer = {
            id: crypto.randomUUID(),
            telegram_chat_id: chatId,
            persona: "user",
            category_prefs: [],
            latitude: location.latitude,
            longitude: location.longitude,
            created_at: new Date().toISOString(),
          };
          db.addCustomer(customer);
        }

        await sendTelegramMessage({
          chat_id: chatId,
          text: `✅ <b>Location saved!</b>\n\nYou will now receive hyper-local deals matching your area.`,
          reply_markup: { remove_keyboard: true },
        });
      }
    } else if (body.callback_query) {
      const { data, message } = body.callback_query;
      const chatId = message.chat.id;

      if (data.startsWith("directions_")) {
        const dealId = data.replace("directions_", "");
        const deal = db.getDeal(dealId);
        if (deal) {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${deal.latitude},${deal.longitude}`;
          await sendTelegramMessage({
            chat_id: chatId,
            text: `📍 <b>Directions to ${deal.store_name}</b>\n\n<a href="${mapsUrl}">Open in Google Maps</a>`,
          });
        }
      } else if (data.startsWith("claim_")) {
        const dealId = data.replace("claim_", "");
        const deal = db.claimDeal(dealId);
        
        if (deal) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: `🎉 <b>Deal Claimed!</b>\n\nYou've reserved 1 unit of ${deal.product_name} at <b>${deal.store_name}</b>.\nShow this message at the store to redeem.`,
          });
        } else {
          await sendTelegramMessage({
            chat_id: chatId,
            text: `❌ <b>Too late!</b>\n\nThis deal is sold out or has expired. Better luck next time!`,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}
