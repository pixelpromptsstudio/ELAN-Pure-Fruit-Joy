import { getAssetPath } from '@/lib/utils';

export interface HarvestOrder {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  flavourId: string;
  flavourName: string;
  bottles: number;
  totalPrice: number;
  createdAt: string;
}

export interface HarvestOrderInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  flavourId: string;
  flavourName: string;
  bottles: number;
  totalPrice: number;
}

export const LOCAL_ORDERS_KEY = 'elan_demo_orders';

const IS_STATIC_EXPORT =
  process.env.NODE_ENV === 'production' || Boolean(process.env.NEXT_PUBLIC_BASE_PATH);

export const SEED_HARVEST_ORDERS: HarvestOrder[] = [
  {
    id: 'ELAN-BHOPAL-90812',
    name: 'Vikramaditya Sharma',
    phone: '+91 98260 12345',
    address: 'Arera Colony, Phase 1',
    city: 'Bhopal, Madhya Pradesh',
    flavourId: 'mango-bliss',
    flavourName: 'Mango Bliss',
    bottles: 4,
    totalPrice: 996,
    createdAt: '2026-11-13T04:30:00.000Z',
  },
  {
    id: 'ELAN-BHOPAL-90811',
    name: 'Ananya Roy',
    phone: '+91 94250 67890',
    address: 'Shyamla Hills, Lake View Estate',
    city: 'Bhopal, Madhya Pradesh',
    flavourId: 'guava-glow',
    flavourName: 'Guava Glow',
    bottles: 2,
    totalPrice: 458,
    createdAt: '2026-11-12T18:15:00.000Z',
  },
];

function readLocalOrders(): HarvestOrder[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalOrder(order: HarvestOrder): void {
  try {
    const existing = readLocalOrders();
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...existing]));
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

/**
 * Reserves a harvest allocation. Skips network API calls on static exports so
 * browsers never log spurious 404/405 responses to missing dynamic routes.
 */
export async function submitHarvestOrder(payload: HarvestOrderInput): Promise<HarvestOrder> {
  if (!IS_STATIC_EXPORT) {
    try {
      const response = await fetch(getAssetPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.order) {
          return data.order;
        }
      }
    } catch {
      // Fall through to local ledger persistence
    }
  }

  const localOrder: HarvestOrder = {
    id: `ELAN-BHOPAL-${Math.floor(10000 + Math.random() * 90000)}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  saveLocalOrder(localOrder);
  return localOrder;
}

/**
 * Loads combined local concierge reservations and Bhopal press-house seed entries.
 */
export async function loadConciergeOrders(): Promise<{
  totalOrders: number;
  totalRevenue: number;
  orders: HarvestOrder[];
}> {
  let remoteOrders: HarvestOrder[] = IS_STATIC_EXPORT ? SEED_HARVEST_ORDERS : [];

  if (!IS_STATIC_EXPORT) {
    try {
      const res = await fetch(getAssetPath('/api/orders'));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          remoteOrders = json.orders;
        }
      }
    } catch {
      remoteOrders = SEED_HARVEST_ORDERS;
    }
  }

  const localOrders = readLocalOrders();
  const seenIds = new Set(remoteOrders.map((o) => o.id));
  const orders = [...localOrders.filter((o) => !seenIds.has(o.id)), ...remoteOrders];

  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0),
    orders,
  };
}

