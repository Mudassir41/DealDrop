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
  drop_points: number;
  created_at: string;
}

// In-memory storage
let stores: Store[] = [];
let deals: Deal[] = [];
let customers: Customer[] = [];

// Seed data — Vandalur / Chennai area
const SEED_DEALS: Deal[] = [
  {
    id: "seed-1",
    store_id: "store-tnagar-1",
    store_name: "Saravana Stores (The Legend)",
    product_name: "Pure Silk Saree",
    description: "Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!",
    category: "fashion",
    discount_pct: 45,
    original_price: 1200,
    units_available: 20,
    units_claimed: 2,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 13.0394,
    longitude: 80.2325,
    live_viewers: 42,
  },
  {
    id: "seed-2",
    store_id: "store-velachery-1",
    store_name: "Phoenix Marketcity (Zudio)",
    product_name: "Zudio Casual Denim",
    description: "Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!",
    category: "fashion",
    discount_pct: 55,
    original_price: 1200,
    units_available: 50,
    units_claimed: 15,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9915,
    longitude: 80.2170,
    live_viewers: 85,
  },
  {
    id: "seed-3",
    store_id: "store-annanagar-1",
    store_name: "Adyar Ananda Bhavan (A2B)",
    product_name: "Ghee Mysore Pak Box",
    description: "Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!",
    category: "bakery",
    discount_pct: 40,
    original_price: 250,
    units_available: 30,
    units_claimed: 12,
    geofence_radius: 1000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 13.0364,
    longitude: 80.2305,
    live_viewers: 28,
  },
  {
    id: "seed-4",
    store_id: "store-salem-1",
    store_name: "D Mart Salem",
    product_name: "Alphonso Mangoes (1kg)",
    description: "Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!",
    category: "grocery",
    discount_pct: 35,
    original_price: 450,
    units_available: 100,
    units_claimed: 60,
    geofence_radius: 5000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 11.6825,
    longitude: 78.1255,
    live_viewers: 12,
  },
  {
    id: "seed-5",
    store_id: "store-bangalore-1",
    store_name: "Natures Basket Indiranagar",
    product_name: "Saffola Oil (1L)",
    description: "Flash clearance! Verified near-expiry or end-of-season stock. Grab before price reverts!",
    category: "grocery",
    discount_pct: 30,
    original_price: 450,
    units_available: 40,
    units_claimed: 5,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9785,
    longitude: 77.6390,
    live_viewers: 34,
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
  awardDropPoints: (chatId: number, amount: number) => {
    const customer = customers.find(c => c.telegram_chat_id === chatId);
    if (customer) {
      customer.drop_points += amount;
      return customer;
    }
    return null;
  },
};
