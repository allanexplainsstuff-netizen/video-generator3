// Vercel Serverless Function for Gemini Vision API
// This runs server-side, keeping API keys secure

export default async function handler(req, res) {
    console.log('Vercel Function: Gemini Vision requested');
    
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { prompt, imageData, mimeType = 'image/jpeg' } = req.body;

        // Validate inputs
        if (!prompt || !imageData) {
            console.log('Missing required fields');
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: prompt and imageData' 
            });
        }

        console.log('Processing with prompt:', prompt);
        console.log('Image data length:', imageData.length);

        // Process the image data (remove data URL prefix)
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

        // Prepare Gemini Vision API request
        const payload = {
            contents: [{
                parts: [
                    {
                        text: `Analyze this image and the user's request. Provide a detailed cinematic scene description suitable for video generation.

USER REQUEST: "${prompt}"

RESPONSE FORMAT:
Provide a comprehensive cinematic description including:

1. SCENE ENVIRONMENT: Describe the setting, location, background elements
2. SUBJECT APPEARANCE: Detail what subjects/characters look like, their positioning, expressions
3. CAMERA ANGLE: Specify camera position (wide shot, close-up, aerial, tracking shot, etc.)
4. LIGHTING & MOOD: Describe lighting conditions, atmosphere, emotional tone
5. MOTION DESCRIPTION: Explain how elements should move in the video

Keep it cinematic and professional. Focus on visual elements that can be translated into video.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }]
        };

        console.log('Calling Gemini API with Vercel...');
        
        // Make server-side API call to Gemini using Vercel environment variables
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const sceneDescription = data.candidates[0].content.parts[0].text.trim();

        console.log('Vercel: Gemini analysis successful');
        
        return res.status(200).json({
            success: true,
            enhancedPrompt: sceneDescription,
            aiSource: 'image-vision'
        });

    } catch (error) {
        console.error('Vercel Function: Gemini error:', error);
        
        // Return error for frontend fallback
        return res.status(500).json({
            success: false,
            error: error.message,
            fallback: true
        });
    }
}