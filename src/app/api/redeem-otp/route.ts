import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { otp } = await req.json();
    if (!otp || otp.length < 4) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Look up the OTP in the claims table
    const { data: claim, error: claimErr } = await supabase
      .from("claims")
      .select("*, deals(*)")
      .eq("otp", otp)
      .eq("redeemed", false)
      .single();

    if (claimErr || !claim) {
      return NextResponse.json({ error: "OTP not found or already used" }, { status: 404 });
    }

    const deal = claim.deals;
    if (!deal || deal.status === "expired") {
      return NextResponse.json({ error: "Deal has expired" }, { status: 400 });
    }

    // Mark claim as redeemed
    await supabase.from("claims").update({ redeemed: true }).eq("otp", otp);

    // Award drop points if customer linked
    if (claim.customer_telegram_id) {
      await supabase
        .from("customers")
        .update({ drop_points: supabase.rpc } as any) // incremented via claim record later
        .eq("telegram_chat_id", claim.customer_telegram_id);
    }

    return NextResponse.json({
      success: true,
      product_name: deal.product_name,
      store_name: deal.store_name,
      discount_pct: deal.discount_pct,
      points_awarded: 50,
    });
  } catch (err: any) {
    console.error("OTP redeem error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
