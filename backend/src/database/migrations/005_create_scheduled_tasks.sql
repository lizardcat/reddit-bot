CREATE TABLE scheduled_tasks (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('post', 'comment_check', 'analytics_update')),
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    content TEXT,
    subreddit VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for task queue processing
CREATE INDEX idx_scheduled_tasks_status_time ON scheduled_tasks(status, scheduled_time);
CREATE INDEX idx_scheduled_tasks_bot_id ON scheduled_tasks(bot_id);