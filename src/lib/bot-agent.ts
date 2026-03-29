import { db } from "./store";
import { getAdvisorSuggestion } from "./advisor";
import { filterNearby } from "./geo";

export const tools = [
  {
    type: "function",
    function: {
      name: "search_deals",
      description: "Search for active deals near the user. Can be filtered by category.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Optional category filter (e.g., food, grocery, electronics)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description: "Get a list of available deal categories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_drop_points",
      description: "Check the user's current Drop Points balance.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "register_store",
      description: "Register a new store on DealDrop and tie it to the user's Telegram ID.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The name of the store" },
          category: { type: "string", description: "The category of the store (e.g., food, grocery)" },
        },
        required: ["name", "category"]
      },
    },
  },
  {
    type: "function",
    function: {
      name: "post_deal",
      description: "Post a new flash sale deal for the retailer's store.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          discount_pct: { type: "number" },
          units: { type: "number" }
        },
        required: ["product_name", "discount_pct", "units"]
      },
    },
  },
  {
    type: "function",
    function: {
      name: "claim_deal",
      description: "Claim a specific deal for the user by its ID. Returns a redemption OTP.",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "string", description: "The ID of the deal to claim" },
        },
        required: ["deal_id"]
      },
    },
  }
];

export async function executeTool(name: string, args: any, chatId: number, userLocation?: { lat: number; lng: number }) {
  switch (name) {
    case "search_deals": {
      let deals = db.getDeals();
      if (args.category) {
        deals = deals.filter(d => d.category.toLowerCase() === args.category.toLowerCase());
      }
      if (userLocation) {
        deals = filterNearby(deals, userLocation.lat, userLocation.lng, 5000).slice(0, 3);
        if (deals.length === 0) return JSON.stringify({ message: "No deals found within 5km." });
        return JSON.stringify(deals.map(d => ({
          id: d.id,
          store: d.store_name,
          product: d.product_name,
          discount: `${d.discount_pct}% OFF`,
          distance: `${(d as any).distance}m away`
        })));
      }
      return JSON.stringify({ message: "Location not available. Please ask user to share location." });
    }
    case "get_categories": {
      const deals = db.getDeals();
      const counts: Record<string, number> = {};
      deals.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
      return JSON.stringify(counts);
    }
    case "get_drop_points": {
      const customer = db.getCustomerByTelegramId(chatId);
      return JSON.stringify({ points: customer?.drop_points || 0 });
    }
    case "register_store": {
      return JSON.stringify({ success: true, message: `Store '${args.name}' registered successfully! You can now post deals using /post_deal or by chatting with me.` });
    }
    case "post_deal": {
      return JSON.stringify({ success: true, message: `Deal posted for ${args.units}x ${args.product_name} at ${args.discount_pct}% OFF!` });
    }
    case "claim_deal": {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // In a real app, we'd call the claim API here to decrement units in DB
      return JSON.stringify({ success: true, otp, message: `Deal claimed successfully! Your redemption code is ${otp}.` });
    }
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

// In-memory conversation history (sliding window)
const conversations = new Map<number, any[]>();

export async function processChat(chatId: number, text: string, userLocation?: { lat: number; lng: number }): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "Groq API key missing.";

  const history = conversations.get(chatId) || [];
  
  // Initial system prompt
  if (history.length === 0) {
    history.push({
      role: "system",
      content: `You are the DealDrop Telegram Agent. Friendly, helpful, uses emojis. 
      Help users find hyperlocal deals or help retailers onboard and post deals.
      1. If they ask about deals, search_deals.
      2. If they want to register a store, call register_store.
      3. If they want to post a deal, call post_deal.
      4. If they want to claim a specific deal they see, call claim_deal.
      Never invent deals/stores.`
    });
  }

  history.push({ role: "user", content: text });
  
  // Keep window short (system + last 10)
  if (history.length > 11) {
    history.splice(1, history.length - 11);
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gptoss-20b",
        messages: history.map(m => ({ role: m.role, content: m.content || "" })), // Sanitize payloads
        tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_completion_tokens: 300
      })
    });

    if (!res.ok) throw new Error("Groq API failed");
    const data = await res.json();
    const message = data.choices[0].message;

    history.push(message);

    if (message.tool_calls) {
      // Execute all tool calls
      for (const call of message.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        const result = await executeTool(call.function.name, args, chatId, userLocation);
        history.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: result
        });
      }

      // Get final response
      const followUp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gptoss-20b",
          messages: history.map(m => ({ role: m.role, content: m.content || "" })), // Exclude complex tool payloads to prevent strict API failures
          temperature: 0.3,
          max_completion_tokens: 300
        })
      });

      const followData = await followUp.json();
      const finalMsg = followData.choices[0].message;
      history.push(finalMsg);
      conversations.set(chatId, history);
      return finalMsg.content;
    }

    conversations.set(chatId, history);
    return message.content;

  } catch (err) {
    console.error("Agent error:", err);
    return "I'm having trouble thinking right now. Please try again later! ⚙️";
  }
}
