CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    posts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    total_karma INTEGER DEFAULT 0,
    total_upvotes INTEGER DEFAULT 0,
    total_downvotes INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    ai_cost_usd DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint to prevent duplicate daily records
CREATE UNIQUE INDEX unique_bot_daily_analytics ON analytics(bot_id, date);

-- Indexes for performance
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_analytics_bot_date ON analytics(bot_id, date);