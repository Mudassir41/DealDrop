import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const body = await req.json();
    const { qr_code } = body;

    if (!qr_code) {
      return NextResponse.json({ error: "QR code payload missing" }, { status: 400 });
    }

    // qr_code format: dealId-telegramChatId-timestamp (or persona if anon)
    const parts = qr_code.split('-');
    if (parts.length < 3 || parts[0] !== dealId) {
      return NextResponse.json({ error: "Invalid QR code for this deal" }, { status: 400 });
    }

    const chatIdOrPersona = parts[1];

    const deal = db.getDeal(dealId);
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "active") {
      return NextResponse.json({ error: "Deal is no longer active" }, { status: 400 });
    }

    if (deal.units_claimed >= deal.units_available) {
      return NextResponse.json({ error: "Deal is fully redeemed/sold out" }, { status: 400 });
    }

    // We do NOT increment units_claimed here because it was already incremented 
    // when the buyer pressed "Claim Deal" on their end. 
    // This endpoint just verifies they showed up and awards points.

    // Award Drop Points if identity is a Telegram Chat ID (numbers only roughly)
    let pointsAwarded = false;
    if (/^\d+$/.test(chatIdOrPersona)) {
      const dbCust = db.awardDropPoints(parseInt(chatIdOrPersona, 10), 10);
      if (dbCust) pointsAwarded = true;
    }

    return NextResponse.json({
      success: true,
      deal: {
        product: deal.product_name,
        discount: deal.discount_pct
      },
      points_awarded: pointsAwarded ? 10 : 0
    });

  } catch (err) {
    console.error("Redeem error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
