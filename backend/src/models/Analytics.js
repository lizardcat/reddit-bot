// backend/src/models/Analytics.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Analytics = sequelize.define('Analytics', {
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
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    postsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    commentsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalKarma: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalUpvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalDownvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    avgResponseTimeSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    aiTokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    aiCostUsd: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 0.00
    }
}, {
    tableName: 'analytics',
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['bot_id', 'date']
        }
    ]
});

module.exports = Analytics;