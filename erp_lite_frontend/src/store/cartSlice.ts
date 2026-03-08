import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  stock_quantity: number;
}

interface CartState {
  items: CartItem[];
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('cart');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(items));
}

const initialState: CartState = { items: loadCart() };

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(i => i.product_id === action.payload.product_id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, action.payload.stock_quantity);
      } else {
        state.items.push({ ...action.payload });
      }
      saveCart(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ product_id: number; quantity: number }>) {
      const item = state.items.find(i => i.product_id === action.payload.product_id);
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stock_quantity));
        saveCart(state.items);
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.product_id !== action.payload);
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      saveCart(state.items);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
