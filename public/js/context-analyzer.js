/**
 * Context Analyzer for Intelligent File Suggestions
 * Analyzes text before @ symbol to understand user intent
 */
class ContextAnalyzer {
    constructor() {
        // Define keyword categories for better context understanding
        this.keywordCategories = {
            fileTypes: {
                'css': ['css', 'style', 'styling', 'stylesheet'],
                'js': ['javascript', 'js', 'script'],
                'jsx': ['react', 'jsx', 'component'],
                'ts': ['typescript', 'ts'],
                'tsx': ['typescript', 'tsx', 'react'],
                'html': ['html', 'markup', 'template'],
                'json': ['json', 'config', 'configuration'],
                'md': ['markdown', 'md', 'readme', 'documentation'],
                'py': ['python', 'py'],
                'php': ['php'],
                'sql': ['sql', 'database', 'db'],
                'xml': ['xml'],
                'yml': ['yaml', 'yml', 'config'],
                'env': ['environment', 'env', 'config']
            },
            
            technologies: {
                'react': ['react', 'jsx', 'component', 'hook', 'state'],
                'vue': ['vue', 'vuejs', 'component'],
                'angular': ['angular', 'ng', 'component', 'service'],
                'node': ['node', 'nodejs', 'server', 'backend'],
                'express': ['express', 'router', 'middleware'],
                'database': ['database', 'db', 'sql', 'mongodb', 'mysql', 'postgres'],
                'api': ['api', 'endpoint', 'route', 'service'],
                'auth': ['auth', 'authentication', 'login', 'user', 'session'],
                'test': ['test', 'testing', 'spec', 'unit', 'integration']
            },
            
            actions: {
                'fix': ['fix', 'bug', 'error', 'issue', 'problem', 'debug'],
                'update': ['update', 'modify', 'change', 'edit', 'refactor'],
                'create': ['create', 'add', 'new', 'build', 'generate'],
                'delete': ['delete', 'remove', 'clean', 'clear'],
                'check': ['check', 'review', 'examine', 'inspect', 'verify'],
                'optimize': ['optimize', 'improve', 'performance', 'speed']
            },
            
            components: {
                'header': ['header', 'navbar', 'navigation', 'menu'],
                'footer': ['footer', 'bottom'],
                'sidebar': ['sidebar', 'aside', 'panel'],
                'modal': ['modal', 'dialog', 'popup'],
                'form': ['form', 'input', 'field', 'validation'],
                'button': ['button', 'btn', 'click'],
                'card': ['card', 'item', 'tile'],
                'list': ['list', 'table', 'grid', 'collection'],
                'layout': ['layout', 'container', 'wrapper', 'grid']
            },
            
            features: {
                'login': ['login', 'signin', 'auth', 'authentication'],
                'register': ['register', 'signup', 'registration'],
                'dashboard': ['dashboard', 'admin', 'panel'],
                'profile': ['profile', 'user', 'account'],
                'settings': ['settings', 'config', 'preferences'],
                'payment': ['payment', 'billing', 'checkout', 'cart'],
                'search': ['search', 'filter', 'find'],
                'notification': ['notification', 'alert', 'message']
            }
        };
        
        // Common project structure patterns
        this.pathPatterns = {
            components: ['components', 'comp', 'ui'],
            styles: ['styles', 'css', 'scss', 'sass'],
            scripts: ['js', 'scripts', 'src'],
            config: ['config', 'conf', 'settings'],
            utils: ['utils', 'helpers', 'lib'],
            pages: ['pages', 'views', 'screens'],
            assets: ['assets', 'static', 'public'],
            tests: ['test', 'tests', '__tests__', 'spec']
        };
    }
    
    /**
     * Main method to analyze context from text before @ symbol
     * @param {string} textBeforeAt - Text content before @ symbol
     * @returns {Object} Context analysis result
     */
    analyzeContext(textBeforeAt) {
        if (!textBeforeAt || textBeforeAt.trim().length === 0) {
            return this.getDefaultContext();
        }
        
        const cleanText = this.cleanText(textBeforeAt);
        const words = this.extractWords(cleanText);
        
        const context = {
            originalText: textBeforeAt,
            cleanText: cleanText,
            words: words,
            keywords: this.extractKeywords(words),
            fileTypes: this.extractFileTypes(words),
            technologies: this.extractTechnologies(words),
            actions: this.extractActions(words),
            components: this.extractComponents(words),
            features: this.extractFeatures(words),
            confidence: 0
        };
        
        context.confidence = this.calculateConfidence(context);
        
        return context;
    }
    
    /**
     * Clean and normalize text for analysis
     * @param {string} text - Raw text input
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }
    
    /**
     * Extract individual words from text
     * @param {string} text - Cleaned text
     * @returns {Array} Array of words
     */
    extractWords(text) {
        return text.split(' ').filter(word => word.length > 1);
    }
    
    /**
     * Extract all relevant keywords from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of relevant keywords
     */
    extractKeywords(words) {
        const keywords = new Set();
        
        // Add original words
        words.forEach(word => keywords.add(word));
        
        // Add partial matches and related terms
        words.forEach(word => {
            Object.values(this.keywordCategories).forEach(category => {
                Object.entries(category).forEach(([key, synonyms]) => {
                    if (synonyms.some(synonym => 
                        word.includes(synonym) || synonym.includes(word)
                    )) {
                        keywords.add(key);
                        synonyms.forEach(synonym => keywords.add(synonym));
                    }
                });
            });
        });
        
        return Array.from(keywords);
    }
    
