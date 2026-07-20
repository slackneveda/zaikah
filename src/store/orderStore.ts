import { create } from "zustand";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  departmentId?: number;
}

type OrderType = "takeaway" | "dine-in" | "delivery";

interface OrderState {
  items: CartItem[];
  orderType: OrderType;
  tableId: number | null;
  tableName: string | null;
  cashReceived: number;
  discount: number;
  notes: string;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  updateItemNotes: (id: number, notes: string) => void;
  clearCart: () => void;
  loadOrder: (items: CartItem[]) => void;
  setOrderType: (type: OrderType) => void;
  setTable: (tableId: number, tableName: string) => void;
  setCashReceived: (amount: number) => void;
  setDiscount: (amount: number) => void;
  setNotes: (notes: string) => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getChange: () => number;
  // Deprecated: kept for backward compat
  tableNumber: string | null;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],
  orderType: "takeaway",
  tableId: null,
  tableName: null,
  tableNumber: null,
  cashReceived: 0,
  discount: 0,
  notes: "",

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return { items: state.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQuantity: (id, delta) =>
    set((state) => ({
      items: state.items
        .map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0),
    })),

  updateItemNotes: (id, notes) =>
    set((state) => ({ items: state.items.map((i) => i.id === id ? { ...i, notes } : i) })),

  clearCart: () =>
    set({ items: [], cashReceived: 0, tableId: null, tableName: null, tableNumber: null, discount: 0, notes: "" }),

  loadOrder: (items) => set({ items }),

  setOrderType: (type) => set({ orderType: type }),

  setTable: (tableId, tableName) => set({ tableId, tableName, tableNumber: tableName }),

  setCashReceived: (amount) => set({ cashReceived: amount }),

  setDiscount: (amount) => set({ discount: amount }),

  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getTotal: () => {
    const { discount } = get();
    return Math.max(0, get().getSubtotal() - discount);
  },

  getChange: () => {
    const { cashReceived } = get();
    return Math.max(0, cashReceived - get().getTotal());
  },
}));
