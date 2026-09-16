CREATE TABLE opportunity_products (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunity_products_opportunity ON opportunity_products(opportunity_id);
CREATE INDEX idx_opportunity_products_product ON opportunity_products(product_id);
