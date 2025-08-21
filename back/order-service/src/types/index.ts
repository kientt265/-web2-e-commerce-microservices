export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price_at_time: number;
    created_at: Date;
  }
  
  export interface Order {
    id: number;
    user_id: string;
    status: string;
    total_amount: number;
    shipping_address: string;
    created_at: Date;
    updated_at: Date;
    order_items: OrderItem[];
  }

  export interface Cart {
    id: number;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    cart_items: CartItem[];
  }
  
  export interface CartItem {
    id: number;
    cart_id: number;
    product_id: number;
    quantity: number;
    price_at_added: number;
    created_at: Date;
    updated_at: Date;
  }

  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }

  export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    images: string[];
    stock: number;
    created_at: Date;
    updated_at: Date;
    categories: Category;
  }
  export interface Category {
    id: number;
    name: string;
    description: string;
    created_at: Date;
  }

  export interface StatusOrder {
    status: 'pending' | 'processing' | 'compeleted' | 'cancelled' | 'refunded';
  }