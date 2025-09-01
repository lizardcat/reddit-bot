// backend/src/routes/api.js
const express = require('express');
const router = express.Router();
const BotController = require('../controllers/BotController');
const AIProviderController = require('../controllers/AIProviderController');
const SettingsController = require('../controllers/SettingsController');

// Bot routes
router.get('/bots', BotController.getAllBots);
router.get('/bots/:id', BotController.getBotById);
router.post('/bots', BotController.createBot);
router.put('/bots/:id', BotController.updateBot);
router.delete('/bots/:id', BotController.deleteBot);

// Bot actions
router.post('/bots/:id/start', BotController.startBot);
router.post('/bots/:id/stop', BotController.stopBot);
router.post('/bots/:id/test', BotController.testBot);

// Bot analytics
router.get('/bots/:id/analytics', BotController.getBotAnalytics);

// AI Provider routes
router.get('/ai-providers', AIProviderController.getAllProviders);
router.get('/ai-providers/:id', AIProviderController.getProviderById);
router.post('/ai-providers', AIProviderController.createProvider);
router.put('/ai-providers/:id', AIProviderController.updateProvider);
router.delete('/ai-providers/:id', AIProviderController.deleteProvider);
router.post('/ai-providers/:id/test', AIProviderController.testProvider);

// Settings routes
router.get('/settings', SettingsController.getGlobalSettings);
router.post('/settings', SettingsController.updateGlobalSettings);

module.exports = router;