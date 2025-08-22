/**
 * Smart File Picker for Intelligent File Suggestions
 * Integrates context analysis and file scoring for intelligent autocomplete
 */
class SmartFilePicker {
    constructor() {
        this.contextAnalyzer = new ContextAnalyzer();
        this.fileScorer = new FileScorer();
        
        // Configuration options
        this.config = {
            minRelevanceScore: 30, // Minimum score to show suggestion
            maxSuggestions: 15, // Maximum number of suggestions to show
            enableLearning: true, // Enable usage learning
            showScoreDebug: false, // Show scores in UI (for debugging)
            groupByCategory: true, // Group suggestions by category
            highlightMatches: true // Highlight matching keywords in UI
        };
        
        // Category definitions for grouping
        this.categories = {
            'high': { name: 'High Relevance', icon: '🔥', minScore: 80 },
            'medium': { name: 'Medium Relevance', icon: '⭐', minScore: 50 },
            'low': { name: 'Low Relevance', icon: '💡', minScore: 30 }
        };
        
        // Cache for performance
        this.cache = new Map();
        this.cacheTimeout = 5000; // 5 seconds
    }
    
    /**
     * Get intelligent file suggestions based on context
     * @param {string} textBeforeAt - Text before @ symbol
     * @param {Array} allFiles - Array of all available files
     * @returns {Promise<Object>} Suggestion result with categorized files
     */
    async getIntelligentSuggestions(textBeforeAt, allFiles) {
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(textBeforeAt, allFiles.length);
            const cached = this.getCachedResult(cacheKey);
            if (cached) {
                return cached;
            }
            
            // Analyze context
            const context = this.contextAnalyzer.analyzeContext(textBeforeAt);
            
            // Score all files
            const scoredFiles = await this.scoreAllFiles(allFiles, context);
            
            // Filter and sort suggestions
            const filteredSuggestions = this.filterSuggestions(scoredFiles);
            
            // Group suggestions by category
            const categorizedSuggestions = this.categorizeSuggestions(filteredSuggestions);
            
            // Prepare final result
            const result = {
                context: context,
                suggestions: categorizedSuggestions,
                totalCount: filteredSuggestions.length,
                hasIntelligentMatches: filteredSuggestions.length > 0,
                fallbackToAll: filteredSuggestions.length === 0
            };
            
            // Cache result
            this.setCachedResult(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('Error getting intelligent suggestions:', error);
            return this.getFallbackSuggestions(allFiles);
        }
    }
    
    /**
     * Score all files against the context
     * @param {Array} allFiles - Array of all files
     * @param {Object} context - Context analysis result
     * @returns {Promise<Array>} Array of scored files
     */
    async scoreAllFiles(allFiles, context) {
        const scoredFiles = [];
        
        // Process files in batches for better performance
        const batchSize = 50;
        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            
            const batchResults = batch.map(file => {
                return this.fileScorer.scoreFile(file, context);
            });
            
            scoredFiles.push(...batchResults);
            
            // Allow UI to remain responsive
            if (i + batchSize < allFiles.length) {
                await this.sleep(1);
            }
        }
        
