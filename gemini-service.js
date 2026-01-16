// Updated Gemini Vision Service - Now calls Vercel serverless function

class GeminiVisionService {
    constructor() {
        this.cache = new Map();
    }

    // Convert base64 image data to clean format
    processImageData(imageData) {
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        return base64Data;
    }

    // Detect MIME type from data URL
    detectMimeType(imageData) {
        const match = imageData.match(/^data:(image\/[a-z]+);base64,/);
        return match ? match[1] : 'image/jpeg';
    }

    // Call Vercel serverless function
    async analyzeImageWithText(imageData, userPrompt) {
        console.log('Gemini Vision Service: Calling Vercel function', { 
            imageSize: imageData?.length, 
            prompt: userPrompt 
        });

        // Check cache first
        const cacheKey = `${userPrompt.toLowerCase().trim()}_${imageData?.substring(0, 100)}`;
        if (this.cache.has(cacheKey)) {
            console.log('Gemini Vision Service: Using cached result');
            return this.cache.get(cacheKey);
        }

        try {
            // Prepare server request
            const serverEndpoint = window.CONFIG.getGeminiServerEndpoint();
            const mimeType = this.detectMimeType(imageData);
            const processedImageData = this.processImageData(imageData);

            console.log('Calling Vercel endpoint:', serverEndpoint);

            // Call Vercel serverless function
            const response = await fetch(serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: userPrompt,
                    imageData: processedImageData,
                    mimeType: mimeType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                console.warn('Gemini Vision Service: Server returned fallback, will use OpenAI');
                throw new Error('Gemini unavailable - fallback to OpenAI');
            }

            // Cache successful result
            this.cache.set(cacheKey, data.enhancedPrompt);
            
            console.log('Gemini Vision Service: Vercel function completed', data.enhancedPrompt);
            return data.enhancedPrompt;

        } catch (error) {
            console.error('Gemini Vision Service: Vercel call failed', error);
            throw error; // Let caller handle fallback
        }
    }
}

window.GeminiVisionService = GeminiVisionService;