import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: any = {};
    if (body.units_available !== undefined) updates.units_available = body.units_available;
    if (body.status) updates.status = body.status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ deal: data });
    } catch {
      // Fallback
      const deals = db.getDeals();
      const deal = deals.find(d => d.id === id);
      if (deal) {
        if (body.units_available !== undefined) deal.units_available = body.units_available;
        if (body.status) deal.status = body.status;
        return NextResponse.json({ deal });
      }
      return NextResponse.json({ error: "Not found in memory" }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      const { data, error } = await supabase.from("deals").select("*").eq("id", id).single();
      if (error) throw error;
      return NextResponse.json({ deal: data });
    } catch {
      const deal = db.getDeals().find(d => d.id === id);
      if (deal) return NextResponse.json({ deal });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
