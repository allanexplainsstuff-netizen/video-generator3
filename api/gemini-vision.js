import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { prompt, image } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini API key not configured' 
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    let result;
    
    if (image) {
      // Handle image + text prompt
      const imagePart = {
        inlineData: {
          data: image,
          mimeType: 'image/png' // Assume PNG, could be improved with actual type
        }
      };

      const enhancedPrompt = `
        Analyze this image and create an enhanced video generation prompt.
        
        User's original prompt: "${prompt}"
        
        Please provide a detailed video generation prompt that:
        1. Describes the visual elements in the image
        2. Suggests motion, transitions, and temporal elements
        3. Enhances the user's original prompt with visual details
        4. Includes technical aspects (lighting, style, mood, camera movement)
        
        Return only the enhanced prompt text, nothing else.
      `;

      result = await model.generateContent([enhancedPrompt, imagePart]);
    } else {
      // Handle text-only prompt
      const enhancedPrompt = `
        Enhance this video generation prompt to be more detailed and effective:
        
        Original prompt: "${prompt}"
        
        Please improve it by adding:
        1. Visual details and descriptions
        2. Motion and temporal elements
        3. Style and aesthetic guidance
        4. Technical details (lighting, camera, mood)
        
        Return only the enhanced prompt text, nothing else.
      `;

      const textModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      result = await textModel.generateContent(enhancedPrompt);
    }

    const response = await result.response;
    const enhancedPrompt = response.text();

    return res.status(200).json({
      success: true,
      enhancedPrompt: enhancedPrompt.trim(),
      provider: 'Gemini'
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to enhance prompt with Gemini',
      details: error.message 
    });
  }
}