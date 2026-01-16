// Load configuration and AI service
// Make sure to include config.js and ai-service.js in your HTML before script.js

// ===== AI SERVICE LAYER =====
// This layer will handle all AI-related operations and can be easily extended
// to work with real AI APIs in the future

class AIService {
    constructor() {
        this.isProcessing = false;
        this.currentJob = null;
    }

    // Mock AI video generation function - ready for real API integration
    async generateVideoAI(prompt, images = []) {
        console.log('AI Service: Starting video generation', { prompt, imageCount: images.length });
        
        // Simulate AI processing delay
        return new Promise((resolve, reject) => {
            // Simulate random processing time (3-6 seconds)
            const processingTime = 3000 + Math.random() * 3000;
            
            setTimeout(() => {
                // Simulate occasional failures (10% chance)
                if (Math.random() < 0.1) {
                    reject(new Error('AI processing failed: Network timeout'));
                    return;
                }

                // Mock successful AI response
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
                    metadata: {
                        prompt: prompt,
                        imageCount: images.length,
                        processingTime: Math.round(processingTime),
                        model: 'video-generation-v1'
                    }
                };

                console.log('AI Service: Video generation completed', mockResponse);
                resolve(mockResponse);
            }, processingTime);
        });
    }

    // Cancel current job
    cancelJob() {
        this.isProcessing = false;
        this.currentJob = null;
        console.log('AI Service: Current job cancelled');
    }

    // Get processing status
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            currentJob: this.currentJob
        };
    }
}

// ===== STATE MANAGER =====
// Centralized state management for the application

class AppState {
    constructor() {
        this.currentPrompt = '';
        this.uploadedImages = [];
        this.lastResult = null;
        this.error = null;
        this.aiService = new EnhancedAIService(); // Use Enhanced AI Service
    }

    // Set current prompt
    setPrompt(prompt) {
        this.currentPrompt = prompt.trim();
        console.log('AppState: Prompt updated', this.currentPrompt);
    }

    // Add uploaded images
    addImages(images) {
        this.uploadedImages = images;
        console.log('AppState: Images added', images.length);
    }

    // Clear state
    clearState() {
        this.currentPrompt = '';
        this.uploadedImages = [];
        this.lastResult = null;
        this.error = null;
        console.log('AppState: State cleared');
    }

    // Get current state
    getState() {
        return {
            prompt: this.currentPrompt,
            images: this.uploadedImages,
            lastResult: this.lastResult,
            error: this.error
        };
    }
}

// ===== UI CONTROLLER =====
// Handles all UI interactions and updates

class UIController {
    constructor() {
        this.elements = {};
        this.loadingSteps = [
            'Initializing AI models...',
            'Processing your description...',
            'Analyzing uploaded images...', // New step for image analysis
            'Generating video frames...',
            'Adding animations and effects...',
            'Finalizing video output...'
        ];
        this.currentStep = 0;
    }

    // Cache DOM elements
    initializeElements() {
        this.elements = {
            // Create page elements
            descriptionInput: document.getElementById('video-description'),
            dropZone: document.getElementById('drop-zone'),
            fileInput: document.getElementById('file-input'),
            imagePreview: document.getElementById('image-preview'),
            generateButton: document.getElementById('generate-button'),
            
            // Loading elements
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            spinner: document.querySelector('.spinner'),
            
            // Result page elements (if they exist)
            resultVideo: document.getElementById('result-video'),
            downloadButton: document.getElementById('download-button')
        };
    }

    // Show loading state with progressive updates
    showLoading() {
        this.currentStep = 0;
        this.elements.loadingOverlay.style.display = 'flex';
        this.updateLoadingText();
        
        // Update loading text periodically
        this.loadingInterval = setInterval(() => {
            if (this.currentStep < this.loadingSteps.length - 1) {
                this.currentStep++;
                this.updateLoadingText();
            }
        }, 800);
    }

    // Update loading text
    updateLoadingText() {
        if (this.elements.loadingText) {
            this.elements.loadingText.textContent = this.loadingSteps[this.currentStep];
        }
    }

    // Show AI source in loading
    showAILoadingSource(aiSource) {
        if (aiSource === 'image-vision') {
            this.elements.loadingText.textContent = 'Analyzing image with Gemini Vision...';
        } else if (aiSource === 'text-only') {
            this.elements.loadingText.textContent = 'Enhancing prompt with OpenAI...';
        }
    }

