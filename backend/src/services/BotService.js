// backend/src/services/BotService.js
const Bot = require('../models/Bot');
const RedditService = require('./RedditService');
const AIService = require('./AIService');
const { sequelize } = require('../config/database');

class BotService {
    constructor() {
        this.activeBots = new Map(); // Store active bot instances
        this.botIntervals = new Map(); // Store interval timers
    }

    async startBot(botId) {
        try {
            const bot = await Bot.findByPk(botId, {
                include: ['aiProvider']
            });

            if (!bot) {
                throw new Error('Bot not found');
            }

            if (bot.status === 'active') {
                return { success: true, message: 'Bot is already active' };
            }

            // Validate bot configuration
            if (!bot.aiProvider) {
                throw new Error('No AI provider configured for this bot');
            }

            if (!bot.redditClientId || !bot.redditClientSecret) {
                throw new Error('Reddit credentials not configured');
            }

            // Initialize services
            const redditService = new RedditService(
                bot.redditClientId,
                bot.redditClientSecret,
                bot.redditUsername,
                bot.redditPassword
            );

            const aiService = new AIService(
                bot.aiProvider.name,
                bot.aiProvider.apiKey,
                bot.aiProvider.model,
                bot.aiProvider.apiUrl
            );

            // Test connections
            await redditService.authenticate();
            const aiTest = await aiService.testConnection();
            
            if (!aiTest.success) {
                throw new Error(`AI service test failed: ${aiTest.error}`);
            }

            // Store active bot instance
            this.activeBots.set(botId, {
                bot,
                redditService,
                aiService
            });

            // Start monitoring loop
            this.startBotMonitoring(botId);

            // Update bot status
            await bot.update({ 
                status: 'active',
                lastActive: new Date()
            });

            return { 
                success: true, 
                message: 'Bot started successfully',
                botId 
            };

        } catch (error) {
            // Update bot status to error
            const bot = await Bot.findByPk(botId);
            if (bot) {
                await bot.update({ status: 'error' });
            }
            
            throw error;
        }
    }

    async stopBot(botId) {
        try {
            const bot = await Bot.findByPk(botId);
            if (!bot) {
                throw new Error('Bot not found');
            }

            // Clear monitoring interval
            if (this.botIntervals.has(botId)) {
                clearInterval(this.botIntervals.get(botId));
                this.botIntervals.delete(botId);
            }

            // Remove from active bots
            this.activeBots.delete(botId);

            // Update bot status
            await bot.update({ status: 'paused' });

            return { 
                success: true, 
                message: 'Bot stopped successfully',
                botId 
            };

        } catch (error) {
            throw error;
        }
    }

    startBotMonitoring(botId) {
        // Check for new posts/comments every 2-5 minutes
        const interval = setInterval(async () => {
            try {
                await this.processBotActions(botId);
            } catch (error) {
                console.error(`Error in bot monitoring for bot ${botId}:`, error);
                // Stop bot on repeated failures
                await this.stopBot(botId);
            }
        }, Math.random() * (300000 - 120000) + 120000); // 2-5 minutes

        this.botIntervals.set(botId, interval);
    }

    async processBotActions(botId) {
        const botInstance = this.activeBots.get(botId);
        if (!botInstance) return;

        const { bot, redditService, aiService } = botInstance;

        try {
            // Process each subreddit the bot monitors
            for (const subreddit of bot.subreddits) {
                await this.processSubreddit(bot, redditService, aiService, subreddit);
            }

            // Check for mentions
            await this.processMentions(bot, redditService, aiService);

            // Update last active time
            await bot.update({ lastActive: new Date() });

        } catch (error) {
            console.error(`Error processing actions for bot ${botId}:`, error);
            throw error;
        }
    }

    async processSubreddit(bot, redditService, aiService, subreddit) {
        try {
            // Get recent posts from subreddit
            const postsData = await redditService.getSubredditPosts(subreddit, 10, 'new');
            const posts = postsData.data?.children || [];

            for (const postWrapper of posts) {
                const post = postWrapper.data;
                
                // Skip if already processed
                const existingConversation = await this.findExistingConversation(bot.id, post.id);
                if (existingConversation) continue;

                // Decide whether to respond (you can add more sophisticated logic here)
                if (this.shouldRespond(post, bot.instructions)) {
                    await this.respondToPost(bot, redditService, aiService, post, subreddit);
                }

                // Add delay between actions
                await this.delay(bot.responseDelayMin, bot.responseDelayMax);
            }

        } catch (error) {
            console.error(`Error processing subreddit ${subreddit}:`, error);
        }
    }

    async processMentions(bot, redditService, aiService) {
        try {
            const mentions = await redditService.getUserMentions();
            const mentionsList = mentions.data?.children || [];

            for (const mentionWrapper of mentionsList) {
                const mention = mentionWrapper.data;
                
                // Skip if already processed
                const existingConversation = await this.findExistingConversation(bot.id, mention.id);
                if (existingConversation) continue;

                await this.respondToMention(bot, redditService, aiService, mention);
                await this.delay(bot.responseDelayMin, bot.responseDelayMax);
            }

        } catch (error) {
            console.error('Error processing mentions:', error);
        }
    }

    shouldRespond(post, instructions) {
        // Simple logic - you can enhance this
        // For now, respond to posts with questions or specific keywords
        const text = (post.title + ' ' + post.selftext).toLowerCase();
        
        // Don't respond to own posts
        if (post.author === post.subreddit) return false;
        
        // Look for question indicators
        const hasQuestion = text.includes('?') || 
                          text.includes('how') || 
                          text.includes('what') || 
                          text.includes('why') || 
                          text.includes('help');
        
        // Random response rate for non-questions (10%)
        const randomResponse = Math.random() < 0.1;
        
        return hasQuestion || randomResponse;
    }

