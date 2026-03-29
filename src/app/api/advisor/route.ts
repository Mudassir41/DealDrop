import { NextRequest, NextResponse } from "next/server";
import { getAdvisorSuggestion } from "@/lib/advisor";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const units = searchParams.get("units");
  const discount = searchParams.get("discount");

  if (!category || !units) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const suggestion = await getAdvisorSuggestion(
    category,
    parseInt(units, 10),
    discount ? parseInt(discount, 10) : undefined
  );

  return NextResponse.json(suggestion);
}
