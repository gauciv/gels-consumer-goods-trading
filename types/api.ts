export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateOrderRequest {
  store_id?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface CreateOrderResponse {
  order_id: string;
  order_number: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: 'collector' | 'admin';
    full_name: string;
  };
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface OrderFilters {
  status?: string;
  collector_id?: string;
  store_id?: string;
  sort_by?: 'newest' | 'oldest' | 'highest' | 'lowest';
  page?: number;
  page_size?: number;
}

export interface InventoryAdjustment {
  change_amount: number;
  reason: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'collector' | 'admin';
  phone?: string;
}
