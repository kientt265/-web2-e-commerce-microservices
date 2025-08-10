\c product_db;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    images TEXT[] DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Apparel and accessories'),
('Books', 'Printed and digital books');


INSERT INTO products (name, description, price, category_id, images, stock)
VALUES
('Smartphone', 'Latest model smartphone with 128GB storage', 699.99, 1, ARRAY['phone1.jpg', 'phone2.jpg'], 50),
('T-Shirt', '100% cotton T-shirt', 19.99, 2, ARRAY['tshirt1.jpg'], 200),
('Novel', 'Best-selling fiction novel', 14.50, 3, ARRAY['novel1.jpg'], 100);
