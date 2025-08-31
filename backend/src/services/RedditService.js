// backend/src/services/RedditService.js
const axios = require('axios');

class RedditService {
    constructor(clientId, clientSecret, username, password) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.username = username;
        this.password = password;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.userAgent = 'reddit-bot-dashboard/1.0.0';
    }

    async authenticate() {
        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
                new URLSearchParams({
                    grant_type: 'password',
                    username: this.username,
                    password: this.password
                }), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'User-Agent': this.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            return true;
        } catch (error) {
            console.error('Reddit authentication failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() > this.tokenExpiry - 60000) {
            await this.authenticate();
        }
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        await this.ensureAuthenticated();

        const config = {
            method,
            url: `https://oauth.reddit.com${endpoint}`,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'User-Agent': this.userAgent,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`Reddit API request failed: ${endpoint}`, error.response?.data || error.message);
            throw error;
        }
    }

    async getSubredditPosts(subreddit, limit = 25, sort = 'hot') {
        return this.makeRequest(`/r/${subreddit}/${sort}?limit=${limit}`);
    }

    async getPostComments(subreddit, postId) {
        return this.makeRequest(`/r/${subreddit}/comments/${postId}`);
    }

    async submitPost(subreddit, title, text, kind = 'self') {
        return this.makeRequest('/api/submit', 'POST', {
            sr: subreddit,
            kind,
            title,
            text,
            api_type: 'json'
        });
    }

    async replyToComment(parentId, text) {
        return this.makeRequest('/api/comment', 'POST', {
            parent: parentId,
            text,
            api_type: 'json'
        });
    }

    async getUserMentions() {
        return this.makeRequest('/message/mentions?limit=25');
    }

    async getInbox() {
        return this.makeRequest('/message/inbox?limit=25');
    }

    async markAsRead(messageId) {
        return this.makeRequest('/api/read_message', 'POST', {
            id: messageId
        });
    }

    async getUserProfile() {
        return this.makeRequest('/api/v1/me');
    }

    async getKarma() {
        return this.makeRequest('/api/v1/me/karma');
    }
}

module.exports = RedditService;