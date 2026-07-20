import { create } from "zustand";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderState {
  items: CartItem[];
  orderType: "takeaway" | "dine-in";
  tableId: number | null;
  tableNumber: number | null;
  cashReceived: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  setOrderType: (type: "takeaway" | "dine-in") => void;
  setTable: (tableId: number, tableNumber: number) => void;
  setCashReceived: (amount: number) => void;
  getSubtotal: () => number;
  getChange: () => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],
  orderType: "takeaway",
  tableId: null,
  tableNumber: null,
  cashReceived: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQuantity: (id, delta) =>
    set((state) => {
      const updated = state.items
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0);
      return { items: updated };
    }),

  clearCart: () =>
    set({ items: [], cashReceived: 0, tableId: null, tableNumber: null }),

  setOrderType: (type) => set({ orderType: type }),

  setTable: (tableId, tableNumber) => set({ tableId, tableNumber }),

  setCashReceived: (amount) => set({ cashReceived: amount }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getChange: () => {
    const { cashReceived } = get();
    const subtotal = get().getSubtotal();
    return Math.max(0, cashReceived - subtotal);
  },
}));
