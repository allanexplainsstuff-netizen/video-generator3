// Gemini-specific service utilities

class GeminiService {
    constructor() {
        this.endpoint = '/api/gemini-vision';
    }
    
    async analyzeImage(imageBase64, prompt) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageBase64,
                    prompt: prompt
                })
            });
            
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Gemini analysis failed');
            }
            
            return result;
        } catch (error) {
            console.error('Gemini service error:', error);
            throw error;
        }
    }
    
    async generateVideoPrompt(imageBase64, userPrompt) {
        const enhancedPrompt = `
        Analyze this image and create an enhanced video generation prompt.
        
        User's original prompt: "${userPrompt}"
        
        Please provide:
        1. A detailed description of the image content
        2. Suggestions for video motion and transitions
        3. Enhanced prompt that combines the image analysis with the user's vision
        4. Technical details for video generation (style, mood, lighting, etc.)
        
        Return only the enhanced video prompt, nothing else.
        `;
        
        const result = await this.analyzeImage(imageBase64, enhancedPrompt);
        return result.enhancedPrompt;
    }
}

// Create global instance
window.geminiService = new GeminiService();