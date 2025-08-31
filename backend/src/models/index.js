// backend/src/models/index.js
const sequelize = require('../config/database');
const AIProvider = require('./AIProvider');
const Bot = require('./Bot');
const Conversation = require('./Conversation');
const Analytics = require('./Analytics');
const ScheduledTask = require('./ScheduledTask');

// Define associations
AIProvider.hasMany(Bot, { foreignKey: 'aiProviderId', as: 'bots' });
Bot.belongsTo(AIProvider, { foreignKey: 'aiProviderId', as: 'aiProvider' });

Bot.hasMany(Conversation, { foreignKey: 'botId', as: 'conversations' });
Conversation.belongsTo(Bot, { foreignKey: 'botId', as: 'bot' });

Bot.hasMany(Analytics, { foreignKey: 'botId', as: 'analytics' });
Analytics.belongsTo(Bot, { foreignKey: 'botId', as: 'bot' });

Bot.hasMany(ScheduledTask, { foreignKey: 'botId', as: 'scheduledTasks' });
ScheduledTask.belongsTo(Bot, { foreignKey: 'botId', as: 'bot' });

// Self-referencing association for conversation threads
Conversation.hasMany(Conversation, { foreignKey: 'parentConversationId', as: 'replies' });
Conversation.belongsTo(Conversation, { foreignKey: 'parentConversationId', as: 'parent' });

// Sync database
async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // For development, use force: true to recreate tables
        // WARNING: This will delete all existing data
        const syncOptions = process.env.NODE_ENV === 'development' 
            ? { force: true } 
            : { alter: true };
        
        await sequelize.sync(syncOptions);
        console.log('All models were synchronized successfully.');
        
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    AIProvider,
    Bot,
    Conversation,
    Analytics,
    ScheduledTask,
    syncDatabase
};