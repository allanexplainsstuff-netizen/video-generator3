// Main application script
document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation and routing
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'create.html':
            initializeCreatePage();
            break;
        case 'result.html':
            initializeResultPage();
            break;
        default:
            initializeHomePage();
    }
});

function initializeHomePage() {
    // Home page specific logic
    console.log('Home page initialized');
}

function initializeCreatePage() {
    const form = document.getElementById('promptForm');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
}

function initializeResultPage() {
    // Load result from sessionStorage
    const resultData = sessionStorage.getItem('enhancementResult');
    
    if (resultData) {
        const data = JSON.parse(resultData);
        displayResult(data);
    } else {
        // No result data, redirect to create page
        window.location.href = 'create.html';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading state
    submitButton.disabled = true;
    submitText.style.display = 'none';
    loadingText.style.display = 'inline';
    errorMessage.style.display = 'none';
    
    try {
        const formData = new FormData(event.target);
        const promptText = formData.get('promptText');
        const imageFile = formData.get('imageUpload');
        
        let imageBase64 = null;
        
        if (imageFile && imageFile.size > 0) {
            // Validate image
            if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(imageFile.type)) {
                throw new Error('Unsupported image type. Please use JPEG, PNG, WebP, or GIF.');
            }
            
            if (imageFile.size > CONFIG.MAX_IMAGE_SIZE) {
                throw new Error('Image too large. Maximum size is 5MB.');
            }
            
            // Convert image to base64
            imageBase64 = await fileToBase64(imageFile);
        }
        
        // Call AI service
        const result = await enhancePrompt(promptText, imageBase64);
        
        // Store result in sessionStorage
        sessionStorage.setItem('enhancementResult', JSON.stringify(result));
        
        // Redirect to result page
        window.location.href = 'result.html';
        
    } catch (error) {
        console.error('Error enhancing prompt:', error);
        errorMessage.textContent = error.message || 'An error occurred while enhancing your prompt.';
        errorMessage.style.display = 'block';
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        submitText.style.display = 'inline';
        loadingText.style.display = 'none';
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Extract base64 data without the data URL prefix
            const base64 = e.target.result.split(',')[1];
            resolve(base64);
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function enhancePrompt(promptText, imageBase64) {
    try {
        // Try Gemini first if image is provided
        if (imageBase64) {
            try {
                const geminiResult = await callGeminiVision(promptText, imageBase64);
                if (geminiResult.success) {
                    return {
                        originalPrompt: promptText,
                        enhancedPrompt: geminiResult.enhancedPrompt,
                        provider: 'Gemini',
                        timestamp: new Date().toISOString()
                    };
                }
            } catch (geminiError) {
                console.warn('Gemini failed, trying fallback:', geminiError);
                
                if (!CONFIG.FALLBACK_ENABLED) {
                    throw new Error('Gemini service unavailable and fallback is disabled.');
                }
            }
        }
        
        // Fallback to OpenAI
        const openaiResult = await callOpenAIGenerate(promptText, imageBase64);
        
        if (openaiResult.success) {
            return {
                originalPrompt: promptText,
                enhancedPrompt: openaiResult.enhancedPrompt,
                provider: 'OpenAI (Fallback)',
                timestamp: new Date().toISOString()
            };
        }
        
        throw new Error('Both AI services failed to enhance the prompt.');
        
    } catch (error) {
        console.error('Error in enhancePrompt:', error);
        throw error;
    }
}

async function callGeminiVision(promptText, imageBase64) {
    const response = await fetch(CONFIG.API_ENDPOINTS.GEMINI_VISION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: promptText,
            image: imageBase64
        })
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }
    
    return await response.json();
}

async function callOpenAIGenerate(promptText, imageBase64) {
    const response = await fetch(CONFIG.API_ENDPOINTS.OPENAI_GENERATE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: promptText,
            image: imageBase64
        })
    });
    
    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    return await response.json();
}

function displayResult(data) {
    document.getElementById('originalPrompt').textContent = data.originalPrompt;
    document.getElementById('enhancedPrompt').textContent = data.enhancedPrompt;
    document.getElementById('providerUsed').textContent = data.provider;
    
    // Setup copy button
    const copyButton = document.getElementById('copyButton');
    copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(data.enhancedPrompt).then(function() {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.background = 'var(--success-color)';
            
            setTimeout(function() {
                copyButton.textContent = originalText;
                copyButton.style.background = '';
            }, 2000);
        });
    });
}

// Utility functions
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}