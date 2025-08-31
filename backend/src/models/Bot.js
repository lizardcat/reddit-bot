const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bot = sequelize.define('Bot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'error'),
        defaultValue: 'paused'
    },
    subreddits: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    instructions: {
        type: DataTypes.TEXT
    },
    autoResponse: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    responseDelayMin: {
        type: DataTypes.INTEGER,
        defaultValue: 2
    },
    responseDelayMax: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    aiProviderId: {
        type: DataTypes.INTEGER,
        references: {
        model: 'ai_providers',
        key: 'id'
        }
    },
    totalKarma: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastActive: {
        type: DataTypes.DATE
    }
    }, {
    tableName: 'bots',
    underscored: true
});

module.exports = Bot;