    // Hide loading state
    hideLoading() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        this.elements.loadingOverlay.style.display = 'none';
    }

    // Show error state
    showError(message) {
        this.hideLoading();
        
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">❌</div>
                <h3>Generation Failed</h3>
                <p>${message}</p>
                <button class="retry-button" onclick="window.app.retryGeneration()">Try Again</button>
                <button class="cancel-button" onclick="window.app.cancelGeneration()">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorOverlay.parentNode) {
                errorOverlay.remove();
            }
        }, 10000);
    }

    // Clear error state
    clearError() {
        const errorOverlay = document.querySelector('.error-overlay');
        if (errorOverlay) {
            errorOverlay.remove();
        }
    }

    // Update image preview
    updateImagePreview(images) {
        this.elements.imagePreview.innerHTML = '';
        
        images.forEach(imageSrc => {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.className = 'preview-image';
            this.elements.imagePreview.appendChild(img);
        });
    }

    // Validate inputs
    validateInputs() {
        const description = this.elements.descriptionInput.value.trim();
        
        if (!description) {
            this.showValidationError('Please enter a video description.');
            return false;
        }
        
        if (description.length < 10) {
            this.showValidationError('Description should be at least 10 characters long.');
            return false;
        }
        
        return true;
    }

    // Show validation error
    showValidationError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }
}

// ===== MAIN APPLICATION CONTROLLER =====
// Coordinates between AI service, state management, and UI

class VideoGenerationApp {
    constructor() {
        this.state = new AppState();
        this.ui = new UIController();
        this.isGenerating = false;
        // Use the enhanced AI service instead of basic AIService
        this.state.aiService = new EnhancedAIService();
    }

    // Initialize the application
    initialize() {
        console.log('VideoGenerationApp: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        
        console.log('VideoGenerationApp: Initialization complete');
    }

    // Set up event listeners
    setupEventListeners() {
        this.ui.initializeElements();
        
        // File upload handling
        if (this.ui.elements.dropZone) {
            this.setupFileUpload();
        }
        
        // Generate button handling
        if (this.ui.elements.generateButton) {
            this.ui.elements.generateButton.addEventListener('click', () => this.handleGeneration());
        }
        
        // Input validation
        if (this.ui.elements.descriptionInput) {
            this.ui.elements.descriptionInput.addEventListener('input', () => {
                this.state.setPrompt(this.ui.elements.descriptionInput.value);
            });
        }
    }

    // Set up file upload functionality
    setupFileUpload() {
        const { dropZone, fileInput } = this.ui.elements;
        
        // Click to upload
        dropZone.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#667eea';
            dropZone.style.background = '#f0f4ff';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#f9f9f9';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#f9f9f9';
            this.handleFileUpload(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    // Handle file upload
    handleFileUpload(files) {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (validFiles.length === 0) {
            this.ui.showValidationError('Please upload valid image files.');
            return;
        }
        
        const imagePromises = validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });
        
        Promise.all(imagePromises).then(images => {
            this.state.addImages(images);
            this.ui.updateImagePreview(images);
        });
    }

    // Handle video generation
    async handleGeneration() {
        if (this.isGenerating) return;
        
        // Validate inputs
        if (!this.ui.validateInputs()) return;
        
        this.isGenerating = true;
        this.ui.clearError();
        
        try {
            // Show loading state
            this.ui.showLoading();
            
            // Get current state
            const { prompt, images } = this.state.getState();
            
            console.log('VideoGenerationApp: Starting enhanced generation', { 
                prompt, 
                imageCount: images.length,
                aiType: images.length > 0 ? 'Gemini Vision' : 'OpenAI Text'
            });
            
            // Show which AI is being used
            const aiSource = images.length > 0 ? 'image-vision' : 'text-only';
            this.ui.showAILoadingSource(aiSource);
            
            // Call enhanced AI service
            const result = await this.state.aiService.generateEnhancedVideoAI(prompt, images);
            
            // Store result
            this.state.lastResult = result;
            
            // Hide loading and redirect
            this.ui.hideLoading();
            
            // Store result in sessionStorage for result page
            sessionStorage.setItem('lastGenerationResult', JSON.stringify(result));
            
            // Redirect to result page
            window.location.href = 'result.html';
            
        } catch (error) {
            console.error('VideoGenerationApp: Enhanced generation failed', error);
            this.state.error = error.message;
            this.ui.showError(error.message);
        } finally {
            this.isGenerating = false;
        }
    }

    // Retry generation
    retryGeneration() {
        this.ui.clearError();
        this.handleGeneration();
    }

    // Cancel generation
    cancelGeneration() {
        this.state.aiService.cancelJob();
        this.ui.clearError();
        this.isGenerating = false;
    }
}

// ===== RESULT PAGE HANDLER =====
// Handles the result page functionality with proper prompt display

class ResultPageHandler {
    constructor() {
        this.result = null;
    }

