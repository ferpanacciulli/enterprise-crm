CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    opportunity_id BIGINT REFERENCES opportunities(id),
    quantity_change INTEGER NOT NULL,
    reason VARCHAR(30) NOT NULL,
    performed_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
