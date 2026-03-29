/**
 * DealDrop AI Advisor — Groq LLM-powered suggestions with Heuristic Fallback
 */

export interface AdvisorSuggestion {
  suggestedWindow: {
    day: string;
    startTime: string;
    durationMinutes: number;
  };
  suggestedDiscount: {
    minPct: number;
    maxPct: number;
    rationale: string;
  };
  suggestedChannels: string[];
  predictedRedemptions: number;
  confidence: number;
  message: string;
}

const CATEGORY_WINDOWS: Record<string, { windows: string[]; peakDays: string[] }> = {
  food: { windows: ["7:00-9:00 AM", "12:00-2:00 PM", "5:00-7:00 PM"], peakDays: ["Friday", "Saturday", "Sunday"] },
  grocery: { windows: ["8:00-10:00 AM", "4:00-6:00 PM"], peakDays: ["Sunday", "Monday", "Wednesday"] },
  fashion: { windows: ["5:00-8:00 PM", "11:00 AM-1:00 PM"], peakDays: ["Friday", "Saturday"] },
  electronics: { windows: ["10:00 AM-12:00 PM", "6:00-9:00 PM"], peakDays: ["Saturday", "Sunday"] },
  pharmacy: { windows: ["9:00-11:00 AM", "5:00-7:00 PM"], peakDays: ["Monday", "Tuesday", "Saturday"] },
  other: { windows: ["10:00 AM-12:00 PM", "4:00-7:00 PM"], peakDays: ["Friday", "Saturday"] },
};

const CATEGORY_DISCOUNTS: Record<string, { min: number; max: number; avgRedemptionRate: number }> = {
  food: { min: 30, max: 60, avgRedemptionRate: 0.45 },
  grocery: { min: 15, max: 40, avgRedemptionRate: 0.35 },
  fashion: { min: 30, max: 70, avgRedemptionRate: 0.25 },
  electronics: { min: 10, max: 35, avgRedemptionRate: 0.20 },
  pharmacy: { min: 10, max: 30, avgRedemptionRate: 0.30 },
  other: { min: 15, max: 50, avgRedemptionRate: 0.25 },
};

function getHeuristicSuggestion(
  category: string,
  unitsAvailable: number,
  discountPct?: number
): AdvisorSuggestion {
  const cat = category.toLowerCase();
  const windows = CATEGORY_WINDOWS[cat] || CATEGORY_WINDOWS.other;
  const discounts = CATEGORY_DISCOUNTS[cat] || CATEGORY_DISCOUNTS.other;

  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[now.getDay()];
  const hour = now.getHours();

  let bestWindow = windows.windows[0];
  if (hour < 12) bestWindow = windows.windows[0];
  else if (hour < 16) bestWindow = windows.windows[Math.min(1, windows.windows.length - 1)];
  else bestWindow = windows.windows[windows.windows.length - 1];

  const isPeakDay = windows.peakDays.includes(today);
  const discountMultiplier = isPeakDay ? 1.8 : 1.2;

  const predictedRedemptions = Math.round(
    unitsAvailable * discounts.avgRedemptionRate * discountMultiplier *
    (discountPct ? (discountPct / discounts.max) : 0.7)
  );

  const message = isPeakDay
    ? `🔥 ${today} is a peak day for ${cat}! The ${bestWindow} window typically drives ${discountMultiplier}x more redemptions.`
    : `📊 Based on ${cat} trends, ${bestWindow} is your best window today. Consider posting on ${windows.peakDays[0]} for 1.8x more claims.`;

  return {
    suggestedWindow: { day: today, startTime: bestWindow, durationMinutes: 90 },
    suggestedDiscount: {
      minPct: discounts.min,
      maxPct: discounts.max,
      rationale: `${cat} deals at ${discounts.min}-${discounts.max}% off see the highest redemption rates in this area.`,
    },
    suggestedChannels: ["Telegram", "DealDrop Map"],
    predictedRedemptions: Math.min(unitsAvailable, Math.max(1, predictedRedemptions)),
    confidence: isPeakDay ? 0.85 : 0.65,
    message,
  };
}

export async function getAdvisorSuggestion(
  category: string,
  unitsAvailable: number,
  discountPct?: number
): Promise<AdvisorSuggestion> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return getHeuristicSuggestion(category, unitsAvailable, discountPct);

  const fallback = getHeuristicSuggestion(category, unitsAvailable, discountPct);

  try {
    const prompt = `You are the AI Advisor for a hyperlocal flash sale app. A retailer is planning a deal.
Category: ${category}
Units available: ${unitsAvailable}
Planned discount: ${discountPct ? discountPct + "%" : "Not set"}

Return a JSON string matching this exact interface, giving smart, data-driven advice. Do not wrap in markdown or anything else, just raw JSON.
{
  "suggestedWindow": { "day": "string", "startTime": "string", "durationMinutes": number },
  "suggestedDiscount": { "minPct": number, "maxPct": number, "rationale": "string" },
  "suggestedChannels": ["string"],
  "predictedRedemptions": number,
  "confidence": number,
  "message": "string"
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gptoss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    if (!res.ok) {
        // Fallback to llama3 if custom string not supported by Groq deployment
        if (res.status === 404 || res.status === 400 || res.status === 403) {
            const retry = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: "llama3-70b-8192",
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.4,
                  response_format: { type: "json_object" }
                })
            });
            if (!retry.ok) throw new Error("Retry failed");
            const data = await retry.json();
            const content = JSON.parse(data.choices[0].message.content);
            return { ...fallback, ...content };
        }
        throw new Error("Groq API error");
    }

    const data = await res.json();
    let contentStr = data.choices[0].message.content;
    contentStr = contentStr.replace(/^```json/g, "").replace(/```$/g, "").trim();
    const parsed = JSON.parse(contentStr);
    return { ...fallback, ...parsed };
  } catch (error) {
    console.warn("Groq LLM failed, using heuristic fallback:", error);
    return fallback;
  }
}
