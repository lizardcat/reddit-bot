// backend/src/models/ScheduledTask.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledTask = sequelize.define('ScheduledTask', {
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
    taskType: {
        type: DataTypes.ENUM('post', 'comment_check', 'analytics_update'),
        allowNull: false
    },
    scheduledTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subreddit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'scheduled_tasks',
    underscored: true
});

module.exports = ScheduledTask;