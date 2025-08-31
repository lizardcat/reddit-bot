import React, { useState, useEffect } from 'react';

// Simple icon components using text/symbols (same API as lucide-react)
const SimpleIcons = {
  Plus: ({ size, className }) => <span className={`text-lg ${className || ''}`}>+</span>,
  Settings: ({ size, className }) => <span className={`text-lg ${className || ''}`}>⚙️</span>,
  Play: ({ size, className }) => <span className={`text-lg ${className || ''}`}>▶️</span>,
  Pause: ({ size, className }) => <span className={`text-lg ${className || ''}`}>⏸️</span>,
  MessageSquare: ({ size, className }) => <span className={`text-lg ${className || ''}`}>💬</span>,
  Users: ({ size, className }) => <span className={`text-lg ${className || ''}`}>👥</span>,
  BarChart3: ({ size, className }) => <span className={`text-lg ${className || ''}`}>📊</span>,
  AlertCircle: ({ size, className }) => <span className={`text-lg ${className || ''}`}>⚠️</span>,
  Trash2: ({ size, className }) => <span className={`text-lg ${className || ''}`}>🗑️</span>,
  Edit2: ({ size, className }) => <span className={`text-lg ${className || ''}`}>✏️</span>,
  Database: ({ size, className }) => <span className={`text-lg ${className || ''}`}>🗄️</span>,
  Key: ({ size, className }) => <span className={`text-lg ${className || ''}`}>🔑</span>,
  Activity: ({ size, className }) => <span className={`text-lg ${className || ''}`}>📈</span>
};

const { Plus, Settings, Play, Pause, MessageSquare, Users, BarChart3, AlertCircle, Trash2, Edit2, Database, Key, Activity } = SimpleIcons;

