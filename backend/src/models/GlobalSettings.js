// backend/src/models/GlobalSettings.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalSettings = sequelize.define('GlobalSettings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    redditClientId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    redditClientSecret: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rateLimitEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    contentModeration: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    maxPostsPerHour: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    }
}, {
    tableName: 'global_settings',
    underscored: true
});

module.exports = GlobalSettings;