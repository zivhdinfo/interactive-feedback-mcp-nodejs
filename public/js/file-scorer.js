/**
 * File Scorer for Intelligent File Suggestions
 * Calculates relevance scores for files based on context analysis
 */
class FileScorer {
    constructor() {
        // Scoring weights for different factors
        this.weights = {
            keywordMatch: 50,
            extensionMatch: 30,
            pathRelevance: 20,
            recentUsage: 15,
            filenameLength: 5 // Bonus for shorter, more specific names
        };
        
        // File extension mappings
        this.extensionMappings = {
            'css': ['.css', '.scss', '.sass', '.less'],
            'js': ['.js', '.mjs'],
            'jsx': ['.jsx'],
            'ts': ['.ts'],
            'tsx': ['.tsx'],
            'html': ['.html', '.htm'],
            'json': ['.json'],
            'md': ['.md', '.markdown'],
            'py': ['.py'],
            'php': ['.php'],
            'sql': ['.sql'],
            'xml': ['.xml'],
            'yml': ['.yml', '.yaml'],
            'env': ['.env']
        };
        
        // Common project file patterns
        this.commonFiles = {
            config: ['package.json', 'webpack.config.js', 'vite.config.js', '.env', 'tsconfig.json'],
            docs: ['README.md', 'CHANGELOG.md', 'LICENSE'],
            entry: ['index.js', 'main.js', 'app.js', 'index.html']
        };
        
        // Usage tracking (in real implementation, this would be persistent)
        this.usageStats = new Map();
    }
    
    /**
     * Calculate relevance score for a file based on context
     * @param {Object} file - File object with path, name, type properties
     * @param {Object} context - Context analysis result
     * @returns {Object} Scoring result with total score and breakdown
     */
    scoreFile(file, context) {
        const scores = {
            keyword: this.calculateKeywordScore(file, context),
            extension: this.calculateExtensionScore(file, context),
            path: this.calculatePathScore(file, context),
            usage: this.calculateUsageScore(file),
            filename: this.calculateFilenameScore(file, context)
        };
        
        const totalScore = Math.min(
            scores.keyword + scores.extension + scores.path + scores.usage + scores.filename,
            200 // Maximum possible score
        );
        
        return {
            file: file,
            totalScore: totalScore,
            scores: scores,
            relevanceReason: this.generateRelevanceReason(file, context, scores),
            matchedKeywords: this.getMatchedKeywords(file, context)
        };
    }
    