// Mock Database Layer - In production, this would be replaced with actual database calls
const mockDatabase = {
  // AI Providers table
    aiProviders: [
        {
        id: 1,
        name: 'OpenAI',
        apiKey: 'sk-...hidden',
        apiUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        isDefault: true,
        createdAt: '2025-01-15T10:00:00Z'
        }
    ],
    
    // Conversation History table
    conversations: [
        {
        id: 1,
        botId: 1,
        postId: 'abc123',
        subreddit: 'r/technology',
        type: 'comment_reply',
        userMessage: 'How do I learn Python?',
        botResponse: 'Python is a great language to start with! I recommend beginning with...',
        timestamp: '2025-08-31T14:30:00Z',
        karma: 5,
        parentId: null
        },
        {
        id: 2,
        botId: 1,
        postId: 'def456',
        subreddit: 'r/programming',
        type: 'post',
        userMessage: null,
        botResponse: 'Here are 5 essential coding principles every developer should know...',
        timestamp: '2025-08-31T12:15:00Z',
        karma: 23,
        parentId: null
        }
    ],
    
    // Analytics table
    analytics: [
        {
        id: 1,
        botId: 1,
        date: '2025-08-31',
        posts: 3,
        comments: 12,
        karma: 45,
        upvotes: 67,
        downvotes: 22,
        responseTime: 180 // seconds
        },
        {
        id: 2,
        botId: 2,
        date: '2025-08-31',
        posts: 0,
        comments: 0,
        karma: 0,
        upvotes: 0,
        downvotes: 0,
        responseTime: 0
        }
    ]
    };

    const RedditBotDashboard = () => {
    const [activeTab, setActiveTab] = useState('bots');
    const [aiProviders, setAiProviders] = useState(mockDatabase.aiProviders);
    const [conversations, setConversations] = useState(mockDatabase.conversations);
    const [analytics, setAnalytics] = useState(mockDatabase.analytics);
    const [showProviderForm, setShowProviderForm] = useState(false);
    const [newProvider, setNewProvider] = useState({
        name: '',
        apiKey: '',
        apiUrl: '',
        model: '',
        isDefault: false
    });
    
    const [bots, setBots] = useState([
        {
        id: 1,
        name: 'TechBot',
        username: 'u/TechBotAI',
        status: 'active',
        subreddits: ['r/technology', 'r/programming'],
        lastActive: '2 hours ago',
        postsToday: 3,
        commentsToday: 12,
        karma: 1247,
        instructions: 'Focus on helpful tech advice and programming tips. Be friendly and educational.',
        autoResponse: true,
        responseDelay: '2-5 minutes',
        aiProviderId: 1
        },
        {
        id: 2,
        name: 'NewsBot',
        username: 'u/NewsUpdateBot',
        status: 'paused',
        subreddits: ['r/worldnews', 'r/news'],
        lastActive: '1 day ago',
        postsToday: 0,
        commentsToday: 0,
        karma: 892,
        instructions: 'Share breaking news and provide factual summaries. Avoid political bias.',
        autoResponse: false,
        responseDelay: '5-10 minutes',
        aiProviderId: 1
        }
    ]);

    const [showBotForm, setShowBotForm] = useState(false);
    const [editingBot, setEditingBot] = useState(null);
    const [newBot, setNewBot] = useState({
        name: '',
        username: '',
        subreddits: '',
        instructions: '',
        autoResponse: true,
        responseDelay: '2-5 minutes',
        aiProviderId: 1
    });

    const toggleBotStatus = (botId) => {
        setBots(bots.map(bot => 
        bot.id === botId 
            ? { ...bot, status: bot.status === 'active' ? 'paused' : 'active' }
            : bot
        ));
    };

    const handleCreateProvider = () => {
        if (newProvider.name && newProvider.apiKey) {
        const provider = {
            id: Date.now(),
            ...newProvider,
            createdAt: new Date().toISOString()
        };
        
        // If this is set as default, unset others
        if (newProvider.isDefault) {
            setAiProviders(prev => prev.map(p => ({ ...p, isDefault: false })));
        }
        
        setAiProviders([...aiProviders, provider]);
        setNewProvider({ name: '', apiKey: '', apiUrl: '', model: '', isDefault: false });
        setShowProviderForm(false);
        }
    };

    const deleteProvider = (providerId) => {
        setAiProviders(aiProviders.filter(p => p.id !== providerId));
    };

    const setDefaultProvider = (providerId) => {
        setAiProviders(aiProviders.map(p => ({
        ...p,
        isDefault: p.id === providerId
        })));
    };

    const deleteBot = (botId) => {
        setBots(bots.filter(bot => bot.id !== botId));
    };

    const handleCreateBot = () => {
        if (newBot.name && newBot.username && newBot.subreddits) {
        const bot = {
            id: Date.now(),
            name: newBot.name,
            username: newBot.username,
            status: 'paused',
            subreddits: newBot.subreddits.split(',').map(s => s.trim()),
            lastActive: 'Never',
            postsToday: 0,
            commentsToday: 0,
            karma: 0,
            instructions: newBot.instructions,
            autoResponse: newBot.autoResponse,
            responseDelay: newBot.responseDelay,
            aiProviderId: newBot.aiProviderId
        };
        
        if (editingBot) {
            setBots(bots.map(b => b.id === editingBot.id ? { ...bot, id: editingBot.id } : b));
        } else {
            setBots([...bots, bot]);
        }
        
        setNewBot({ name: '', username: '', subreddits: '', instructions: '', autoResponse: true, responseDelay: '2-5 minutes', aiProviderId: 1 });
        setShowBotForm(false);
        setEditingBot(null);
        }
    };

    const startEdit = (bot) => {
        setEditingBot(bot);
        setNewBot({
        name: bot.name,
        username: bot.username,
        subreddits: bot.subreddits.join(', '),
        instructions: bot.instructions,
        autoResponse: bot.autoResponse,
        responseDelay: bot.responseDelay,
        aiProviderId: bot.aiProviderId
        });
        setShowBotForm(true);
    };

    const BotCard = ({ bot }) => (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                <p className="text-sm text-gray-600">{bot.username}</p>
            </div>
            </div>
            <div className="flex space-x-2">
            <button
                onClick={() => startEdit(bot)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => toggleBotStatus(bot.id)}
                className={`p-2 rounded-lg ${bot.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
            >
                {bot.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
                onClick={() => deleteBot(bot.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
                <Trash2 size={16} />
            </button>
            </div>
        </div>

        <div className="space-y-3">
            <div>
            <p className="text-sm text-gray-600 mb-1">Active in:</p>
            <div className="flex flex-wrap gap-1">
                {bot.subreddits.map((sub, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">{sub}</span>
                ))}
            </div>
            </div>

            <div>
            <p className="text-sm text-gray-600 mb-1">AI Provider:</p>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">
                {aiProviders.find(p => p.id === bot.aiProviderId)?.name || 'Unknown'}
            </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
                <p className="text-gray-600">Posts Today</p>
                <p className="font-semibold">{bot.postsToday}</p>
            </div>
            <div>
                <p className="text-gray-600">Comments</p>
                <p className="font-semibold">{bot.commentsToday}</p>
            </div>
            <div>
                <p className="text-gray-600">Karma</p>
                <p className="font-semibold">{bot.karma}</p>
            </div>
            </div>

            <div>
            <p className="text-sm text-gray-600 mb-2">Instructions:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{bot.instructions || 'No instructions set'}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
            <span className={`px-2 py-1 rounded-full ${bot.autoResponse ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                Auto-response: {bot.autoResponse ? 'ON' : 'OFF'}
            </span>
            <span className="text-gray-600">Last active: {bot.lastActive}</span>
            </div>
        </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                <MessageSquare className="text-orange-600" size={28} />
                <h1 className="text-xl font-bold text-gray-900">Reddit Bot Manager</h1>
                </div>
                <button
                onClick={() => setShowBotForm(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                >
                <Plus size={16} />
                <span>Add Bot</span>
                </button>
            </div>
            </div>
        </div>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="flex space-x-8 border-b border-gray-200">
            {[
                { id: 'bots', label: 'Bots', icon: Users },
                { id: 'conversations', label: 'Conversations', icon: MessageSquare },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'providers', label: 'AI Providers', icon: Key },
                { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                </button>
            ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'bots' && (
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Total Bots</p>
                        <p className="text-2xl font-bold text-gray-900">{bots.length}</p>
                    </div>
                    <Users className="text-blue-500" size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Active Bots</p>
                        <p className="text-2xl font-bold text-green-600">{bots.filter(b => b.status === 'active').length}</p>
                    </div>
                    <Play className="text-green-500" size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Posts Today</p>
                        <p className="text-2xl font-bold text-orange-600">{bots.reduce((sum, bot) => sum + bot.postsToday, 0)}</p>
                    </div>
                    <MessageSquare className="text-orange-500" size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Total Karma</p>
                        <p className="text-2xl font-bold text-purple-600">{bots.reduce((sum, bot) => sum + bot.karma, 0)}</p>
                    </div>
                    <BarChart3 className="text-purple-500" size={24} />
                    </div>
                </div>
                </div>

                {/* Bot Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bots.map(bot => (
                    <BotCard key={bot.id} bot={bot} />
                ))}
                </div>
            </div>
            )}

            {activeTab === 'conversations' && (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conversation History</h2>
                <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Bots</option>
                    {bots.map(bot => (
                    <option key={bot.id} value={bot.id}>{bot.name}</option>
                    ))}
                </select>
                </div>
                
                <div className="space-y-4">
                {conversations.map(conv => {
                    const bot = bots.find(b => b.id === conv.botId);
                    return (
                    <div key={conv.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <MessageSquare size={16} className="text-orange-600" />
                            </div>
                            <div>
                            <p className="font-medium text-gray-900">{bot?.name}</p>
                            <p className="text-sm text-gray-600">{conv.subreddit} • {conv.type.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">{new Date(conv.timestamp).toLocaleString()}</p>
                            <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-green-600">↑ {conv.karma}</span>
                            </div>
                        </div>
                        </div>
                        
                        {conv.userMessage && (
                        <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">User:</p>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded">{conv.userMessage}</p>
                        </div>
                        )}
                        
                        <div>
                        <p className="text-sm text-gray-600 mb-1">Bot Response:</p>
                        <p className="text-gray-800 bg-blue-50 p-3 rounded">{conv.botResponse}</p>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
            )}

            {activeTab === 'analytics' && (
            <div className="space-y-6">
                <h2 className="text-lg font-semibold">Bot Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Interactions</h3>
                    <p className="text-2xl font-bold text-blue-600">
                    {analytics.reduce((sum, a) => sum + a.posts + a.comments, 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Average Response Time</h3>
                    <p className="text-2xl font-bold text-green-600">
                    {Math.round(analytics.reduce((sum, a) => sum + a.responseTime, 0) / analytics.length)}s
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Upvotes</h3>
                    <p className="text-2xl font-bold text-orange-600">
                    {analytics.reduce((sum, a) => sum + a.upvotes, 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Engagement Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">
                    {Math.round((analytics.reduce((sum, a) => sum + a.upvotes, 0) / Math.max(analytics.reduce((sum, a) => sum + a.posts + a.comments, 0), 1)) * 100)}%
                    </p>
                </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Bot Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="border-b">
                        <th className="text-left py-2">Bot</th>
                        <th className="text-left py-2">Posts</th>
                        <th className="text-left py-2">Comments</th>
                        <th className="text-left py-2">Karma</th>
                        <th className="text-left py-2">Avg Response</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.map(analytic => {
                        const bot = bots.find(b => b.id === analytic.botId);
                        return (
                            <tr key={analytic.id} className="border-b">
                            <td className="py-2">{bot?.name || 'Unknown'}</td>
                            <td className="py-2">{analytic.posts}</td>
                            <td className="py-2">{analytic.comments}</td>
                            <td className="py-2">{analytic.karma}</td>
                            <td className="py-2">{analytic.responseTime}s</td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
                </div>
            </div>
            )}

            {activeTab === 'providers' && (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">AI Providers</h2>
                <button
                    onClick={() => setShowProviderForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus size={16} />
                    <span>Add Provider</span>
                </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {aiProviders.map(provider => (
                    <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${provider.isDefault ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                            <p className="text-sm text-gray-600">{provider.model}</p>
                        </div>
                        </div>
                        <div className="flex space-x-2">
                        {!provider.isDefault && (
                            <button
                            onClick={() => setDefaultProvider(provider.id)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                            >
                            Set Default
                            </button>
                        )}
                        <button
                            onClick={() => deleteProvider(provider.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div>
                        <p className="text-sm text-gray-600">API Endpoint:</p>
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded">{provider.apiUrl || 'Default'}</p>
                        </div>
                        <div>
                        <p className="text-sm text-gray-600">API Key:</p>
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                            {provider.apiKey.substring(0, 8)}...{provider.apiKey.slice(-4)}
                        </p>
                        </div>
                        {provider.isDefault && (
                        <div className="mt-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default Provider
                            </span>
                        </div>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}

            {activeTab === 'settings' && (
            <div className="space-y-6">
                <h2 className="text-lg font-semibold">Global Settings</h2>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-md font-semibold mb-4">Reddit API Configuration</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                        <input type="text" placeholder="Your Reddit Client ID" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                        <input type="password" placeholder="Your Reddit Client Secret" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input type="text" placeholder="Reddit Username" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input type="password" placeholder="Reddit Password" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-md font-semibold mb-4">Rate Limiting & Safety</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Enable Rate Limiting Protection</label>
                        <p className="text-xs text-gray-500">Automatically throttle requests to stay within Reddit's limits</p>
                    </div>
                    <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Content Moderation</label>
                        <p className="text-xs text-gray-500">Screen bot responses before posting</p>
                    </div>
                    <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Posts Per Hour</label>
                    <input type="number" defaultValue="5" className="w-32 border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-md font-semibold mb-4">Database Configuration</h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Database className="text-green-600" size={20} />
                    <div>
                        <p className="text-sm font-medium text-green-800">Database Connected</p>
                        <p className="text-xs text-green-600">PostgreSQL - localhost:5432</p>
                    </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    View Database Schema
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>

        {/* Bot Creation/Edit Modal */}
        {showBotForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">{editingBot ? 'Edit Bot' : 'Create New Bot'}</h3>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
                    <input
                    type="text"
                    value={newBot.name}
                    onChange={(e) => setNewBot({...newBot, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., TechBot"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reddit Username</label>
                    <input
                    type="text"
                    value={newBot.username}
                    onChange={(e) => setNewBot({...newBot, username: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="u/YourBotName"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subreddits</label>
                    <input
                    type="text"
                    value={newBot.subreddits}
                    onChange={(e) => setNewBot({...newBot, subreddits: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="r/technology, r/programming"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bot Instructions</label>
                    <textarea
                    value={newBot.instructions}
                    onChange={(e) => setNewBot({...newBot, instructions: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none"
                    placeholder="Describe how your bot should behave, what topics to focus on, tone of voice, etc."
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="auto-response"
                        checked={newBot.autoResponse}
                        onChange={(e) => setNewBot({...newBot, autoResponse: e.target.checked})}
                        className="rounded"
                    />
                    <label htmlFor="auto-response" className="text-sm text-gray-700">Auto-respond to comments</label>
                    </div>
                    <select
                    value={newBot.responseDelay}
                    onChange={(e) => setNewBot({...newBot, responseDelay: e.target.value})}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                    <option>1-2 minutes</option>
                    <option>2-5 minutes</option>
                    <option>5-10 minutes</option>
                    <option>10-30 minutes</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                    <select
                    value={newBot.aiProviderId}
                    onChange={(e) => setNewBot({...newBot, aiProviderId: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                    {aiProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                        {provider.name} ({provider.model})
                        </option>
                    ))}
                    </select>
                </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={() => {
                    setShowBotForm(false);
                    setEditingBot(null);
                    setNewBot({ name: '', username: '', subreddits: '', instructions: '', autoResponse: true, responseDelay: '2-5 minutes', aiProviderId: 1 });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreateBot}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    {editingBot ? 'Update Bot' : 'Create Bot'}
                </button>
                </div>
            </div>
            </div>
        )}

        {/* AI Provider Form Modal */}
        {showProviderForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Add AI Provider</h3>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                    <input
                    type="text"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., OpenAI, Claude, Custom API"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                    type="password"
                    value={newProvider.apiKey}
                    onChange={(e) => setNewProvider({...newProvider, apiKey: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="sk-..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API URL (Optional)</label>
                    <input
                    type="url"
                    value={newProvider.apiUrl}
                    onChange={(e) => setNewProvider({...newProvider, apiUrl: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://api.openai.com/v1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                    type="text"
                    value={newProvider.model}
                    onChange={(e) => setNewProvider({...newProvider, model: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="gpt-4, claude-3-sonnet, etc."
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <input
                    type="checkbox"
                    id="is-default"
                    checked={newProvider.isDefault}
                    onChange={(e) => setNewProvider({...newProvider, isDefault: e.target.checked})}
                    className="rounded"
                    />
                    <label htmlFor="is-default" className="text-sm text-gray-700">Set as default provider</label>
                </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                <button
                    onClick={() => {
                    setShowProviderForm(false);
                    setNewProvider({ name: '', apiKey: '', apiUrl: '', model: '', isDefault: false });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreateProvider}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Add Provider
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
    };

export default RedditBotDashboard;