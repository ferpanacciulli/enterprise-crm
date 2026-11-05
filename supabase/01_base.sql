-- 01_base.sql (final)
-- Roles, usuarios, clientes y trigger para actualizar timestamps.

-- Tabla roles
CREATE TABLE IF NOT EXISTS roles (
    id   UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

INSERT INTO roles (id, name)
VALUES (gen_random_uuid(), 'ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Tabla de usuarios (solo datos adicionales)
CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY,
    email      TEXT NOT NULL,
    full_name  TEXT,
    role_id    UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email       TEXT,
    phone       TEXT,
    industry    TEXT,
    country     TEXT,
    city        TEXT,
    status      TEXT NOT NULL DEFAULT 'LEAD',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de oportunidades (incluye owner_name)
CREATE TABLE IF NOT EXISTS opportunities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    amount        NUMERIC NOT NULL DEFAULT 0,
    stage         TEXT NOT NULL DEFAULT 'LEAD',
    expected_close_date DATE,
    customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
    owner_name    TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de actividades (incluye nombre del usuario que creó)
CREATE TABLE IF NOT EXISTS activities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    description   TEXT,
    created_by    UUID REFERENCES auth.users(id),
    created_by_name TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION trg_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION trg_update_updated_at();

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON opportunities;
CREATE TRIGGER trg_opportunities_updated_at
BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION trg_update_updated_at();