    initialize() {
        // Load result from sessionStorage
        const storedResult = sessionStorage.getItem('lastGenerationResult');
        
        if (storedResult) {
            this.result = JSON.parse(storedResult);
            console.log('ResultPageHandler: Loaded result', this.result);
            this.displayResult();
            this.displayPrompts();
            this.addAISourceIndicator();
        } else {
            console.log('ResultPageHandler: No result found, redirecting to create page');
            window.location.href = 'create.html';
        }
    }

    displayResult() {
        if (!this.result) return;
        
        // Update video source
        const videoElement = document.getElementById('result-video');
        const downloadButton = document.getElementById('download-button');
        
        if (videoElement && this.result.videoUrl) {
            videoElement.src = this.result.videoUrl;
        }
        
        // Enable download button immediately (no delay needed)
        if (downloadButton) {
            downloadButton.disabled = false;
            downloadButton.textContent = 'Download Video';
            downloadButton.addEventListener('click', () => this.handleDownload());
        }
        
        // Update video details
        this.updateVideoDetails();
    }

    displayPrompts() {
        if (!this.result || !this.result.promptData) {
            console.log('ResultPageHandler: No prompt data found');
            return;
        }
        
        const originalPromptEl = document.getElementById('original-prompt-text');
        const enhancedPromptEl = document.getElementById('enhanced-prompt-text');
        
        if (originalPromptEl && this.result.promptData.originalPrompt) {
            originalPromptEl.textContent = this.result.promptData.originalPrompt;
        }
        
        if (enhancedPromptEl && this.result.promptData.enhancedPrompt) {
            enhancedPromptEl.textContent = this.result.promptData.enhancedPrompt;
        }
    }

    addAISourceIndicator() {
        if (!this.result || !this.result.promptData) return;
        
        const aiSource = this.result.promptData.aiSource;
        const promptCard = document.querySelector('.prompt-card h3');
        const aiIndicator = document.getElementById('ai-source-indicator');
        
        if (promptCard) {
            if (aiSource === 'image-vision') {
                promptCard.innerHTML = '✨ Enhanced by Gemini Vision AI (Image + Text)';
            } else if (aiSource === 'text-only') {
                promptCard.innerHTML = '✨ Enhanced by OpenAI (Text Only)';
            } else if (aiSource === 'text-only-fallback') {
                promptCard.innerHTML = '✨ Enhanced by OpenAI (Fallback from Gemini)';
            }
        }
        
        // Update AI indicator styling
        if (aiIndicator) {
            aiIndicator.className = 'ai-source-indicator';
            if (aiSource === 'image-vision') {
                aiIndicator.classList.add('gemini');
                aiIndicator.textContent = '🔍 Analyzed with Gemini Vision';
            } else if (aiSource === 'text-only') {
                aiIndicator.classList.add('openai');
                aiIndicator.textContent = '📝 Enhanced with OpenAI';
            } else if (aiSource === 'text-only-fallback') {
                aiIndicator.classList.add('fallback');
                aiIndicator.textContent = '⚠️ Fallback to OpenAI (Gemini unavailable)';
            }
        }
    }

    updateVideoDetails() {
        const details = this.result.videoDetails;
        if (!details) return;
        
        let infoSection = document.querySelector('.video-info');
        if (!infoSection) {
            infoSection = document.createElement('div');
            infoSection.className = 'video-info';
            document.querySelector('.result-main').appendChild(infoSection);
        }
        
        infoSection.innerHTML = `
            <h3>Video Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${details.duration || '30 seconds'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Resolution:</span>
                    <span class="info-value">${details.resolution || '1920x1080'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Format:</span>
                    <span class="info-value">${details.format || 'MP4'}</span>
                </div>
                ${details.fileSize ? `
                <div class="info-item">
                    <span class="info-label">File Size:</span>
                    <span class="info-value">${details.fileSize}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    handleDownload() {
        // Simulate download with notification
        const notification = document.createElement('div');
        notification.className = 'download-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📥</div>
                <p>Download started!</p>
                <small>File: video-${Date.now()}.mp4</small>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// ===== GLOBAL APP INSTANCE =====
// Make app available globally for HTML onclick handlers

window.app = new VideoGenerationApp();

// ===== PAGE-SPECIFIC INITIALIZATION =====

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'create.html':
            window.app.initialize();
            break;
        case 'result.html':
            const resultHandler = new ResultPageHandler();
            resultHandler.initialize();
            break;
        default:
            // Home page or other pages
            console.log('Home page loaded');
    }
});

// ===== CSS ANIMATIONS =====
// Add required animations

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1002;
    }
    
    .error-content {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 400px;
    }
    
    .error-icon {
        font-size: 3rem;
        margin-bottom: 20px;
    }
    
    .retry-button, .cancel-button {
        margin: 10px;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .retry-button {
        background: #667eea;
        color: white;
    }
    
    .cancel-button {
        background: #ccc;
        color: #333;
    }
`;
document.head.appendChild(style);