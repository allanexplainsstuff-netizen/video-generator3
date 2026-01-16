// Enhanced AI Service with OpenAI and Gemini Vision integration

class EnhancedAIService {
    constructor() {
        this.isProcessing = false;
        this.currentJob = null;
        this.openaiCache = new Map();
        this.geminiService = new GeminiVisionService(); // Add Gemini service
        this.aiSource = 'text-only'; // Track which AI was used
    }

    async enhancePromptWithOpenAI(userPrompt) {
        console.log('EnhancedAI Service: Enhancing prompt with OpenAI', userPrompt);
        
        const cacheKey = userPrompt.toLowerCase().trim();
        if (this.openaiCache.has(cacheKey)) {
            console.log('EnhancedAI Service: Using cached result');
            return this.openaiCache.get(cacheKey);
        }
        
        const apiKey = window.CONFIG.getApiKey();
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const systemPrompt = `You are a cinematic video prompt enhancer. Transform the user's basic description into a detailed, structured video prompt that includes:

1. STYLE: Cinematic style (e.g., cinematic, documentary, animated, etc.)
2. MOOD: Emotional tone (e.g., dramatic, peaceful, exciting, mysterious)
3. MOTION: Type of movement (e.g., slow pan, fast cuts, smooth tracking, static)
4. LIGHTING: Lighting description (e.g., golden hour, moody lighting, bright daylight, neon)
5. CAMERA: Camera work (e.g., aerial shot, close-up, wide angle, tracking shot)
6. DETAILS: Additional visual details to enhance the scene

Keep the response concise but comprehensive. Format as a single paragraph that flows naturally.`;

        try {
            const response = await fetch(window.CONFIG.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: window.CONFIG.OPENAI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const enhancedPrompt = data.choices[0].message.content.trim();
            
            this.openaiCache.set(cacheKey, enhancedPrompt);
            
            console.log('EnhancedAI Service: Prompt enhanced successfully', enhancedPrompt);
            return enhancedPrompt;

        } catch (error) {
            console.error('EnhancedAI Service: OpenAI enhancement failed', error);
            return this.basicPromptEnhancement(userPrompt);
        }
    }

    basicPromptEnhancement(userPrompt) {
        const enhancements = [
            'cinematic style',
            'professional lighting',
            'smooth camera movement',
            'high quality'
        ];
        
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        return `${userPrompt}, ${randomEnhancement}`;
    }

    // MAIN DECISION LOGIC: Choose between Gemini Vision and OpenAI
    async generateEnhancedVideoAI(userPrompt, images = []) {
        console.log('EnhancedAI Service: Starting enhanced video generation', { 
            userPrompt, 
            imageCount: images.length,
            hasImages: images.length > 0 
        });
        
        this.isProcessing = true;
        
        try {
            let enhancedPrompt;
            let aiSource;
            
            // DECISION POINT: Check if images were uploaded
            if (images.length > 0) {
                console.log('Using GEMINI VISION for image + text analysis');
                aiSource = 'image-vision';
                
                try {
                    // Use Gemini Vision for image + text analysis
                    enhancedPrompt = await this.geminiService.analyzeImageWithText(images[0], userPrompt);
                } catch (geminiError) {
                    console.warn('Gemini Vision failed, falling back to OpenAI:', geminiError);
                    // Fallback to OpenAI text enhancement
                    enhancedPrompt = await this.enhancePromptWithOpenAI(userPrompt);
                    aiSource = 'text-only-fallback';
                }
            } else {
                console.log('Using OPENAI for text-only enhancement');
                aiSource = 'text-only';
                
                // Use OpenAI for text-only enhancement (existing flow)
                enhancedPrompt = await this.enhancePromptWithOpenAI(userPrompt);
            }

            const generationData = {
                originalPrompt: userPrompt,
                enhancedPrompt: enhancedPrompt,
                images: images,
                aiSource: aiSource, // Track which AI was used
                timestamp: new Date().toISOString()
            };
            
            console.log(`EnhancedAI Service: Using ${aiSource} enhanced prompt`, enhancedPrompt);
            
            return await this.simulateVideoGeneration(generationData);
            
        } catch (error) {
            console.error('EnhancedAI Service: Generation failed', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    async simulateVideoGeneration(generationData) {
        return new Promise((resolve, reject) => {
            const processingTime = 3000 + Math.random() * 3000;
            
            setTimeout(() => {
                if (Math.random() < 0.05) {
                    reject(new Error('Video generation failed: Network timeout'));
                    return;
                }

                const mockResponse = {
                    success: true,
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    videoDetails: {
                        duration: '30 seconds',
                        resolution: '1920x1080',
                        format: 'MP4',
                        fileSize: '15.2 MB',
                        createdAt: new Date().toISOString()
                    },
                    promptData: {
                        originalPrompt: generationData.originalPrompt,
                        enhancedPrompt: generationData.enhancedPrompt,
                        aiSource: generationData.aiSource, // Include AI source
                        processingTime: Math.round(processingTime),
                        model: generationData.aiSource === 'image-vision' ? 'gemini-vision-pro' : 'openai-gpt'
                    }
                };

                console.log(`EnhancedAI Service: ${generationData.aiSource} video generation completed`, mockResponse);
                resolve(mockResponse);
            }, processingTime);
        });
    }

    cancelJob() {
        this.isProcessing = false;
        this.currentJob = null;
        console.log('EnhancedAI Service: Current job cancelled');
    }

    getStatus() {
        return {
            isProcessing: this.isProcessing,
            currentJob: this.currentJob
        };
    }
}

window.EnhancedAIService = EnhancedAIService;