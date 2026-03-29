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
          drop_points: 0,
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
            drop_points: 0,
            created_at: new Date().toISOString(),
          };
          db.addCustomer(customer);
        }

        await sendTelegramMessage({
          chat_id: chatId,
          text: `✅ <b>Location saved!</b>\n\nYou will now receive hyper-local deals matching your area. Try asking <i>"What deals are nearby?"</i>`,
          reply_markup: { remove_keyboard: true },
        });
        return NextResponse.json({ ok: true });
      }

      // Fast-path Router via gptoss-20b
      const apiKey = process.env.GROQ_API_KEY;
      let intent = "CHAT";
      
      if (apiKey && text) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gptoss-20b",
              messages: [
                { role: "system", content: "Classify user intent into exactly one word: GET_LOCATION, NEARBY_DEALS, CATEGORIES, or CHAT. If asking for deals near them, use NEARBY_DEALS. If asking what types of deals exist, use CATEGORIES. If general conversation, use CHAT." },
                { role: "user", content: text }
              ],
              temperature: 0.1,
              max_tokens: 10
            })
          });
          const data = await res.json();
          const response = data.choices[0].message.content.trim().toUpperCase();
          if (["GET_LOCATION", "NEARBY_DEALS", "CATEGORIES", "CHAT"].includes(response)) {
            intent = response;
          }
        } catch (e) {
          console.error("Router failed, defaulting to CHAT", e);
        }
      }

      const customer = db.getCustomerByTelegramId(chatId);
      const userLoc = customer && customer.latitude ? { lat: customer.latitude, lng: customer.longitude } : undefined;

      switch (intent) {
        case "GET_LOCATION":
          await sendTelegramMessage({
            chat_id: chatId,
            text: "Please share your location so I can find deals near you 📍",
            reply_markup: {
              keyboard: [[{ text: "📍 Share Location", request_location: true }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          });
          break;

        case "NEARBY_DEALS":
          const { executeTool } = require("@/lib/bot-agent");
          const nearbyJson = await executeTool("search_deals", {}, chatId, userLoc);
          const nearbyMsg = JSON.parse(nearbyJson);
          if (nearbyMsg.message) {
            await sendTelegramMessage({ chat_id: chatId, text: nearbyMsg.message });
          } else {
            let msgText = "📍 <b>Top deals near you:</b>\n\n";
            nearbyMsg.forEach((d: any) => {
              msgText += `🛍 <b>${d.product}</b> at ${d.store}\n💰 ${d.discount} · ${d.distance}\n\n`;
            });
            await sendTelegramMessage({ chat_id: chatId, text: msgText });
          }
          break;

        case "CATEGORIES":
          const { executeTool: execCats } = require("@/lib/bot-agent");
          const catsJson = await execCats("get_categories", {}, chatId, userLoc);
          const cats = JSON.parse(catsJson);
          let catText = "🏷 <b>Active Categories:</b>\n\n";
          for (const [cat, count] of Object.entries(cats)) {
            catText += `· ${cat}: ${count} deals\n`;
          }
          await sendTelegramMessage({ chat_id: chatId, text: catText });
          break;

        case "CHAT":
        default:
          const { processChat } = require("@/lib/bot-agent");
          const reply = await processChat(chatId, text || "hello", userLoc);
          await sendTelegramMessage({ chat_id: chatId, text: reply });
          break;
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
