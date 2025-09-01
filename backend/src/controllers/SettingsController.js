// backend/src/controllers/SettingsController.js
const GlobalSettings = require('../models/GlobalSettings');

class SettingsController {
    async getGlobalSettings(req, res) {
        try {
            // For now, we can store in a simple settings table
            // or use environment variables with database overrides
            let settings = await GlobalSettings.findOne();
            
            if (!settings) {
                // Create default settings
                settings = await GlobalSettings.create({
                    redditClientId: process.env.REDDIT_CLIENT_ID || '',
                    redditClientSecret: process.env.REDDIT_CLIENT_SECRET || '',
                    rateLimitEnabled: true,
                    contentModeration: true,
                    maxPostsPerHour: 5
                });
            }
            
            // Don't send the secret in plain text, and map field names to frontend format
            const response = {
                redditAppClientId: settings.redditClientId || '',
                redditAppClientSecret: settings.redditClientSecret ? '••••••••' : '',
                rateLimitingEnabled: settings.rateLimitEnabled,
                contentModerationEnabled: settings.contentModeration,
                maxPostsPerHour: settings.maxPostsPerHour
            };
            
            res.json(response);
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }

    async updateGlobalSettings(req, res) {
        try {
            const {
                redditAppClientId,
                redditAppClientSecret,
                rateLimitingEnabled,
                contentModerationEnabled,
                maxPostsPerHour
            } = req.body;

            let settings = await GlobalSettings.findOne();
            
            const updateData = {
                rateLimitEnabled: rateLimitingEnabled,
                contentModeration: contentModerationEnabled,
                maxPostsPerHour: parseInt(maxPostsPerHour)
            };
            
            // Only update Reddit credentials if they're provided and not masked
            if (redditAppClientId && redditAppClientId.trim()) {
                updateData.redditClientId = redditAppClientId;
            }
            
            if (redditAppClientSecret && redditAppClientSecret !== '••••••••') {
                updateData.redditClientSecret = redditAppClientSecret;
            }

            if (settings) {
                await settings.update(updateData);
            } else {
                settings = await GlobalSettings.create(updateData);
            }

            res.json({ message: 'Settings saved successfully' });
        } catch (error) {
            console.error('Error saving settings:', error);
            res.status(500).json({ error: 'Failed to save settings' });
        }
    }
}

module.exports = new SettingsController();