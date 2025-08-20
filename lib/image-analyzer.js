#!/usr/bin/env node

/**
 * Image Analyzer Module
 * Provides image analysis capabilities for Interactive Feedback MCP
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * ImageAnalyzer Class
 * Handles image analysis and content description
 */
class ImageAnalyzer {
    constructor() {
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }

    /**
     * Analyze uploaded images and provide detailed descriptions
     * @param {Array} images - Array of image objects with base64 data
     * @returns {Promise<Array>} Array of analyzed image data
     */
    async analyzeImages(images) {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return [];
        }

        const analyzedImages = [];

        for (const image of images) {
            try {
                const analysis = await this.analyzeImage(image);
                analyzedImages.push(analysis);
            } catch (error) {
                console.error(`Error analyzing image ${image.name}:`, error);
                analyzedImages.push({
                    ...image,
                    analysis: {
                        error: `Failed to analyze image: ${error.message}`,
                        description: 'Image analysis failed',
                        colors: [],
                        objects: [],
                        text: []
                    }
                });
            }
        }

        return analyzedImages;
    }

    /**
     * Analyze a single image
     * @param {Object} image - Image object with base64 data
     * @returns {Promise<Object>} Analyzed image data
     */
    async analyzeImage(image) {
        // Extract metadata from base64
        const metadata = this.extractMetadata(image);
        
        // Perform basic image analysis
        const basicAnalysis = this.performBasicAnalysis(image);
        
        // Generate content description based on filename and context
        const contentAnalysis = this.generateContentDescription(image);
        
        return {
            ...image,
            analysis: {
                metadata,
                ...basicAnalysis,
                ...contentAnalysis,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Extract metadata from image
     * @param {Object} image - Image object
     * @returns {Object} Metadata information
     */
    extractMetadata(image) {
        const base64Data = image.base64;
        const header = base64Data.substring(0, 50);
        
        return {
            format: image.mimeType || 'unknown',
            originalSize: image.originalSize || 0,
            compressedSize: image.compressedSize || 0,
            compressionRatio: image.compressionRatio || '0',
            base64Length: base64Data.length,
            estimatedPixels: this.estimateImageDimensions(image),
            hasTransparency: this.detectTransparency(header)
        };
    }

    /**
     * Perform basic image analysis
     * @param {Object} image - Image object
     * @returns {Object} Basic analysis results
     */
    performBasicAnalysis(image) {
        const filename = image.name.toLowerCase();
        const base64Data = image.base64;
        
        // Analyze filename for content hints
        const filenameHints = this.analyzeFilename(filename);
        
        // Estimate color information from compression ratio
        const colorAnalysis = this.estimateColors(image);
        
        // Detect potential content type
        const contentType = this.detectContentType(filename, image);
        
        return {
            filenameHints,
            colorAnalysis,
            contentType,
            quality: this.assessImageQuality(image)
        };
    }

    /**
     * Generate content description based on available data
     * @param {Object} image - Image object
     * @returns {Object} Content analysis
     */
    generateContentDescription(image) {
        const filename = image.name.toLowerCase();
        const size = image.originalSize;
        
        let description = 'Image content analysis based on metadata:';
        let suggestedContent = [];
        let detectedElements = [];
        
        // Analyze filename for content clues
        if (filename.includes('logo') || filename.includes('brand')) {
            suggestedContent.push('Logo or branding element');
            detectedElements.push('Brand identity', 'Text elements', 'Geometric shapes');
        }
        
        if (filename.includes('screenshot') || filename.includes('screen')) {
            suggestedContent.push('Screenshot or screen capture');
            detectedElements.push('UI elements', 'Text content', 'Interface components');
        }
        
        if (filename.includes('photo') || filename.includes('img') || filename.includes('pic')) {
            suggestedContent.push('Photograph or image');
            detectedElements.push('Natural elements', 'People or objects', 'Realistic content');
        }
        
        if (filename.includes('chart') || filename.includes('graph') || filename.includes('data')) {
            suggestedContent.push('Chart, graph, or data visualization');
            detectedElements.push('Data points', 'Axes', 'Labels', 'Statistical information');
        }
        
        if (filename.includes('icon') || filename.includes('button')) {
            suggestedContent.push('Icon or button element');
            detectedElements.push('Simple graphics', 'Symbolic representation');
        }
        
        // Analyze size for content hints
        if (size > 500000) { // > 500KB
            detectedElements.push('High detail content', 'Complex imagery');
        } else if (size < 50000) { // < 50KB
            detectedElements.push('Simple graphics', 'Low complexity');
        }
        
        // Vietnamese filename analysis
        if (this.containsVietnamese(filename)) {
            suggestedContent.push('Vietnamese content detected');
            detectedElements.push('Vietnamese text', 'Local content');
        }
        
        return {
            description,
            suggestedContent: suggestedContent.length > 0 ? suggestedContent : ['General image content'],
            detectedElements: detectedElements.length > 0 ? detectedElements : ['Unknown elements'],
            confidence: this.calculateConfidence(suggestedContent.length, detectedElements.length),
            limitations: [
                'Analysis based on metadata and filename only',
                'Visual content analysis requires direct image processing',
                'Color and object detection limited without pixel data access'
            ]
        };
    }

    /**
     * Analyze filename for content hints
     * @param {string} filename - Image filename
     * @returns {Object} Filename analysis
     */
    analyzeFilename(filename) {
        const hints = {
            language: this.detectLanguage(filename),
            contentType: this.guessContentFromFilename(filename),
            keywords: this.extractKeywords(filename)
        };
        
        return hints;
    }

    /**
     * Estimate colors from compression data
     * @param {Object} image - Image object
     * @returns {Object} Color analysis
     */
    estimateColors(image) {
        const compressionRatio = parseFloat(image.compressionRatio) || 0;
        
        let colorComplexity = 'medium';
        let estimatedPalette = [];
        
        if (compressionRatio > 80) {
            colorComplexity = 'low';
            estimatedPalette = ['Limited color palette', 'Possibly monochrome or simple graphics'];
        } else if (compressionRatio > 50) {
            colorComplexity = 'medium';
            estimatedPalette = ['Moderate color range', 'Mixed content'];
        } else {
            colorComplexity = 'high';
            estimatedPalette = ['Rich color palette', 'Complex imagery', 'Photographic content'];
        }
        
        return {
            complexity: colorComplexity,
            estimatedPalette,
            compressionEfficiency: compressionRatio > 70 ? 'high' : compressionRatio > 30 ? 'medium' : 'low'
        };
    }

    /**
     * Detect content type from filename and metadata
     * @param {string} filename - Image filename
     * @param {Object} image - Image object
     * @returns {string} Detected content type
     */
    detectContentType(filename, image) {
        const name = filename.toLowerCase();
        
        if (name.includes('logo') || name.includes('brand')) return 'logo';
        if (name.includes('screenshot') || name.includes('screen')) return 'screenshot';
        if (name.includes('photo') || name.includes('img')) return 'photograph';
        if (name.includes('chart') || name.includes('graph')) return 'chart';
        if (name.includes('icon') || name.includes('button')) return 'icon';
        if (name.includes('banner') || name.includes('header')) return 'banner';
        if (name.includes('avatar') || name.includes('profile')) return 'avatar';
        
        return 'general';
    }

    /**
     * Assess image quality based on compression
     * @param {Object} image - Image object
     * @returns {string} Quality assessment
     */
    assessImageQuality(image) {
        const compressionRatio = parseFloat(image.compressionRatio) || 0;
        const originalSize = image.originalSize || 0;
        
        if (originalSize > 1000000 && compressionRatio < 30) {
            return 'high';
        } else if (originalSize > 100000 && compressionRatio < 60) {
            return 'medium';
        } else {
            return 'compressed';
        }
    }

    /**
     * Detect language from filename
     * @param {string} filename - Image filename
     * @returns {string} Detected language
     */
    detectLanguage(filename) {
        if (this.containsVietnamese(filename)) {
            return 'vietnamese';
        }
        if (/[a-zA-Z]/.test(filename)) {
            return 'english';
        }
        return 'unknown';
    }

    /**
     * Check if text contains Vietnamese characters
     * @param {string} text - Text to check
     * @returns {boolean} True if contains Vietnamese
     */
    containsVietnamese(text) {
        const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        return vietnameseRegex.test(text);
    }

    /**
     * Guess content type from filename
     * @param {string} filename - Image filename
     * @returns {string} Guessed content type
     */
    guessContentFromFilename(filename) {
        const contentKeywords = {
            'ui': ['button', 'menu', 'interface', 'ui', 'gui'],
            'gaming': ['game', 'player', 'character', 'level'],
            'business': ['chart', 'report', 'data', 'analytics'],
            'social': ['profile', 'avatar', 'social', 'post'],
            'web': ['website', 'web', 'page', 'site'],
            'mobile': ['mobile', 'app', 'phone', 'android', 'ios']
        };
        
        for (const [category, keywords] of Object.entries(contentKeywords)) {
            if (keywords.some(keyword => filename.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    /**
     * Extract keywords from filename
     * @param {string} filename - Image filename
     * @returns {Array} Extracted keywords
     */
    extractKeywords(filename) {
        // Remove file extension and split by common separators
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        const keywords = nameWithoutExt.split(/[\s\-_\.]+/).filter(word => word.length > 2);
        
        return keywords;
    }

    /**
     * Estimate image dimensions from base64 size
     * @param {Object} image - Image object
     * @returns {Object} Estimated dimensions
     */
    estimateImageDimensions(image) {
        const base64Size = image.base64.length;
        const estimatedBytes = (base64Size * 3) / 4;
        
        // Rough estimation based on typical compression
        const estimatedPixels = Math.sqrt(estimatedBytes / 3); // Assuming 3 bytes per pixel
        
        return {
            estimatedPixels: Math.round(estimatedPixels),
            estimatedDimensions: `~${Math.round(estimatedPixels)}x${Math.round(estimatedPixels)} (estimated)`
        };
    }

    /**
     * Detect transparency from base64 header
     * @param {string} header - Base64 header
     * @returns {boolean} True if transparency detected
     */
    detectTransparency(header) {
        // PNG files typically support transparency
        return header.includes('data:image/png');
    }

    /**
     * Calculate confidence score for analysis
     * @param {number} contentClues - Number of content clues found
     * @param {number} elementClues - Number of element clues found
     * @returns {string} Confidence level
     */
    calculateConfidence(contentClues, elementClues) {
        const totalClues = contentClues + elementClues;
        
        if (totalClues >= 4) return 'high';
        if (totalClues >= 2) return 'medium';
        return 'low';
    }

    /**
     * Generate summary report for all analyzed images
     * @param {Array} analyzedImages - Array of analyzed images
     * @returns {Object} Summary report
     */
    generateSummaryReport(analyzedImages) {
        if (!analyzedImages || analyzedImages.length === 0) {
            return {
                totalImages: 0,
                summary: 'No images to analyze'
            };
        }

        const totalSize = analyzedImages.reduce((sum, img) => sum + (img.originalSize || 0), 0);
        const totalCompressedSize = analyzedImages.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
        const avgCompressionRatio = analyzedImages.reduce((sum, img) => sum + parseFloat(img.compressionRatio || 0), 0) / analyzedImages.length;
        
        const contentTypes = analyzedImages.map(img => img.analysis?.contentType || 'unknown');
        const uniqueContentTypes = [...new Set(contentTypes)];
        
        const languages = analyzedImages.map(img => img.analysis?.filenameHints?.language || 'unknown');
        const uniqueLanguages = [...new Set(languages)];
        
        return {
            totalImages: analyzedImages.length,
            totalOriginalSize: totalSize,
            totalCompressedSize: totalCompressedSize,
            averageCompressionRatio: avgCompressionRatio.toFixed(1) + '%',
            contentTypes: uniqueContentTypes,
            languages: uniqueLanguages,
            summary: `Analyzed ${analyzedImages.length} image(s) with ${uniqueContentTypes.length} different content type(s)`,
            analysisLimitations: [
                'Analysis based on metadata, filename, and compression data only',
                'Visual content analysis requires direct pixel access',
                'Color and object detection limited without image processing libraries'
            ]
        };
    }
}

module.exports = ImageAnalyzer;