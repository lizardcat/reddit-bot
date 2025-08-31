// backend/src/models/Conversation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    botId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bots',
            key: 'id'
        }
    },
    redditPostId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    redditCommentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subreddit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('post', 'comment_reply', 'mention_reply'),
        allowNull: false
    },
    userMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    botResponse: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    karma: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    upvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    parentConversationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'conversations',
            key: 'id'
        }
    },
    responseTimeSeconds: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    aiTokensUsed: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'conversations',
    underscored: true
});

module.exports = Conversation;