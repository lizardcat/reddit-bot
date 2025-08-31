CREATE TABLE bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'error')),
    subreddits TEXT[],
    instructions TEXT,
    auto_response BOOLEAN DEFAULT TRUE,
    response_delay_min INTEGER DEFAULT 2,
    response_delay_max INTEGER DEFAULT 5,
    ai_provider_id INTEGER REFERENCES ai_providers(id) ON DELETE SET NULL,
    reddit_client_id VARCHAR(255),
    reddit_client_secret TEXT,
    reddit_username VARCHAR(255),
    reddit_password TEXT,
    last_active TIMESTAMP,
    total_karma INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_bots_status ON bots(status);
CREATE INDEX idx_bots_ai_provider ON bots(ai_provider_id);