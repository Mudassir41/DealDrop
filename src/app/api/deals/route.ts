import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db, Deal } from "@/lib/store";
import { filterNearby } from "@/lib/geo";
import { sendTelegramMessage, formatDealMessage } from "@/lib/telegram";
import { getAdvisorSuggestion } from "@/lib/advisor";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");

  try {
    // Try Supabase first
    let query = supabase
      .from("deals")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    let deals = data || [];

    if (lat && lng && radius) {
      deals = filterNearby(deals, parseFloat(lat), parseFloat(lng), parseInt(radius, 10));
    }

    return NextResponse.json({ deals, source: "supabase" });
  } catch {
    // Fallback to in-memory store
    let deals = db.getDeals();
    if (category && category !== "all") {
      deals = deals.filter((d) => d.category.toLowerCase() === category.toLowerCase());
    }
    if (lat && lng && radius) {
      deals = filterNearby(deals, parseFloat(lat), parseFloat(lng), parseInt(radius, 10));
    }
    return NextResponse.json({ deals, source: "memory" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept both camelCase (from dealer form) and snake_case field names
    const storeName = body.storeName || body.store_name || "Unknown Store";
    const productName = body.productName || body.product_name || "Unknown Product";
    const description = body.description || "";
    const category = body.storeCategory || body.category || "other";
    const discountPct = parseInt(body.discountPct || body.discount_pct, 10) || 0;
    const originalPrice = body.originalPrice || body.original_price;
    const salePrice = body.salePrice || body.sale_price || 
      (originalPrice ? Math.round(parseFloat(originalPrice) * (1 - discountPct / 100)) : null);
    const unitsAvailable = parseInt(body.unitsAvailable || body.units_available, 10) || 10;
    const geofenceRadius = parseInt(body.geofenceRadius || body.geofence_radius, 10) || 2000;
    const durationMinutes = parseInt(body.durationMinutes || body.duration_minutes, 10) || 120;
    const latitude = parseFloat(body.latitude) || 12.9716 + (Math.random() - 0.5) * 0.01;
    const longitude = parseFloat(body.longitude) || 77.5946 + (Math.random() - 0.5) * 0.01;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    let newDeal: any;
    let source = "memory";

    try {
      // Try Supabase insert
      const { data, error } = await supabase
        .from("deals")
        .insert({
          store_name: storeName,
          product_name: productName,
          description,
          category,
          discount_pct: discountPct,
          original_price: originalPrice ? parseFloat(originalPrice) : null,
          sale_price: salePrice ? parseFloat(salePrice) : null,
          units_available: unitsAvailable,
          units_claimed: 0,
          geofence_radius: geofenceRadius,
          status: "active",
          channels: { telegram: body.telegramEnabled !== false },
          expires_at: expiresAt,
          latitude,
          longitude,
          live_viewers: Math.floor(Math.random() * 20) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      newDeal = data;
      source = "supabase";
    } catch {
      // Fallback to in-memory
      const inMemoryDeal: Deal = {
        id: crypto.randomUUID(),
        store_id: `store-${crypto.randomUUID().slice(0, 8)}`,
        store_name: storeName,
        product_name: productName,
        description,
        category,
        discount_pct: discountPct,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        units_available: unitsAvailable,
        units_claimed: 0,
        geofence_radius: geofenceRadius,
        status: "active",
        channels: { telegram: body.telegramEnabled !== false, whatsapp: false, google: false, instagram: false },
        starts_at: new Date().toISOString(),
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        latitude,
        longitude,
        live_viewers: Math.floor(Math.random() * 20) + 1,
      };
      db.addDeal(inMemoryDeal);
      newDeal = inMemoryDeal;
    }

    // Notify Telegram subscribers
    let notifyCount = 0;
    if (body.telegramEnabled !== false) {
      const customers = db.getCustomers();
      for (const customer of customers) {
        if (customer.telegram_chat_id) {
          try {
            const message = formatDealMessage({
              storeName: newDeal.store_name,
              productName: newDeal.product_name,
              discountPct: newDeal.discount_pct,
              unitsAvailable: newDeal.units_available,
              dealId: newDeal.id,
            });
            await sendTelegramMessage({
              chat_id: customer.telegram_chat_id,
              text: message.text,
              reply_markup: message.reply_markup,
            });
            notifyCount++;
          } catch {}
        }
      }
    }

    const advisor = getAdvisorSuggestion(newDeal.category, newDeal.units_available, newDeal.discount_pct);

    return NextResponse.json({ deal: newDeal, notifyCount, advisor, source });
  } catch (error) {
    console.error("Deal creation error:", error);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
