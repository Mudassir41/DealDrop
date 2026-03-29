/**
 * In-memory data store for MVP (swap to Supabase when keys arrive)
 * Acts as a simple database with CRUD operations
 */

export interface Store {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  created_at: string;
}

export interface Deal {
  id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  description: string;
  category: string;
  discount_pct: number;
  original_price: number | null;
  units_available: number;
  units_claimed: number;
  geofence_radius: number;
  status: "active" | "expired" | "paused";
  channels: { telegram: boolean; whatsapp: boolean; google: boolean; instagram: boolean };
  starts_at: string;
  expires_at: string;
  created_at: string;
  latitude: number;
  longitude: number;
  live_viewers: number;
}

export interface Customer {
  id: string;
  telegram_chat_id: number;
  persona: string;
  category_prefs: string[];
  latitude: number;
  longitude: number;
  created_at: string;
}

// In-memory storage
let stores: Store[] = [];
let deals: Deal[] = [];
let customers: Customer[] = [];

// Seed data — Vandalur / Chennai area
const SEED_DEALS: Deal[] = [
  {
    id: "demo-1",
    store_id: "store-1",
    store_name: "Sri Murugan Bakery",
    product_name: "Fresh Wheat Bread Loaves",
    description: "Freshly baked wheat bread, 400g. Made this morning — must sell today.",
    category: "food",
    discount_pct: 50,
    original_price: 60,
    units_available: 25,
    units_claimed: 5,
    geofence_radius: 1000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9010,
    longitude: 80.0990,
    live_viewers: 14,
  },
  {
    id: "demo-2",
    store_id: "store-2",
    store_name: "Vandalur Fashion Hub",
    product_name: "Cotton Salwar Suits — Clearance",
    description: "End of season cotton salwar suits, all sizes. Premium quality.",
    category: "fashion",
    discount_pct: 60,
    original_price: 900,
    units_available: 30,
    units_claimed: 6,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9045,
    longitude: 80.1020,
    live_viewers: 9,
  },
  {
    id: "demo-3",
    store_id: "store-3",
    store_name: "Chennai Fresh Mart",
    product_name: "Organic Tomatoes — 1kg",
    description: "Farm-fresh tomatoes from Hosur. Near expiry — heavy discount.",
    category: "grocery",
    discount_pct: 40,
    original_price: 80,
    units_available: 20,
    units_claimed: 4,
    geofence_radius: 1500,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.8975,
    longitude: 80.0965,
    live_viewers: 21,
  },
  {
    id: "demo-4",
    store_id: "store-4",
    store_name: "MedPlus Vandalur",
    product_name: "Vitamin C + Zinc Tablets",
    description: "60 tablets, approaching best-before. Same quality, big discount.",
    category: "pharmacy",
    discount_pct: 35,
    original_price: 350,
    units_available: 18,
    units_claimed: 2,
    geofence_radius: 1000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9030,
    longitude: 80.1010,
    live_viewers: 6,
  },
  {
    id: "demo-5",
    store_id: "store-5",
    store_name: "Anna Supermarket",
    product_name: "Alphonso Mangoes — 500g",
    description: "Tree-ripened Alphonso mangoes. Last batch this season.",
    category: "grocery",
    discount_pct: 30,
    original_price: 200,
    units_available: 30,
    units_claimed: 10,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9060,
    longitude: 80.1035,
    live_viewers: 17,
  },
];

// Initialize with seed data
deals = [...SEED_DEALS];

export const db = {
  // Stores
  getStores: () => stores,
  addStore: (store: Store) => {
    stores.push(store);
    return store;
  },

  // Deals
  getDeals: () => deals.filter(d => d.status === "active"),
  getAllDeals: () => deals,
  getDeal: (id: string) => deals.find(d => d.id === id),
  addDeal: (deal: Deal) => {
    deals.push(deal);
    return deal;
  },
  updateDeal: (id: string, updates: Partial<Deal>) => {
    const idx = deals.findIndex(d => d.id === id);
    if (idx >= 0) {
      deals[idx] = { ...deals[idx], ...updates };
      return deals[idx];
    }
    return null;
  },
  claimDeal: (id: string) => {
    const deal = deals.find(d => d.id === id);
    if (deal && deal.units_claimed < deal.units_available) {
      deal.units_claimed++;
      if (deal.units_available - deal.units_claimed <= Math.ceil(deal.units_available * 0.2)) {
        deal.status = "active"; // could trigger stock_low event
      }
      return deal;
    }
    return null;
  },

  // Customers (Telegram subscribers)
  getCustomers: () => customers,
  getCustomerByTelegramId: (chatId: number) => customers.find(c => c.telegram_chat_id === chatId),
  addCustomer: (customer: Customer) => {
    const existing = customers.find(c => c.telegram_chat_id === customer.telegram_chat_id);
    if (existing) {
      Object.assign(existing, customer);
      return existing;
    }
    customers.push(customer);
    return customer;
  },
};