    /**
     * Calculate keyword matching score
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @returns {number} Keyword score (0-50)
     */
    calculateKeywordScore(file, context) {
        if (context.keywords.length === 0) return 0;
        
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();
        let score = 0;
        
        context.keywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            
            // Exact match in filename
            if (fileName.includes(keywordLower)) {
                if (fileName === keywordLower || fileName.startsWith(keywordLower + '.')) {
                    score += 25; // Exact filename match
                } else {
                    score += 15; // Partial filename match
                }
            }
            
            // Match in file path
            if (filePath.includes(keywordLower)) {
                score += 8;
            }
            
            // Match in directory names
            const pathParts = filePath.split('/');
            pathParts.forEach(part => {
                if (part.includes(keywordLower)) {
                    score += 5;
                }
            });
        });
        
        // Bonus for multiple keyword matches
        const matchCount = this.getMatchedKeywords(file, context).length;
        if (matchCount > 1) {
            score += Math.min(matchCount * 3, 15);
        }
        
        return Math.min(score, this.weights.keywordMatch);
    }
    
    /**
     * Calculate file extension relevance score
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @returns {number} Extension score (0-30)
     */
    calculateExtensionScore(file, context) {
        if (context.fileTypes.length === 0) return 5; // Small bonus for any file
        
        const fileExt = this.getFileExtension(file.name);
        let score = 0;
        
        context.fileTypes.forEach(fileType => {
            const expectedExtensions = this.extensionMappings[fileType] || [];
            
            if (expectedExtensions.includes(fileExt)) {
                score += 25; // Direct extension match
            } else if (this.isRelatedExtension(fileExt, fileType)) {
                score += 15; // Related extension
            }
        });
        
        // Bonus for common project files
        if (this.isCommonProjectFile(file.name)) {
            score += 10;
        }
        
        return Math.min(score, this.weights.extensionMatch);
    }
    
    /**
     * Calculate path relevance score based on project structure
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @returns {number} Path score (0-20)
     */
    calculatePathScore(file, context) {
        const filePath = file.path.toLowerCase();
        let score = 0;
        
        // Check for component-related paths
        if (context.components.length > 0) {
            if (filePath.includes('component') || filePath.includes('comp')) {
                score += 15;
            }
        }
        
        // Check for technology-specific paths
        context.technologies.forEach(tech => {
            if (filePath.includes(tech)) {
                score += 10;
            }
        });
        
        // Check for feature-specific paths
        context.features.forEach(feature => {
            if (filePath.includes(feature)) {
                score += 12;
            }
        });
        
        // Check for file type specific directories
        context.fileTypes.forEach(fileType => {
            switch (fileType) {
                case 'css':
                    if (filePath.includes('style') || filePath.includes('css')) {
                        score += 10;
                    }
                    break;
                case 'js':
                case 'jsx':
                case 'ts':
                case 'tsx':
                    if (filePath.includes('src') || filePath.includes('js')) {
                        score += 8;
                    }
                    break;
                case 'json':
                    if (filePath.includes('config') || filePath.includes('conf')) {
                        score += 10;
                    }
                    break;
            }
        });
        
        // Penalty for deeply nested files (unless specifically looking for them)
        const pathDepth = filePath.split('/').length;
        if (pathDepth > 5) {
            score -= 3;
        }
        
        return Math.min(Math.max(score, 0), this.weights.pathRelevance);
    }
    
    /**
     * Calculate usage-based score
     * @param {Object} file - File object
     * @returns {number} Usage score (0-15)
     */
    calculateUsageScore(file) {
        const usage = this.usageStats.get(file.path) || { count: 0, lastUsed: 0 };
        let score = 0;
        
        // Frequency bonus
        if (usage.count > 0) {
            score += Math.min(usage.count * 2, 10);
        }
        
        // Recency bonus
        const daysSinceLastUsed = (Date.now() - usage.lastUsed) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUsed < 1) {
            score += 5;
        } else if (daysSinceLastUsed < 7) {
            score += 3;
        }
        
        return Math.min(score, this.weights.recentUsage);
    }
    
    /**
     * Calculate filename quality score
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @returns {number} Filename score (0-5)
     */
    calculateFilenameScore(file, context) {
        let score = 0;
        
        // Bonus for shorter, more specific names
        const nameLength = file.name.length;
        if (nameLength < 20) {
            score += 3;
        } else if (nameLength < 30) {
            score += 1;
        }
        
        // Bonus for descriptive names
        const descriptivePatterns = ['index', 'main', 'app', 'config', 'utils', 'helper'];
        if (descriptivePatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
            score += 2;
        }
        
        return Math.min(score, this.weights.filenameLength);
    }
    
    /**
     * Generate human-readable relevance reason
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @param {Object} scores - Score breakdown
     * @returns {string} Relevance reason
     */
    generateRelevanceReason(file, context, scores) {
        const reasons = [];
        
        if (scores.keyword > 15) {
            const matchedKeywords = this.getMatchedKeywords(file, context);
            if (matchedKeywords.length > 0) {
                reasons.push(`matches "${matchedKeywords.slice(0, 2).join('", "')}"`);
            }
        }
        
        if (scores.extension > 20) {
            const fileExt = this.getFileExtension(file.name);
            reasons.push(`${fileExt} file type`);
        }
        
        if (scores.path > 10) {
            reasons.push('relevant directory');
        }
        
        if (scores.usage > 5) {
            reasons.push('recently used');
        }
        
        if (reasons.length === 0) {
            return 'general match';
        }
        
        return reasons.join(', ');
    }
    
    /**
     * Get keywords that match the file
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     * @returns {Array} Array of matched keywords
     */
    getMatchedKeywords(file, context) {
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();
        
        return context.keywords.filter(keyword => {
            const keywordLower = keyword.toLowerCase();
            return fileName.includes(keywordLower) || filePath.includes(keywordLower);
        });
    }
    
    /**
     * Get file extension from filename
     * @param {string} filename - File name
     * @returns {string} File extension with dot
     */
    getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : '';
    }
    
    /**
     * Check if extension is related to file type
     * @param {string} extension - File extension
     * @param {string} fileType - Expected file type
     * @returns {boolean} True if related
     */
    isRelatedExtension(extension, fileType) {
        const relatedMappings = {
            'css': ['.js', '.jsx', '.ts', '.tsx'], // JS files might contain CSS-in-JS
            'js': ['.json', '.ts'], // Related JavaScript files
            'jsx': ['.js', '.ts', '.tsx'], // React-related files
            'ts': ['.js', '.jsx'], // TypeScript related
            'tsx': ['.jsx', '.ts', '.js'] // TypeScript React related
        };
        
        return relatedMappings[fileType]?.includes(extension) || false;
    }
    
    /**
     * Check if file is a common project file
     * @param {string} filename - File name
     * @returns {boolean} True if common project file
     */
    isCommonProjectFile(filename) {
        return Object.values(this.commonFiles)
            .flat()
            .some(commonFile => filename.toLowerCase() === commonFile.toLowerCase());
    }
    
    /**
     * Record file usage for future scoring
     * @param {string} filePath - Path of the used file
     */
    recordUsage(filePath) {
        const current = this.usageStats.get(filePath) || { count: 0, lastUsed: 0 };
        this.usageStats.set(filePath, {
            count: current.count + 1,
            lastUsed: Date.now()
        });
    }
    
    /**
     * Get usage statistics for debugging
     * @returns {Object} Usage statistics
     */
    getUsageStats() {
        return Object.fromEntries(this.usageStats);
    }
    
    /**
     * Clear usage statistics
     */
    clearUsageStats() {
        this.usageStats.clear();
    }
    
    /**
     * Update scoring weights
     * @param {Object} newWeights - New weight values
     */
    updateWeights(newWeights) {
        this.weights = { ...this.weights, ...newWeights };
    }
    
    /**
     * Debug method to show detailed scoring breakdown
     * @param {Object} file - File object
     * @param {Object} context - Context analysis result
     */
    debugScoring(file, context) {
        const result = this.scoreFile(file, context);
        
        console.group(`Scoring Debug: ${file.name}`);
        console.log('File:', file);
        console.log('Context:', context);
        console.log('Scores:', result.scores);
        console.log('Total Score:', result.totalScore);
        console.log('Relevance Reason:', result.relevanceReason);
        console.log('Matched Keywords:', result.matchedKeywords);
        console.groupEnd();
        
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileScorer;
}