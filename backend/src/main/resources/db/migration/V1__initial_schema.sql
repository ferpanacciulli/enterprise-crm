CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT DEFAULT 0,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    role_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
);

CREATE TABLE customers (

    id BIGSERIAL PRIMARY KEY,

    version BIGINT DEFAULT 0,

    company_name VARCHAR(200) NOT NULL,

    contact_name VARCHAR(200),

    email VARCHAR(150),

    phone VARCHAR(50),

    industry VARCHAR(100),

    country VARCHAR(100),

    city VARCHAR(100),

    status VARCHAR(50),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opportunities (

    id BIGSERIAL PRIMARY KEY,

    version BIGINT DEFAULT 0,

    title VARCHAR(200) NOT NULL,

    amount NUMERIC(15,2),

    stage VARCHAR(50),

    expected_close_date DATE,

    customer_id BIGINT NOT NULL,

    owner_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_opportunity_customer
        FOREIGN KEY(customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_opportunity_owner
        FOREIGN KEY(owner_id)
        REFERENCES users(id)

);

CREATE TABLE activities (

    id BIGSERIAL PRIMARY KEY,

    type VARCHAR(50),

    description TEXT,

    activity_date TIMESTAMP,

    opportunity_id BIGINT NOT NULL,

    created_by BIGINT NOT NULL,

    CONSTRAINT fk_activity_opportunity
        FOREIGN KEY(opportunity_id)
        REFERENCES opportunities(id),

    CONSTRAINT fk_activity_user
        FOREIGN KEY(created_by)
        REFERENCES users(id)

);

CREATE TABLE audit_logs (

    id BIGSERIAL PRIMARY KEY,

    entity_name VARCHAR(100),

    entity_id BIGINT,

    action VARCHAR(50),

    username VARCHAR(150),

    ip_address VARCHAR(100),

    details TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE notifications (

    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(200),

    message TEXT,

    read BOOLEAN DEFAULT FALSE,

    recipient_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY(recipient_id)
        REFERENCES users(id)

);

CREATE INDEX idx_user_email
ON users(email);

CREATE INDEX idx_customer_company
ON customers(company_name);

CREATE INDEX idx_customer_status
ON customers(status);

CREATE INDEX idx_opportunity_stage
ON opportunities(stage);

CREATE INDEX idx_opportunity_customer
ON opportunities(customer_id);

CREATE INDEX idx_activity_date
ON activities(activity_date);

CREATE INDEX idx_notification_user
ON notifications(recipient_id);

INSERT INTO roles(name)
VALUES
('ADMIN'),
('MANAGER'),
('SALES_REPRESENTATIVE');