// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const apiRoutes = require('./src/routes/api');
const { syncDatabase } = require('./src/models');
const BotService = require('./src/services/BotService');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API routes
app.use('/api', apiRoutes);

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(error.status || 500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message 
    });
});

// Initialize database and start services
async function initializeApp() {
    try {
        console.log('Initializing application...');
        
        // Connect to database and sync models
        const dbConnected = await syncDatabase();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        
        // Initialize active bots
        await BotService.initializeActiveBots();
        
        console.log('Application initialized successfully');
        return true;
    } catch (error) {
        console.error('Application initialization failed:', error);
        return false;
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await BotService.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await BotService.shutdown();
    process.exit(0);
});

module.exports = { app, initializeApp };