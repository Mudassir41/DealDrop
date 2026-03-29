import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deal_id, store_id, reviewer_type, rating } = body;

    // Validate
    if (!deal_id || !store_id || !reviewer_type || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert([{ deal_id, store_id, reviewer_type, rating }])
      .select()
      .single();

    if (error) throw error;

    // Gamification/Trust System: Penalize store if buyer gives <= 2 stars (e.g., "Sold out but listed")
    if (reviewer_type === "buyer" && rating <= 2) {
      console.log(`[Trust System] Store ${store_id} penalized. Buyer left ${rating}-star review.`);
      // Proceeding with silent fallback if RPC doesn't exist yet
      const { error: rpcErr } = await supabase.rpc("decrement_trust_score", { 
        target_store_id: store_id,
        penalty: 5
      });
      if (rpcErr) console.warn("decrement_trust_score RPC not defined yet.");
    }

    return NextResponse.json({ success: true, review: data });
  } catch (error: any) {
    console.error("Failed to submit review:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
