import { Decimal } from "@prisma/client/runtime/library";

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: Decimal;
  category_id?: number | null;
  images: string[];
  stock: number;
  created_at?: Date | null;
  updated_at?: Date | null;
  categories?: Category | null;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category_id?: number;
  images?: string[];
  stock: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category_id?: number;
  images?: string[];
  stock?: number;
}

export interface UpdateStockRequest {
  stock: number;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string | null;
  created_at?: Date | null;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response Types
export interface PaginatedResponse<T> {
  products: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Error Types
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
} 