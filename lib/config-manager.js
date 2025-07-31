/**
 * Interactive Feedback MCP - Configuration Manager
 * Manages project configuration and settings
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Configuration Manager Class
 * Handles reading, writing, and managing configuration files for each project
 */
class ConfigManager {
    /**
     * Initialize Configuration Manager
     * @param {string} projectDirectory - Project directory path
     */
    constructor(projectDirectory) {
        this.projectDirectory = projectDirectory;
        this.configDir = path.join(os.homedir(), '.interactive-feedback-mcp');
        
        // Create config directory if it doesn't exist
        this._ensureConfigDirectory();
        
        console.log(`ConfigManager initialized for project: ${projectDirectory}`);
    }
    
    /**
     * Ensure config directory exists
     * @private
     * @returns {Promise<void>}
     */
    async _ensureConfigDirectory() {
        try {
            await fs.ensureDir(this.configDir);
        } catch (error) {
            console.warn(`Cannot create config directory: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Get unique config file path for project
     * Uses basename + MD5 hash of project path
     * @returns {string} Full path to config file
     */
    getConfigFile() {
        try {
            const projectBasename = path.basename(this.projectDirectory);
            const projectHash = crypto.createHash('md5').update(this.projectDirectory).digest('hex').substring(0, 8);
            const configFileName = `${projectBasename}_${projectHash}.json`;
            return path.join(this.configDir, configFileName);
        } catch (error) {
            console.warn(`Error creating config file name: ${error.message}`);
            // Fallback to simple name
            return path.join(this.configDir, 'default_config.json');
        }
    }
    
    /**
     * Load configuration from JSON file
     * Returns default config if file doesn't exist
     * @returns {Promise<Object>} Configuration data
     */
    async loadConfig() {
        const configFile = this.getConfigFile();
        
        // Default configuration
        const defaultConfig = {
            run_command: '',
            execute_automatically: false,
            command_section_visible: false,
            window_geometry: null
        };
        
        try {
            if (await fs.pathExists(configFile)) {
                const configData = await fs.readFile(configFile, 'utf8');
                const parsedConfig = JSON.parse(configData);
                
                // Merge with default config to ensure all keys are present
                return { ...defaultConfig, ...parsedConfig };
            } else {
                console.log(`Config file doesn't exist, using default configuration: ${configFile}`);
                return defaultConfig;
            }
        } catch (error) {
            console.warn(`Error reading config file: ${error.message}. Using default configuration.`);
            return defaultConfig;
        }
    }
    
    /**
     * Save configuration to JSON file
     * Merge new config with current config
     * @param {Object} config - New configuration data
     * @returns {Promise<void>}
     */
    async saveConfig(config) {
        const configFile = this.getConfigFile();
        
        try {
            // Ensure config directory exists
            await this._ensureConfigDirectory();
            
            // Load current config and merge with new config
            const currentConfig = await this.loadConfig();
            const mergedConfig = { ...currentConfig, ...config };
            
            // Write to file with pretty format
            await fs.writeFile(configFile, JSON.stringify(mergedConfig, null, 2), 'utf8');
            
            console.log(`Configuration saved to: ${configFile}`);
        } catch (error) {
            console.warn(`Error saving config file: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Delete configuration file
     * Handle errors gracefully
     * @returns {Promise<void>}
     */
    async deleteConfig() {
        const configFile = this.getConfigFile();
        
        try {
            if (await fs.pathExists(configFile)) {
                await fs.unlink(configFile);
                console.log(`Config file deleted: ${configFile}`);
            } else {
                console.log(`Config file doesn't exist: ${configFile}`);
            }
        } catch (error) {
            console.warn(`Error deleting config file: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ConfigManager;