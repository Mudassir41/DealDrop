import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db, Customer } from "@/lib/store";
import { sendTelegramMessage } from "@/lib/telegram";
import { processChat, executeTool } from "@/lib/bot-agent";

// In-memory OTP store for account linking (chat_id → {otp, email, expires})
const pendingLinks = new Map<number, { otp: string; email: string; expires: number }>();

// Regex-based fast router
function getIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (t === "/start") return "START";
  if (t === "/help") return "HELP";
  if (t === "/profile" || t === "/me") return "PROFILE";
  if (t === "/nearby" || t.includes("nearby deal") || t.includes("deals near")) return "NEARBY_DEALS";
  if (t === "/categories" || t.includes("what categories") || t.includes("what kind of deal")) return "CATEGORIES";
  if (t === "/points" || t.includes("drop point") || t.includes("my points")) return "POINTS";
  if (t.startsWith("/login ") || t.startsWith("login ")) return "LOGIN_EMAIL";
  if (t.startsWith("/verify ") || t.startsWith("verify ")) return "VERIFY_OTP";
  if (t === "/register_store" || t.startsWith("register store") || t.startsWith("i want to register")) return "REGISTER_STORE";
  if (t.startsWith("/post_deal") || t.includes("post a deal") || t.includes("i want to sell")) return "POST_DEAL";
  if (t === "/location" || t.startsWith("change my location") || t.startsWith("update location")) return "GET_LOCATION";
  return "CHAT";
}

