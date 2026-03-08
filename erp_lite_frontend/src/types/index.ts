/**
 * ERP-Lite Frontend Type Definitions
 */

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'VIEWER' | 'CUSTOMER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  id: number;
  customer_id: number;
  invoice_number?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