    /**
     * Extract file type indicators from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of file types
     */
    extractFileTypes(words) {
        const fileTypes = new Set();
        
        Object.entries(this.keywordCategories.fileTypes).forEach(([fileType, keywords]) => {
            if (keywords.some(keyword => words.includes(keyword))) {
                fileTypes.add(fileType);
            }
        });
        
        return Array.from(fileTypes);
    }
    
    /**
     * Extract technology indicators from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of technologies
     */
    extractTechnologies(words) {
        const technologies = new Set();
        
        Object.entries(this.keywordCategories.technologies).forEach(([tech, keywords]) => {
            if (keywords.some(keyword => words.includes(keyword))) {
                technologies.add(tech);
            }
        });
        
        return Array.from(technologies);
    }
    
    /**
     * Extract action indicators from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of actions
     */
    extractActions(words) {
        const actions = new Set();
        
        Object.entries(this.keywordCategories.actions).forEach(([action, keywords]) => {
            if (keywords.some(keyword => words.includes(keyword))) {
                actions.add(action);
            }
        });
        
        return Array.from(actions);
    }
    
    /**
     * Extract component indicators from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of components
     */
    extractComponents(words) {
        const components = new Set();
        
        Object.entries(this.keywordCategories.components).forEach(([component, keywords]) => {
            if (keywords.some(keyword => words.includes(keyword))) {
                components.add(component);
            }
        });
        
        return Array.from(components);
    }
    
    /**
     * Extract feature indicators from words
     * @param {Array} words - Array of words
     * @returns {Array} Array of features
     */
    extractFeatures(words) {
        const features = new Set();
        
        Object.entries(this.keywordCategories.features).forEach(([feature, keywords]) => {
            if (keywords.some(keyword => words.includes(keyword))) {
                features.add(feature);
            }
        });
        
        return Array.from(features);
    }
    
    /**
     * Calculate confidence score for the context analysis
     * @param {Object} context - Context analysis result
     * @returns {number} Confidence score (0-100)
     */
    calculateConfidence(context) {
        let confidence = 0;
        
        // Base confidence from word count
        confidence += Math.min(context.words.length * 5, 30);
        
        // Bonus for specific categories
        if (context.fileTypes.length > 0) confidence += 20;
        if (context.technologies.length > 0) confidence += 15;
        if (context.actions.length > 0) confidence += 15;
        if (context.components.length > 0) confidence += 10;
        if (context.features.length > 0) confidence += 10;
        
        // Penalty for very short or very long text
        if (context.words.length < 2) confidence -= 20;
        if (context.words.length > 20) confidence -= 10;
        
        return Math.max(0, Math.min(100, confidence));
    }
    
    /**
     * Get default context when no meaningful input is provided
     * @returns {Object} Default context
     */
    getDefaultContext() {
        return {
            originalText: '',
            cleanText: '',
            words: [],
            keywords: [],
            fileTypes: [],
            technologies: [],
            actions: [],
            components: [],
            features: [],
            confidence: 0
        };
    }
    
    /**
     * Get suggested path patterns based on context
     * @param {Object} context - Context analysis result
     * @returns {Array} Array of suggested path patterns
     */
    getSuggestedPaths(context) {
        const suggestedPaths = new Set();
        
        // Add paths based on file types
        context.fileTypes.forEach(fileType => {
            switch (fileType) {
                case 'css':
                    this.pathPatterns.styles.forEach(path => suggestedPaths.add(path));
                    break;
                case 'js':
                case 'jsx':
                case 'ts':
                case 'tsx':
                    this.pathPatterns.scripts.forEach(path => suggestedPaths.add(path));
                    this.pathPatterns.components.forEach(path => suggestedPaths.add(path));
                    break;
                case 'json':
                    this.pathPatterns.config.forEach(path => suggestedPaths.add(path));
                    break;
            }
        });
        
        // Add paths based on components
        if (context.components.length > 0) {
            this.pathPatterns.components.forEach(path => suggestedPaths.add(path));
        }
        
        // Add paths based on technologies
        context.technologies.forEach(tech => {
            if (tech === 'test') {
                this.pathPatterns.tests.forEach(path => suggestedPaths.add(path));
            }
        });
        
        return Array.from(suggestedPaths);
    }
    
    /**
     * Debug method to log context analysis details
     * @param {Object} context - Context analysis result
     */
    debugContext(context) {
        console.group('Context Analysis Debug');
        console.log('Original Text:', context.originalText);
        console.log('Clean Text:', context.cleanText);
        console.log('Words:', context.words);
        console.log('Keywords:', context.keywords);
        console.log('File Types:', context.fileTypes);
        console.log('Technologies:', context.technologies);
        console.log('Actions:', context.actions);
        console.log('Components:', context.components);
        console.log('Features:', context.features);
        console.log('Confidence:', context.confidence + '%');
        console.log('Suggested Paths:', this.getSuggestedPaths(context));
        console.groupEnd();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextAnalyzer;
}