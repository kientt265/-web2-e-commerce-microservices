CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    payment_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE payment_method_enum AS ENUM (
    'credit_card',
    'debit_card',
    'bank_transfer',
    'e_wallet',
    'cod'
);

ALTER TABLE payments
    ADD CONSTRAINT valid_payment_status CHECK (status::payment_status_enum IS NOT NULL),
    ADD CONSTRAINT valid_payment_method CHECK (payment_method::payment_method_enum IS NOT NULL);

CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);