// Configuration file - NO secrets here
const CONFIG = {
    API_ENDPOINTS: {
        GEMINI_VISION: '/api/gemini-vision',
        OPENAI_GENERATE: '/api/openai-generate'
    },
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    FALLBACK_ENABLED: true
};

// Make CONFIG available globally
window.CONFIG = CONFIG;