        return scoredFiles;
    }
    
    /**
     * Filter suggestions based on minimum score and limits
     * @param {Array} scoredFiles - Array of scored files
     * @returns {Array} Filtered suggestions
     */
    filterSuggestions(scoredFiles) {
        return scoredFiles
            .filter(result => result.totalScore >= this.config.minRelevanceScore)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, this.config.maxSuggestions);
    }
    
    /**
     * Categorize suggestions by relevance level
     * @param {Array} suggestions - Filtered suggestions
     * @returns {Object} Categorized suggestions
     */
    categorizeSuggestions(suggestions) {
        if (!this.config.groupByCategory) {
            return { all: suggestions };
        }
        
        const categorized = {
            high: [],
            medium: [],
            low: []
        };
        
        suggestions.forEach(suggestion => {
            const score = suggestion.totalScore;
            
            if (score >= this.categories.high.minScore) {
                categorized.high.push(suggestion);
            } else if (score >= this.categories.medium.minScore) {
                categorized.medium.push(suggestion);
            } else {
                categorized.low.push(suggestion);
            }
        });
        
        return categorized;
    }
    
    /**
     * Get fallback suggestions when intelligent matching fails
     * @param {Array} allFiles - Array of all files
     * @returns {Object} Fallback suggestion result
     */
    getFallbackSuggestions(allFiles) {
        // Sort by common project files and recent usage
        const fallbackFiles = allFiles
            .map(file => ({
                file: file,
                totalScore: this.calculateFallbackScore(file),
                scores: { fallback: true },
                relevanceReason: 'fallback suggestion',
                matchedKeywords: []
            }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, this.config.maxSuggestions);
        
        return {
            context: this.contextAnalyzer.getDefaultContext(),
            suggestions: { all: fallbackFiles },
            totalCount: fallbackFiles.length,
            hasIntelligentMatches: false,
            fallbackToAll: true
        };
    }
    
    /**
     * Calculate fallback score for files when no context is available
     * @param {Object} file - File object
     * @returns {number} Fallback score
     */
    calculateFallbackScore(file) {
        let score = 0;
        
        // Bonus for common project files
        const commonFiles = ['package.json', 'README.md', 'index.js', 'main.js', 'app.js'];
        if (commonFiles.some(common => file.name.toLowerCase().includes(common.toLowerCase()))) {
            score += 50;
        }
        
        // Bonus for recent usage
        score += this.fileScorer.calculateUsageScore(file);
        
        // Bonus for shorter paths (likely more important files)
        const pathDepth = file.path.split('/').length;
        score += Math.max(0, 20 - pathDepth * 2);
        
        return score;
    }
    
    /**
     * Record file selection for learning
     * @param {string} textBeforeAt - Context text
     * @param {Object} selectedFile - Selected file
     * @param {Array} allSuggestions - All suggestions that were shown
     */
    recordSelection(textBeforeAt, selectedFile, allSuggestions) {
        if (!this.config.enableLearning) return;
        
        try {
            // Record usage in file scorer
            this.fileScorer.recordUsage(selectedFile.path);
            
            // Analyze what made this selection good
            const context = this.contextAnalyzer.analyzeContext(textBeforeAt);
            const selectedScore = this.fileScorer.scoreFile(selectedFile, context);
            
            // Log for future algorithm improvements
            this.logSelectionData({
                context: context,
                selectedFile: selectedFile,
                selectedScore: selectedScore,
                allSuggestions: allSuggestions,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('Error recording selection:', error);
        }
    }
    
    /**
     * Generate cache key for suggestions
     * @param {string} textBeforeAt - Context text
     * @param {number} fileCount - Number of files
     * @returns {string} Cache key
     */
    generateCacheKey(textBeforeAt, fileCount) {
        const contextHash = this.simpleHash(textBeforeAt.trim().toLowerCase());
        return `${contextHash}_${fileCount}`;
    }
    
    /**
     * Get cached result if available and not expired
     * @param {string} cacheKey - Cache key
     * @returns {Object|null} Cached result or null
     */
    getCachedResult(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        return null;
    }
    
    /**
     * Set cached result
     * @param {string} cacheKey - Cache key
     * @param {Object} result - Result to cache
     */
    setCachedResult(cacheKey, result) {
        this.cache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    
    /**
     * Simple hash function for cache keys
     * @param {string} str - String to hash
     * @returns {string} Hash value
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    /**
     * Sleep function for async processing
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Log selection data for algorithm improvement
     * @param {Object} selectionData - Selection data to log
     */
    logSelectionData(selectionData) {
        // In a real implementation, this would send data to analytics
        if (this.config.showScoreDebug) {
            console.log('Selection Data:', selectionData);
        }
    }
    
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Get statistics about suggestions
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            cacheSize: this.cache.size,
            usageStats: this.fileScorer.getUsageStats(),
            config: this.config
        };
    }
    
    /**
     * Format suggestion for display in UI
     * @param {Object} suggestion - Suggestion object
     * @returns {Object} Formatted suggestion for UI
     */
    formatSuggestionForUI(suggestion) {
        const file = suggestion.file;
        const score = suggestion.totalScore;
        const reason = suggestion.relevanceReason;
        const keywords = suggestion.matchedKeywords;
        
        return {
            path: file.path,
            name: file.name,
            type: file.type,
            score: this.config.showScoreDebug ? score : undefined,
            reason: reason,
            keywords: keywords,
            category: this.getScoreCategory(score),
            displayName: this.generateDisplayName(file, keywords)
        };
    }
    
    /**
     * Get score category for a given score
     * @param {number} score - Relevance score
     * @returns {string} Category name
     */
    getScoreCategory(score) {
        if (score >= this.categories.high.minScore) return 'high';
        if (score >= this.categories.medium.minScore) return 'medium';
        return 'low';
    }
    
    /**
     * Generate display name with highlighted keywords
     * @param {Object} file - File object
     * @param {Array} keywords - Matched keywords
     * @returns {string} Display name with highlights
     */
    generateDisplayName(file, keywords) {
        if (!this.config.highlightMatches || keywords.length === 0) {
            return file.name;
        }
        
        let displayName = file.name;
        
        // Highlight matched keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            displayName = displayName.replace(regex, '<mark>$1</mark>');
        });
        
        return displayName;
    }
    
    /**
     * Debug method to analyze suggestion quality
     * @param {string} textBeforeAt - Context text
     * @param {Array} allFiles - All files
     */
    async debugSuggestions(textBeforeAt, allFiles) {
        console.group('Smart File Picker Debug');
        
        const result = await this.getIntelligentSuggestions(textBeforeAt, allFiles);
        
        console.log('Input Text:', textBeforeAt);
        console.log('Context Analysis:', result.context);
        console.log('Total Files:', allFiles.length);
        console.log('Suggestions Found:', result.totalCount);
        console.log('Has Intelligent Matches:', result.hasIntelligentMatches);
        console.log('Categorized Suggestions:', result.suggestions);
        
        if (result.suggestions.high?.length > 0) {
            console.log('Top Suggestion:', result.suggestions.high[0]);
        }
        
        console.groupEnd();
        
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartFilePicker;
}