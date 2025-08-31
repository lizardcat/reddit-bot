CREATE TABLE ai_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    api_url VARCHAR(500),
    model VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default provider
CREATE UNIQUE INDEX unique_default_provider ON ai_providers (is_default) WHERE is_default = true;