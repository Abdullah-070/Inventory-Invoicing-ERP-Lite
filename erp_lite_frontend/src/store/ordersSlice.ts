/**
 * Orders Redux slice for managing orders state
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customer_id?: number;
  supplier_id?: number;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  filterStatus?: string;
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
  total: 0,
};

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading: (state: OrdersState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: OrdersState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setOrders: (state: OrdersState, action: PayloadAction<{ items: Order[]; total: number }>) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
    },
    addOrder: (state: OrdersState, action: PayloadAction<Order>) => {
      state.items.push(action.payload);
      state.total += 1;
    },
    updateOrder: (state: OrdersState, action: PayloadAction<Order>) => {
      const index = state.items.findIndex((o: Order) => o.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteOrder: (state: OrdersState, action: PayloadAction<number>) => {
      state.items = state.items.filter((o: Order) => o.id !== action.payload);
      state.total -= 1;
    },
    setFilterStatus: (state: OrdersState, action: PayloadAction<string | undefined>) => {
      state.filterStatus = action.payload;
    },
  },
});

export const { setLoading, setError, setOrders, addOrder, updateOrder, deleteOrder, setFilterStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
