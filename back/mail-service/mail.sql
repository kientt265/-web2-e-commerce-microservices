
CREATE TYPE email_status AS ENUM ('PENDING', 'SENT', 'FAILED');


CREATE TABLE Email_Templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Emails (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL, 
    body TEXT NOT NULL,       
    status email_status DEFAULT 'PENDING',
    template_id BIGINT NULL,
    sent_at TIMESTAMP NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES Email_Templates(id)
);


CREATE TABLE Email_Retry_Log (
    id BIGSERIAL PRIMARY KEY,
    email_id BIGINT NOT NULL REFERENCES Emails(id),
    retry_count INT DEFAULT 0,
    error_message TEXT,
    retried_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Email_Templates (name, subject, body, created_at, updated_at)
VALUES (
    'Order Confirmation',
    'Xác nhận đơn hàng #{{order_id}}',
    'Xin chào {{customer_name}},<br><br>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn có mã <b>{{order_id}}</b> đã được xác nhận.<br><br>Trân trọng,<br>Đội ngũ E-Commerce',
    NOW(),
    NOW()
);

INSERT INTO Emails (recipient, subject, body, template_id, status, created_at, updated_at)
VALUES (
    'khachhang@example.com',
    'Xác nhận đơn hàng #12345',
    'Xin chào Nguyễn Văn A,<br><br>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn có mã <b>12345</b> đã được xác nhận.<br><br>Trân trọng,<br>Đội ngũ E-Commerce',
    1,
    'PENDING', 
    NOW(),
    NOW()
);


