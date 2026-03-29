import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedDeal = db.claimDeal(id);
    
    if (!updatedDeal) {
      return NextResponse.json({ error: "Deal not found or sold out" }, { status: 404 });
    }

    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    console.error("Deal claim error:", error);
    return NextResponse.json({ error: "Failed to claim deal" }, { status: 500 });
  }
}
