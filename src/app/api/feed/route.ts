import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { filterNearby } from "@/lib/geo";

// Persona → category affinity mapping
const PERSONA_AFFINITIES: Record<string, Record<string, number>> = {
  student: { food: 1.8, electronics: 1.5, fashion: 1.3, grocery: 0.8, pharmacy: 0.5 },
  parent: { grocery: 1.8, pharmacy: 1.5, food: 1.3, fashion: 1.0, electronics: 0.8 },
  worker: { food: 1.8, pharmacy: 1.2, grocery: 1.0, electronics: 1.0, fashion: 0.8 },
  homemaker: { grocery: 1.8, pharmacy: 1.5, food: 1.3, fashion: 1.0, electronics: 0.6 },
  hunter: { food: 1.2, grocery: 1.2, fashion: 1.2, electronics: 1.2, pharmacy: 1.2 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const persona = searchParams.get("persona") || "hunter";
  const categoriesRaw = searchParams.get("categories");
  const lat = parseFloat(searchParams.get("lat") || "12.9716");
  const lng = parseFloat(searchParams.get("lng") || "77.5946");
  const radius = parseInt(searchParams.get("radius") || "5000", 10);
  const tab = searchParams.get("tab") || "foryou"; // foryou | nearby | trending | expiring

  const preferredCategories = categoriesRaw ? categoriesRaw.split(",") : null;
  const affinities = PERSONA_AFFINITIES[persona] || PERSONA_AFFINITIES.hunter;

  let deals = db.getDeals();

  // Filter by preferred categories if set (and not "all")
  if (preferredCategories && preferredCategories.length > 0) {
    deals = deals.filter(d => preferredCategories.includes(d.category));
  }

  // Add distance data
  const dealsWithDistance = filterNearby(deals, lat, lng, radius);

  // Score each deal
  const scored = dealsWithDistance.map((deal) => {
    const baseScore = deal.discount_pct / 100;
    const personaMultiplier = affinities[deal.category] || 1.0;
    const proximityScore = Math.max(0, 1 - deal.distance / radius);
    
    const totalDuration = new Date(deal.expires_at).getTime() - new Date(deal.starts_at).getTime();
    const timeRemaining = Math.max(0, new Date(deal.expires_at).getTime() - Date.now());
    const urgencyScore = Math.max(0, 1 - timeRemaining / totalDuration);
    
    const remaining = deal.units_available - deal.units_claimed;
    const scarcityScore = remaining <= 5 ? 1.5 : remaining <= 10 ? 1.2 : 1.0;

    const finalScore = baseScore * personaMultiplier * (0.3 + 0.7 * proximityScore) * (0.5 + 0.5 * urgencyScore) * scarcityScore;

    return { ...deal, score: finalScore, urgencyScore, proximityScore };
  });

  // Sort based on tab
  switch (tab) {
    case "nearby":
      scored.sort((a, b) => a.distance - b.distance);
      break;
    case "trending":
      scored.sort((a, b) => b.live_viewers - a.live_viewers);
      break;
    case "expiring":
      scored.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
      break;
    default: // "foryou"
      scored.sort((a, b) => b.score - a.score);
  }

  return NextResponse.json({
    deals: scored,
    meta: {
      total: scored.length,
      persona,
      tab,
      radius,
    },
  });
}