    async respondToPost(bot, redditService, aiService, post, subreddit) {
        try {
            const prompt = `Post Title: ${post.title}\nPost Content: ${post.selftext}\n\nPlease provide a helpful response.`;
            
            const startTime = Date.now();
            const aiResponse = await aiService.generateResponse(prompt, bot.instructions);
            const responseTime = Math.floor((Date.now() - startTime) / 1000);

            // Submit comment to Reddit
            const redditResponse = await redditService.replyToComment(post.name, aiResponse.text);

            // Record conversation
            await this.recordConversation({
                botId: bot.id,
                redditPostId: post.id,
                subreddit,
                type: 'post',
                userMessage: `${post.title}\n${post.selftext}`,
                botResponse: aiResponse.text,
                responseTimeSeconds: responseTime,
                aiTokensUsed: aiResponse.tokensUsed
            });

            console.log(`Bot ${bot.username} responded to post in r/${subreddit}`);

        } catch (error) {
            console.error('Error responding to post:', error);
        }
    }

    async respondToMention(bot, redditService, aiService, mention) {
        try {
            const prompt = `User mentioned me: ${mention.body}\n\nPlease provide a helpful response.`;
            
            const startTime = Date.now();
            const aiResponse = await aiService.generateResponse(prompt, bot.instructions);
            const responseTime = Math.floor((Date.now() - startTime) / 1000);

            // Reply to mention
            const redditResponse = await redditService.replyToComment(mention.name, aiResponse.text);

            // Record conversation
            await this.recordConversation({
                botId: bot.id,
                redditCommentId: mention.id,
                subreddit: mention.subreddit,
                type: 'mention_reply',
                userMessage: mention.body,
                botResponse: aiResponse.text,
                responseTimeSeconds: responseTime,
                aiTokensUsed: aiResponse.tokensUsed
            });

            // Mark mention as read
            await redditService.markAsRead(mention.name);

            console.log(`Bot ${bot.username} responded to mention in r/${mention.subreddit}`);

        } catch (error) {
            console.error('Error responding to mention:', error);
        }
    }

    async findExistingConversation(botId, redditId) {
        const { Conversation } = require('../models');
        return await Conversation.findOne({
            where: {
                botId,
                $or: [
                    { redditPostId: redditId },
                    { redditCommentId: redditId }
                ]
            }
        });
    }

    async recordConversation(data) {
        const { Conversation } = require('../models');
        return await Conversation.create(data);
    }

    async testBot(botId, testMessage) {
        try {
            const bot = await Bot.findByPk(botId, {
                include: ['aiProvider']
            });

            if (!bot || !bot.aiProvider) {
                throw new Error('Bot or AI provider not found');
            }

            const aiService = new AIService(
                bot.aiProvider.name,
                bot.aiProvider.apiKey,
                bot.aiProvider.model,
                bot.aiProvider.apiUrl
            );

            const response = await aiService.generateResponse(testMessage, bot.instructions);
            
            return {
                success: true,
                response: response.text,
                tokensUsed: response.tokensUsed,
                cost: response.cost
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getBotAnalytics(botId, days = 30) {
        const { Analytics, Conversation } = require('../models');
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get daily analytics
        const analytics = await Analytics.findAll({
            where: {
                botId,
                date: {
                    [sequelize.Op.gte]: startDate
                }
            },
            order: [['date', 'ASC']]
        });

        // Get recent conversations
        const conversations = await Conversation.findAll({
            where: {
                botId,
                createdAt: {
                    [sequelize.Op.gte]: startDate
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        // Calculate totals
        const totals = {
            posts: conversations.filter(c => c.type === 'post').length,
            comments: conversations.filter(c => c.type !== 'post').length,
            totalKarma: conversations.reduce((sum, c) => sum + (c.karma || 0), 0),
            avgResponseTime: conversations.length > 0 
                ? Math.round(conversations.reduce((sum, c) => sum + (c.responseTimeSeconds || 0), 0) / conversations.length)
                : 0,
            totalTokens: conversations.reduce((sum, c) => sum + (c.aiTokensUsed || 0), 0)
        };

        return {
            analytics,
            conversations,
            totals,
            timeRange: { startDate, endDate: new Date(), days }
        };
    }

    delay(minSeconds, maxSeconds) {
        const delayMs = (Math.random() * (maxSeconds - minSeconds) + minSeconds) * 1000;
        return new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Initialize all active bots on server start
    async initializeActiveBots() {
        try {
            const activeBots = await Bot.findAll({
                where: { status: 'active' },
                include: ['aiProvider']
            });

            console.log(`Initializing ${activeBots.length} active bots...`);

            for (const bot of activeBots) {
                try {
                    await this.startBot(bot.id);
                    console.log(`Bot ${bot.username} initialized successfully`);
                } catch (error) {
                    console.error(`Failed to initialize bot ${bot.username}:`, error.message);
                    await bot.update({ status: 'error' });
                }
            }

        } catch (error) {
            console.error('Error initializing active bots:', error);
        }
    }

    // Graceful shutdown
    async shutdown() {
        console.log('Shutting down bot service...');
        
        // Clear all intervals
        for (const [botId, interval] of this.botIntervals) {
            clearInterval(interval);
        }
        
        // Update all active bots to paused
        await Bot.update(
            { status: 'paused' },
            { where: { status: 'active' } }
        );

        this.activeBots.clear();
        this.botIntervals.clear();
        
        console.log('Bot service shutdown complete');
    }
}

module.exports = new BotService();