async function getCustomerProfile(chatId: number) {
  // Try Supabase first, fallback to in-memory
  try {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("telegram_chat_id", chatId)
      .single();
    if (data) return data;
  } catch {}
  return db.getCustomerByTelegramId(chatId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.message) {
      const { chat, text, location } = body.message;
      const chatId: number = chat.id;
      const firstName = chat.first_name || "there";

      // === LOCATION SHARE ===
      if (location) {
        try {
          // Upsert customer with new location
          await supabase.from("customers").upsert({
            telegram_chat_id: chatId,
            latitude: location.latitude,
            longitude: location.longitude,
          }, { onConflict: "telegram_chat_id" });
        } catch {
          const customer = db.getCustomerByTelegramId(chatId);
          if (customer) { customer.latitude = location.latitude; customer.longitude = location.longitude; }
        }
        await sendTelegramMessage({
          chat_id: chatId,
          text: `✅ <b>Location saved!</b>\n\nI'll show you deals within 10km of your location. Ask me <i>"What deals are nearby?"</i> anytime.`,
          reply_markup: { remove_keyboard: true },
        });
        return NextResponse.json({ ok: true });
      }

      const intent = getIntent(text || "");
      const customer = await getCustomerProfile(chatId);
      const userLoc = customer?.latitude ? { lat: customer.latitude, lng: customer.longitude } : undefined;

      switch (intent) {

        // === ONBOARDING ===
        case "START": {
          // Upsert in Supabase
          try {
            await supabase.from("customers").upsert({
              telegram_chat_id: chatId,
              persona: "hunter",
              category_prefs: [],
            }, { onConflict: "telegram_chat_id" });
          } catch {
            if (!db.getCustomerByTelegramId(chatId)) {
              db.addCustomer({ id: crypto.randomUUID(), telegram_chat_id: chatId, persona: "hunter", category_prefs: [], latitude: 0, longitude: 0, drop_points: 0, created_at: new Date().toISOString() } as Customer);
            }
          }
          await sendTelegramMessage({
            chat_id: chatId,
            text: `👋 Hey <b>${firstName}!</b> Welcome to <b>DealDrop</b> 🛍️\n\n⚡ Hyperlocal flash sales — discover nearby deals before they expire.\n\n<b>Get started:</b>\n📍 Share your location → see deals near you\n🔗 /login your@email.com → link your account\n\n<b>Quick commands:</b>\n/nearby — deals around you\n/points — your Drop Points balance\n/profile — your account info\n/help — all commands`,
            reply_markup: {
              keyboard: [[{ text: "📍 Share My Location", request_location: true }]],
              resize_keyboard: true, one_time_keyboard: true,
            },
          });
          break;
        }

        // === HELP ===
        case "HELP": {
          await sendTelegramMessage({
            chat_id: chatId,
            text: `🤖 <b>DealDrop Bot Commands</b>\n\n<b>For Buyers:</b>\n/nearby — flash deals near you\n/categories — browse by category\n/points — check Drop Points\n/profile — your persona & account\n/location — update your location\n\n<b>For Retailers:</b>\n/login email@store.com — link your account\n/register_store — onboard your store\n/post_deal — create a flash sale\n\n<b>Or just chat naturally!</b> 💬\nTry: <i>"Show me bakery deals"</i> or <i>"I want to sell 10 breads at 40% off"</i>`,
          });
          break;
        }

        // === ACCOUNT LINKING — Step 1: Send OTP ===
        case "LOGIN_EMAIL": {
          const emailMatch = text!.match(/\S+@\S+\.\S+/);
          if (!emailMatch) {
            await sendTelegramMessage({ chat_id: chatId, text: `❌ Please include your email:\n\n<code>/login yourname@email.com</code>` });
            break;
          }
          const email = emailMatch[0].toLowerCase();
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          pendingLinks.set(chatId, { otp, email, expires: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

          // Send OTP via Supabase email
          try {
            await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
          } catch {}

          await sendTelegramMessage({
            chat_id: chatId,
            text: `📧 We've sent a code to <b>${email}</b>.\n\nEnter it here to link your account:\n<code>/verify 123456</code>\n\n<i>Code expires in 10 minutes.</i>`,
          });
          break;
        }

        // === ACCOUNT LINKING — Step 2: Verify OTP ===
        case "VERIFY_OTP": {
          const codeMatch = text!.match(/\d{6}/);
          if (!codeMatch) {
            await sendTelegramMessage({ chat_id: chatId, text: `❌ Please enter your 6-digit code:\n<code>/verify 123456</code>` });
            break;
          }
          const enteredCode = codeMatch[0];
          const pending = pendingLinks.get(chatId);
          if (!pending || Date.now() > pending.expires) {
            await sendTelegramMessage({ chat_id: chatId, text: `⏱ Code expired. Start again:\n<code>/login your@email.com</code>` });
            break;
          }

          try {
            // Verify with Supabase
            const { data, error } = await supabase.auth.verifyOtp({
              email: pending.email,
              token: enteredCode,
              type: "email",
            });
            if (error) throw error;

            // Link telegram_chat_id to this Supabase user via customers table
            await supabase.from("customers").upsert({
              telegram_chat_id: chatId,
              persona: customer?.persona || "hunter",
              category_prefs: customer?.category_prefs || [],
              latitude: customer?.latitude || 0,
              longitude: customer?.longitude || 0,
              drop_points: customer?.drop_points || 0,
            }, { onConflict: "telegram_chat_id" });

            pendingLinks.delete(chatId);
            await sendTelegramMessage({
              chat_id: chatId,
              text: `✅ <b>Account linked!</b>\n\n📧 ${pending.email}\n\nYou can now access all DealDrop features from Telegram. Try /profile to see your details.`,
            });
          } catch {
            await sendTelegramMessage({ chat_id: chatId, text: `❌ Invalid or expired code. Please try again:\n<code>/login your@email.com</code>` });
          }
          break;
        }

        // === PROFILE ===
        case "PROFILE": {
          const persona = customer?.persona || "hunter";
          const pts = customer?.drop_points || 0;
          const personaEmoji: Record<string, string> = { hunter: "🎯", student: "🎓", parent: "👨‍👩‍👧", worker: "💼", homemaker: "🏠" };
          const hasLocation = customer?.latitude && customer.latitude !== 0;
          await sendTelegramMessage({
            chat_id: chatId,
            text: `👤 <b>Your DealDrop Profile</b>\n\n${personaEmoji[persona] || "🛍"} Persona: <b>${persona}</b>\n🪙 Drop Points: <b>${pts} pts</b>\n📍 Location: ${hasLocation ? "✅ Set" : "❌ Not set"}\n\n${pts >= 100 ? "🏆 Hunter rank — keep claiming deals!" : "💡 Claim deals to earn Drop Points!"}\n\n<i>Link your account: /login email@example.com</i>`,
          });
          break;
        }

        // === POINTS ===
        case "POINTS": {
          const pts = customer?.drop_points || 0;
          await sendTelegramMessage({
            chat_id: chatId,
            text: `🪙 <b>Your Drop Points</b>\n\n<b>${pts} pts</b>\n\n${pts >= 200 ? "🔥 Top Hunter! You're on a roll." : pts >= 100 ? "👍 Good progress! Keep claiming deals." : "💡 Claim deals in the app to earn points. Earn 50 pts per redemption!"}`,
          });
          break;
        }

        // === NEARBY DEALS ===
        case "NEARBY_DEALS": {
          if (!userLoc) {
            await sendTelegramMessage({
              chat_id: chatId,
              text: "📍 Share your location first so I can find deals near you!",
              reply_markup: { keyboard: [[{ text: "📍 Share My Location", request_location: true }]], resize_keyboard: true, one_time_keyboard: true },
            });
            break;
          }
          // Fetch from Supabase
          let msgText = "📍 <b>Deals near you:</b>\n\n";
          try {
            const { data: deals } = await supabase
              .from("deals")
              .select("*")
              .eq("status", "active")
              .gt("expires_at", new Date().toISOString())
              .limit(5);
            if (!deals || deals.length === 0) throw new Error("none");
            deals.forEach((d: any) => {
              const timeLeft = Math.round((new Date(d.expires_at).getTime() - Date.now()) / 60000);
              msgText += `🛍 <b>${d.product_name}</b>\n📌 ${d.store_name} · ${d.discount_pct}% OFF\n⏱ ${timeLeft}m left · ${d.units_available - d.units_claimed} units\n\n`;
            });
          } catch {
            msgText += "No active deals right now. Check back soon! ⏳";
          }
          await sendTelegramMessage({ chat_id: chatId, text: msgText });
          break;
        }

        // === CATEGORIES ===
        case "CATEGORIES": {
          const catsJson = await executeTool("get_categories", {}, chatId, userLoc);
          const cats = JSON.parse(catsJson);
          let catText = "🏷 <b>Active Deal Categories:</b>\n\n";
          for (const [cat, count] of Object.entries(cats)) {
            const emoji: Record<string, string> = { food: "🍞", grocery: "🥬", fashion: "👗", pharmacy: "💊", electronics: "📱", other: "📦" };
            catText += `${emoji[cat] || "·"} ${cat}: ${count} deals\n`;
          }
          catText += "\n<i>Ask me for deals by category, e.g. \"Show me grocery deals\"</i>";
          await sendTelegramMessage({ chat_id: chatId, text: catText });
          break;
        }

        // === LOCATION UPDATE ===
        case "GET_LOCATION": {
          await sendTelegramMessage({
            chat_id: chatId,
            text: "📍 Send your current location:",
            reply_markup: { keyboard: [[{ text: "📍 Share My Location", request_location: true }]], resize_keyboard: true, one_time_keyboard: true },
          });
          break;
        }

        // === RETAILER: REGISTER STORE & POST DEAL — falls through to AI agent ===
        case "REGISTER_STORE":
        case "POST_DEAL":
        case "CHAT":
        default: {
          // Full conversational AI agent handles complex requests
          const reply = await processChat(chatId, text || "hello", userLoc);
          await sendTelegramMessage({ chat_id: chatId, text: reply });
          break;
        }
      }
    } else if (body.callback_query) {
      const { data, message } = body.callback_query;
      const chatId: number = message.chat.id;

      if (data?.startsWith("directions_")) {
        const dealId = data.replace("directions_", "");
        const deal = db.getDeal(dealId);
        if (deal) {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${deal.latitude},${deal.longitude}`;
          await sendTelegramMessage({ chat_id: chatId, text: `📍 <b>Directions to ${deal.store_name}</b>\n\n<a href="${mapsUrl}">Open in Google Maps</a>` });
        }
      } else if (data?.startsWith("claim_")) {
        const dealId = data.replace("claim_", "");
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/deals/${dealId}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegram_chat_id: chatId }),
        });
        const claimData = await res.json();
        if (res.ok) {
          await sendTelegramMessage({
            chat_id: chatId,
            text: `🎟️ <b>Deal Claimed!</b>\n\nYour redemption code:\n\n<code>${claimData.otp}</code>\n\nShow this to the retailer. 🛍️\n\n🪙 +10 Drop Points earned!`,
          });
        } else {
          await sendTelegramMessage({ chat_id: chatId, text: `❌ <b>Too late!</b> This deal is sold out or has expired.` });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ ok: true });
  }
}
