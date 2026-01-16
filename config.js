// Frontend Configuration for GitHub + Vercel deployment
const CONFIG = {
    // OpenAI Configuration (client-side for text-only prompts)
    OPENAI_API_KEY: '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',
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    OPENAI_MODEL: 'gpt-3.5-turbo',
    
    // Vercel serverless endpoint for Gemini Vision (server-side)
    GEMINI_SERVER_ENDPOINT: '/api/gemini-vision',
    
    // API endpoints
    getApiKey() {
        return this.OPENAI_API_KEY;
    },
    
    getGeminiServerEndpoint() {
        return this.GEMINI_SERVER_ENDPOINT;
    }
};

// Make CONFIG available globally for all scripts
window.CONFIG = CONFIG;

// Log configuration for debugging
console.log('CONFIG: GitHub + Vercel configuration loaded');
console.log('CONFIG: Vercel Gemini endpoint set to', CONFIG.GEMINI_SERVER_ENDPOINT);