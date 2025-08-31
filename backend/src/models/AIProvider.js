// backend/src/models/AIProvider.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIProvider = sequelize.define('AIProvider', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['openai', 'claude', 'gemini', 'local']]
        }
    },
    apiKey: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    apiUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'ai_providers',
    underscored: true,
    hooks: {
        beforeSave: async (provider) => {
            // Ensure only one default provider
            if (provider.isDefault) {
                await AIProvider.update(
                    { isDefault: false },
                    { where: { isDefault: true, id: { [sequelize.Op.ne]: provider.id } } }
                );
            }
        }
    }
});

module.exports = AIProvider;