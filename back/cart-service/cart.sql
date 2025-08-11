CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- từ auth_service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL, -- từ product_service
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_added DECIMAL(10, 2) NOT NULL, -- giá tại thời điểm thêm
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
