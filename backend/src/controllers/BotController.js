// backend/src/controllers/BotController.js
const Bot = require('../models/Bot');
const BotService = require('../services/BotService');

class BotController {
    async getAllBots(req, res) {
        try {
            const bots = await Bot.findAll({
                include: ['aiProvider'],
                order: [['createdAt', 'DESC']]
            });
            res.json(bots);
        } catch (error) {
            console.error('Error fetching bots:', error);
            res.status(500).json({ error: 'Failed to fetch bots' });
        }
    }

    async getBotById(req, res) {
        try {
            const { id } = req.params;
            const bot = await Bot.findByPk(id, {
                include: ['aiProvider', 'conversations', 'analytics']
            });
            
            if (!bot) {
                return res.status(404).json({ error: 'Bot not found' });
            }
            
            res.json(bot);
        } catch (error) {
            console.error('Error fetching bot:', error);
            res.status(500).json({ error: 'Failed to fetch bot' });
        }
    }

    async createBot(req, res) {
        try {
            const {
                name,
                username,
                subreddits,
                instructions,
                autoResponse,
                responseDelayMin,
                responseDelayMax,
                aiProviderId,
                redditClientId,
                redditClientSecret,
                redditUsername,
                redditPassword
            } = req.body;

            // Validate required fields
            if (!name || !username || !redditClientId || !redditClientSecret || !redditUsername || !redditPassword) {
                return res.status(400).json({ 
                    error: 'Missing required fields: name, username, Reddit credentials are required' 
                });
            }

            const bot = await Bot.create({
                name,
                username,
                subreddits: subreddits || [],
                instructions,
                autoResponse: autoResponse !== undefined ? autoResponse : true,
                responseDelayMin: responseDelayMin || 2,
                responseDelayMax: responseDelayMax || 5,
                aiProviderId,
                redditClientId,
                redditClientSecret,
                redditUsername,
                redditPassword
            });

            res.status(201).json(bot);
        } catch (error) {
            console.error('Error creating bot:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                res.status(400).json({ error: 'Username already exists' });
            } else {
                res.status(500).json({ error: 'Failed to create bot' });
            }
        }
    }

    async updateBot(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const bot = await Bot.findByPk(id);
            if (!bot) {
                return res.status(404).json({ error: 'Bot not found' });
            }

            await bot.update(updates);
            res.json(bot);
        } catch (error) {
            console.error('Error updating bot:', error);
            res.status(500).json({ error: 'Failed to update bot' });
        }
    }

    async deleteBot(req, res) {
        try {
            const { id } = req.params;
            const bot = await Bot.findByPk(id);
            
            if (!bot) {
                return res.status(404).json({ error: 'Bot not found' });
            }

            // Stop bot if running
            if (bot.status === 'active') {
                await BotService.stopBot(id);
            }

            await bot.destroy();
            res.json({ message: 'Bot deleted successfully' });
        } catch (error) {
            console.error('Error deleting bot:', error);
            res.status(500).json({ error: 'Failed to delete bot' });
        }
    }

    async startBot(req, res) {
        try {
            const { id } = req.params;
            const result = await BotService.startBot(id);
            res.json(result);
        } catch (error) {
            console.error('Error starting bot:', error);
            res.status(500).json({ error: 'Failed to start bot' });
        }
    }

    async stopBot(req, res) {
        try {
            const { id } = req.params;
            const result = await BotService.stopBot(id);
            res.json(result);
        } catch (error) {
            console.error('Error stopping bot:', error);
            res.status(500).json({ error: 'Failed to stop bot' });
        }
    }

    async testBot(req, res) {
        try {
            const { id } = req.params;
            const { testMessage } = req.body;
            
            const result = await BotService.testBot(id, testMessage || 'Test message');
            res.json(result);
        } catch (error) {
            console.error('Error testing bot:', error);
            res.status(500).json({ error: 'Failed to test bot' });
        }
    }

    async getBotAnalytics(req, res) {
        try {
            const { id } = req.params;
            const { days = 30 } = req.query;
            
            const analytics = await BotService.getBotAnalytics(id, days);
            res.json(analytics);
        } catch (error) {
            console.error('Error fetching bot analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}

module.exports = new BotController();