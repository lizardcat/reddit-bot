// backend/src/services/AIService.js
const axios = require('axios');

class AIService {
    constructor(provider, apiKey, model = null, apiUrl = null) {
        this.provider = provider.toLowerCase();
        this.apiKey = apiKey;
        this.model = model;
        this.apiUrl = apiUrl;
        
        // Default configurations
        this.configs = {
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                model: model || 'gpt-4',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            },
            claude: {
                url: 'https://api.anthropic.com/v1/messages',
                model: model || 'claude-3-sonnet-20240229',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
            }
        };
    }

    async generateResponse(prompt, context = '', maxTokens = 500) {
        try {
            switch (this.provider) {
                case 'openai':
                    return await this.generateOpenAIResponse(prompt, context, maxTokens);
                case 'claude':
                    return await this.generateClaudeResponse(prompt, context, maxTokens);
                default:
                    throw new Error(`Unsupported AI provider: ${this.provider}`);
            }
        } catch (error) {
            console.error(`AI generation failed (${this.provider}):`, error.response?.data || error.message);
            throw error;
        }
    }

    async generateOpenAIResponse(prompt, context, maxTokens) {
        const config = this.configs.openai;
        
        const messages = [
            {
                role: 'system',
                content: `You are a helpful Reddit bot. ${context || 'Respond naturally and helpfully to posts and comments.'}`
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await axios.post(config.url, {
            model: config.model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.7
        }, {
            headers: config.headers
        });

        return {
            text: response.data.choices[0].message.content,
            tokensUsed: response.data.usage.total_tokens,
            cost: this.calculateOpenAICost(response.data.usage.total_tokens)
        };
    }

    async generateClaudeResponse(prompt, context, maxTokens) {
        const config = this.configs.claude;
        
        const systemPrompt = `You are a helpful Reddit bot. ${context || 'Respond naturally and helpfully to posts and comments.'}`;

        const response = await axios.post(config.url, {
            model: config.model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        }, {
            headers: config.headers
        });

        return {
            text: response.data.content[0].text,
            tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens,
            cost: this.calculateClaudeCost(response.data.usage.input_tokens, response.data.usage.output_tokens)
        };
    }

    calculateOpenAICost(totalTokens) {
        // GPT-4 pricing (approximate, check current rates)
        const costPer1kTokens = 0.03; // $0.03 per 1K tokens
        return (totalTokens / 1000) * costPer1kTokens;
    }

    calculateClaudeCost(inputTokens, outputTokens) {
        // Claude pricing (approximate, check current rates)
        const inputCostPer1k = 0.015;
        const outputCostPer1k = 0.075;
        return (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
    }

    async testConnection() {
        try {
            const testPrompt = "Reply with 'Connection successful' if you can see this message.";
            const response = await this.generateResponse(testPrompt, '', 50);
            return {
                success: true,
                response: response.text,
                tokensUsed: response.tokensUsed
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = AIService;