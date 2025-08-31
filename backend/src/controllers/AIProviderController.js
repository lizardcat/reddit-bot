// backend/src/controllers/AIProviderController.js
const AIProvider = require('../models/AIProvider');
const AIService = require('../services/AIService');

class AIProviderController {
    async getAllProviders(req, res) {
        try {
            const providers = await AIProvider.findAll({
                order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
            });
            res.json(providers);
        } catch (error) {
            console.error('Error fetching AI providers:', error);
            res.status(500).json({ error: 'Failed to fetch AI providers' });
        }
    }

    async getProviderById(req, res) {
        try {
            const { id } = req.params;
            const provider = await AIProvider.findByPk(id);
            
            if (!provider) {
                return res.status(404).json({ error: 'AI provider not found' });
            }
            
            res.json(provider);
        } catch (error) {
            console.error('Error fetching AI provider:', error);
            res.status(500).json({ error: 'Failed to fetch AI provider' });
        }
    }

    async createProvider(req, res) {
        try {
            const { name, apiKey, apiUrl, model, isDefault } = req.body;

            // Validate required fields
            if (!name || !apiKey) {
                return res.status(400).json({ 
                    error: 'Name and API key are required' 
                });
            }

            // Validate provider name
            const validProviders = ['openai', 'claude', 'gemini', 'local'];
            if (!validProviders.includes(name.toLowerCase())) {
                return res.status(400).json({ 
                    error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` 
                });
            }

            const provider = await AIProvider.create({
                name: name.toLowerCase(),
                apiKey,
                apiUrl,
                model,
                isDefault: isDefault || false
            });

            res.status(201).json(provider);
        } catch (error) {
            console.error('Error creating AI provider:', error);
            res.status(500).json({ error: 'Failed to create AI provider' });
        }
    }

    async updateProvider(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const provider = await AIProvider.findByPk(id);
            if (!provider) {
                return res.status(404).json({ error: 'AI provider not found' });
            }

            await provider.update(updates);
            res.json(provider);
        } catch (error) {
            console.error('Error updating AI provider:', error);
            res.status(500).json({ error: 'Failed to update AI provider' });
        }
    }

    async deleteProvider(req, res) {
        try {
            const { id } = req.params;
            const provider = await AIProvider.findByPk(id);
            
            if (!provider) {
                return res.status(404).json({ error: 'AI provider not found' });
            }

            // Check if any bots are using this provider
            const { Bot } = require('../models');
            const botsUsingProvider = await Bot.count({ where: { aiProviderId: id } });
            
            if (botsUsingProvider > 0) {
                return res.status(400).json({ 
                    error: `Cannot delete provider. ${botsUsingProvider} bot(s) are still using it.` 
                });
            }

            await provider.destroy();
            res.json({ message: 'AI provider deleted successfully' });
        } catch (error) {
            console.error('Error deleting AI provider:', error);
            res.status(500).json({ error: 'Failed to delete AI provider' });
        }
    }

    async testProvider(req, res) {
        try {
            const { id } = req.params;
            const { testMessage } = req.body;

            const provider = await AIProvider.findByPk(id);
            if (!provider) {
                return res.status(404).json({ error: 'AI provider not found' });
            }

            const aiService = new AIService(
                provider.name,
                provider.apiKey,
                provider.model,
                provider.apiUrl
            );

            const result = await aiService.testConnection();
            res.json(result);
        } catch (error) {
            console.error('Error testing AI provider:', error);
            res.status(500).json({ error: 'Failed to test AI provider' });
        }
    }
}

module.exports = new AIProviderController();