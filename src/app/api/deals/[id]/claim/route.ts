import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/store";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { telegram_chat_id } = body;

    try {
      const { data: deal, error: fetchError } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (!deal || deal.units_claimed >= deal.units_available) {
        return NextResponse.json({ error: "Deal not found or sold out" }, { status: 404 });
      }

      const newClaimed = deal.units_claimed + 1;
      const newStatus = newClaimed >= deal.units_available ? "sold_out" : "active";

      const { data: updated, error: updateError } = await supabase
        .from("deals")
        .update({ units_claimed: newClaimed, status: newStatus })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Generate OTP and store in claims table
      const otp = generateOTP();
      try {
        await supabase.from("claims").insert({
          deal_id: id,
          otp,
          redeemed: false,
          customer_telegram_id: telegram_chat_id || null,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Silent — claims table may not exist yet in Supabase
      }

      return NextResponse.json({ deal: updated, otp });
    } catch {
      // Fallback to in-memory
      const updatedDeal = db.claimDeal(id);
      if (!updatedDeal) {
        return NextResponse.json({ error: "Deal not found or sold out" }, { status: 404 });
      }
      const otp = generateOTP();
      return NextResponse.json({ deal: updatedDeal, otp });
    }
  } catch (error) {
    console.error("Deal claim error:", error);
    return NextResponse.json({ error: "Failed to claim deal" }, { status: 500 });
  }
}
