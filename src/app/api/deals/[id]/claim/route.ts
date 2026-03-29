import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      // Try Supabase first
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

      return NextResponse.json({ deal: updated });
    } catch {
      // Fallback to in-memory
      const updatedDeal = db.claimDeal(id);
      if (!updatedDeal) {
        return NextResponse.json({ error: "Deal not found or sold out" }, { status: 404 });
      }
      return NextResponse.json({ deal: updatedDeal });
    }
  } catch (error) {
    console.error("Deal claim error:", error);
    return NextResponse.json({ error: "Failed to claim deal" }, { status: 500 });
  }
}
