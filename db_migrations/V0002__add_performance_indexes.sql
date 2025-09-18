-- Добавление индексов для оптимизации производительности
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);