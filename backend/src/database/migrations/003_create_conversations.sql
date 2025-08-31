CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
    reddit_post_id VARCHAR(255),
    reddit_comment_id VARCHAR(255),
    subreddit VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'comment_reply', 'mention_reply')),
    user_message TEXT,
    bot_response TEXT NOT NULL,
    karma INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    parent_conversation_id INTEGER REFERENCES conversations(id),
    response_time_seconds INTEGER,
    ai_tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_subreddit ON conversations(subreddit);
CREATE INDEX idx_conversations_type ON conversations(type);