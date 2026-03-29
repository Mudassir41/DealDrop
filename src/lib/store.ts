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

// Seed data for demo
const SEED_DEALS: Deal[] = [
  {
    id: "demo-1",
    store_id: "store-1",
    store_name: "Mehta Bakery",
    product_name: "Fresh Whole Wheat Bread",
    description: "Freshly baked whole wheat bread, 400g loaves. Made this morning.",
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
    latitude: 12.9716,
    longitude: 77.5946,
    live_viewers: 12,
  },
  {
    id: "demo-2",
    store_id: "store-2",
    store_name: "StyleHub Fashion",
    product_name: "Cotton Kurtas — End of Season",
    description: "Premium cotton kurtas, all sizes. Clearing end-of-season stock.",
    category: "fashion",
    discount_pct: 60,
    original_price: 1200,
    units_available: 40,
    units_claimed: 8,
    geofence_radius: 2000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9750,
    longitude: 77.5980,
    live_viewers: 8,
  },
  {
    id: "demo-3",
    store_id: "store-3",
    store_name: "FreshMart Groceries",
    product_name: "Organic Mangoes — 1kg Pack",
    description: "Alphonso mangoes, tree-ripened. Near expiry — must sell today.",
    category: "grocery",
    discount_pct: 40,
    original_price: 350,
    units_available: 15,
    units_claimed: 3,
    geofence_radius: 1500,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9680,
    longitude: 77.5910,
    live_viewers: 18,
  },
  {
    id: "demo-4",
    store_id: "store-4",
    store_name: "PharmaCare Plus",
    product_name: "Vitamin D3 Supplements",
    description: "60 tablets pack, approaching best-before date. Same quality.",
    category: "pharmacy",
    discount_pct: 35,
    original_price: 450,
    units_available: 20,
    units_claimed: 2,
    geofence_radius: 1000,
    status: "active",
    channels: { telegram: true, whatsapp: false, google: false, instagram: false },
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    latitude: 12.9730,
    longitude: 77.6010,
    live_viewers: 5,
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
