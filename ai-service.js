// AI Service utilities for handling API communications

class AIService {
    constructor() {
        this.baseUrl = window.location.origin;
    }
    
    async makeRequest(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Request to ${endpoint} failed:`, error);
            throw error;
        }
    }
    
    async enhanceWithGemini(prompt, imageData = null) {
        const endpoint = `${this.baseUrl}/api/gemini-vision`;
        const requestData = {
            prompt: prompt,
            image: imageData
        };
        
        return await this.makeRequest(endpoint, requestData);
    }
    
    async enhanceWithOpenAI(prompt, imageData = null) {
        const endpoint = `${this.baseUrl}/api/openai-generate`;
        const requestData = {
            prompt: prompt,
            image: imageData
        };
        
        return await this.makeRequest(endpoint, requestData);
    }
    
    async enhancePrompt(prompt, imageData = null, useFallback = true) {
        try {
            // Try Gemini first if we have an image
            if (imageData) {
                try {
                    const geminiResult = await this.enhanceWithGemini(prompt, imageData);
                    if (geminiResult.success) {
                        return {
                            success: true,
                            enhancedPrompt: geminiResult.enhancedPrompt,
                            provider: 'Gemini',
                            rawResponse: geminiResult
                        };
                    }
                } catch (geminiError) {
                    console.warn('Gemini enhancement failed:', geminiError);
                    
                    if (!useFallback) {
                        throw geminiError;
                    }
                }
            }
            
            // Fallback to OpenAI
            const openaiResult = await this.enhanceWithOpenAI(prompt, imageData);
            
            if (openaiResult.success) {
                return {
                    success: true,
                    enhancedPrompt: openaiResult.enhancedPrompt,
                    provider: 'OpenAI',
                    rawResponse: openaiResult
                };
            }
            
            throw new Error('Both AI services failed to enhance the prompt');
            
        } catch (error) {
            console.error('Prompt enhancement failed:', error);
            return {
                success: false,
                error: error.message,
                provider: 'None'
            };
        }
    }
}

// Create global instance
window.aiService = new AIService();