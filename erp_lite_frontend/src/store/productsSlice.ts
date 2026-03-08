/**
 * Products Redux slice for managing product state
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setLoading: (state: ProductsState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: ProductsState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setProducts: (state: ProductsState, action: PayloadAction<{ items: Product[]; total: number }>) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
    },
    addProduct: (state: ProductsState, action: PayloadAction<Product>) => {
      state.items.push(action.payload);
      state.total += 1;
    },
    updateProduct: (state: ProductsState, action: PayloadAction<Product>) => {
      const index = state.items.findIndex((p: Product) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteProduct: (state: ProductsState, action: PayloadAction<number>) => {
      state.items = state.items.filter((p: Product) => p.id !== action.payload);
      state.total -= 1;
    },
    setPage: (state: ProductsState, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
});

export const { setLoading, setError, setProducts, addProduct, updateProduct, deleteProduct, setPage } = productsSlice.actions;
export default productsSlice.reducer;
