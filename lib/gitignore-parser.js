const fs = require('fs');
const path = require('path');

/**
 * GitIgnore Parser - Utility to parse .gitignore files and check if files/folders should be ignored
 */
class GitIgnoreParser {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.patterns = [];
        this.loadGitIgnore();
    }

    /**
     * Load and parse .gitignore file
     */
    loadGitIgnore() {
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        
        try {
            if (fs.existsSync(gitignorePath)) {
                const content = fs.readFileSync(gitignorePath, 'utf8');
                this.patterns = this.parseGitIgnore(content);
            }
        } catch (error) {
            console.warn('Warning: Could not read .gitignore file:', error.message);
        }
    }

    /**
     * Parse .gitignore content into patterns
     * @param {string} content - Content of .gitignore file
     * @returns {Array} Array of pattern objects
     */
    parseGitIgnore(content) {
        const lines = content.split('\n');
        const patterns = [];

        for (let line of lines) {
            line = line.trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) {
                continue;
            }

            // Handle negation patterns (starting with !)
            const isNegation = line.startsWith('!');
            if (isNegation) {
                line = line.substring(1);
            }

            // Convert gitignore pattern to regex
            const regex = this.patternToRegex(line);
            
            patterns.push({
                pattern: line,
                regex: regex,
                isNegation: isNegation
            });
        }

        return patterns;
    }

    /**
     * Convert gitignore pattern to regular expression
     * @param {string} pattern - Gitignore pattern
     * @returns {RegExp} Regular expression
     */
    patternToRegex(pattern) {
        // Escape special regex characters except * and ?
        let regexPattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        
        // Handle directory patterns (ending with /)
        const isDirectory = regexPattern.endsWith('/');
        if (isDirectory) {
            regexPattern = regexPattern.slice(0, -1);
        }
        
        // Convert gitignore wildcards to regex
        regexPattern = regexPattern
            .replace(/\*\*/g, '.*')  // ** matches any number of directories
            .replace(/\*/g, '[^/]*') // * matches any characters except /
            .replace(/\?/g, '[^/]'); // ? matches any single character except /
        
        // Handle patterns starting with /
        if (pattern.startsWith('/')) {
            regexPattern = '^' + regexPattern.substring(1);
        } else {
            regexPattern = '(^|/)' + regexPattern;
        }
        
        // Handle directory patterns
        if (isDirectory) {
            regexPattern += '(/.*)?$';
        } else {
            regexPattern += '(/.*)?$';
        }
        
        return new RegExp(regexPattern);
    }

    /**
     * Check if a file or directory should be ignored
     * @param {string} filePath - Relative path from project root
     * @param {boolean} isDirectory - Whether the path is a directory
     * @returns {boolean} True if should be ignored
     */
    shouldIgnore(filePath, isDirectory = false) {
        // Normalize path separators
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // Remove leading slash if present
        const relativePath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
        
        let shouldIgnore = false;
        
        for (const patternObj of this.patterns) {
            const matches = patternObj.regex.test(relativePath);
            
            if (matches) {
                if (patternObj.isNegation) {
                    shouldIgnore = false; // Negation pattern overrides ignore
                } else {
                    shouldIgnore = true;
                }
            }
        }
        
        return shouldIgnore;
    }

    /**
     * Filter an array of file/directory names
     * @param {Array} items - Array of {name, type} objects where type is 'file' or 'directory'
     * @param {string} currentPath - Current directory path relative to project root
     * @returns {Array} Filtered array
     */
    filterItems(items, currentPath = '') {
        return items.filter(item => {
            const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            const isDirectory = item.type === 'directory';
            return !this.shouldIgnore(itemPath, isDirectory);
        });
    }

    /**
     * Get all patterns for debugging
     * @returns {Array} Array of pattern objects
     */
    getPatterns() {
        return this.patterns;
    }
}

module.exports = GitIgnoreParser;