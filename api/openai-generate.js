import OpenAI from 'openai';

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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: apiKey
    });

    let enhancedPrompt;
    
    if (image) {
      // Handle image + text prompt using GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating enhanced video generation prompts. Analyze images and create detailed, effective prompts for AI video generation.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and create an enhanced video generation prompt.
                
                User's original prompt: "${prompt}"
                
                Please provide a detailed video generation prompt that:
                1. Describes the visual elements in the image
                2. Suggests motion, transitions, and temporal elements
                3. Enhances the user's original prompt with visual details
                4. Includes technical aspects (lighting, style, mood, camera movement)
                
                Return only the enhanced prompt text, nothing else.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      enhancedPrompt = response.choices[0].message.content;
    } else {
      // Handle text-only prompt using GPT-3.5 Turbo
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at enhancing video generation prompts. Make prompts more detailed, descriptive, and effective for AI video generation.'
          },
          {
            role: 'user',
            content: `Enhance this video generation prompt to be more detailed and effective:
            
            Original prompt: "${prompt}"
            
            Please improve it by adding:
            1. Visual details and descriptions
            2. Motion and temporal elements
            3. Style and aesthetic guidance
            4. Technical details (lighting, camera, mood)
            
            Return only the enhanced prompt text, nothing else.`
          }
        ],
        max_tokens: 500
      });

      enhancedPrompt = response.choices[0].message.content;
    }

    return res.status(200).json({
      success: true,
      enhancedPrompt: enhancedPrompt.trim(),
      provider: 'OpenAI'
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to enhance prompt with OpenAI',
      details: error.message 
    });
  }
}