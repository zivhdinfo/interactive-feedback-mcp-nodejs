#!/usr/bin/env node

/**
 * Interactive Feedback MCP - Web UI Server
 * Web server to provide user interface
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

// Load environment variables from .env file
// Ensure .env is loaded from the script directory, not the current working directory
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const OpenAI = require('openai');
const ConfigManager = require('./lib/config-manager');
const ProcessManager = require('./lib/process-manager');
const GitIgnoreParser = require('./lib/gitignore-parser');

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const parsed = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i];
        const value = args[i + 1];
        
        if (key.startsWith('--')) {
            parsed[key.substring(2).replace(/-/g, '_')] = value;
        }
    }
    
    return parsed;
}

/**
 * Web UI Server Class
 * Manages web server and WebSocket connections
 */
class WebUIServer {
    constructor(projectDirectory, prompt, outputFile) {
        this.projectDirectory = projectDirectory || process.cwd();
        this.prompt = prompt || 'I implemented the changes you requested.';
        this.outputFile = outputFile;
        this.port = 3636; // Fixed port
        
        // Initialize Express app and WebSocket server
        this.app = express();
        this.server = null;
        this.wss = null;
        
        // Initialize managers
        this.configManager = new ConfigManager(this.projectDirectory);
        this.processManager = new ProcessManager();
        this.gitIgnoreParser = new GitIgnoreParser(this.projectDirectory);
        this.feedbackResult = null;
        
        // Path to feedback JSON file
        this.feedbackJsonPath = path.join(__dirname, 'data', 'feedback.json');
        
        // Configure multer for file uploads
        this.upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 25 * 1024 * 1024 // 25MB limit
            },
            fileFilter: (req, file, cb) => {
                // Accept audio files
                if (file.mimetype.startsWith('audio/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only audio files are allowed'), false);
                }
            }
        });
        
        // POST /api/speech-to-text - Convert audio to text using OpenAI Whisper
        this.app.post('/api/speech-to-text', this.upload.single('audio'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'No audio file provided' });
                }
                
                if (!this.openai) {
                    return res.status(500).json({ 
                        success: false, 
                        error: 'OpenAI API key not configured. Please check your .env file and ensure OPENAI_API_KEY is set correctly.',
                        details: 'Speech-to-Text feature requires a valid OpenAI API key to function.'
                    });
                }
                
                // Create a temporary file from the buffer
                const tempDir = path.join(__dirname, 'temp');
                await fs.ensureDir(tempDir);
                
                const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
                await fs.writeFile(tempFilePath, req.file.buffer);
                
                try {
                    // Call OpenAI Whisper API
                    const transcription = await this.openai.audio.transcriptions.create({
                        file: fs.createReadStream(tempFilePath),
                        model: 'whisper-1',
                        language: process.env.WHISPER_LANGUAGE || 'vi' // Use environment variable or default to Vietnamese
                    });
                    
                    // Clean up temporary file
                    await fs.remove(tempFilePath);
                    
                    res.json({ 
                        success: true, 
                        text: transcription.text 
                    });
                    
                } catch (openaiError) {
                    // Clean up temporary file on error
                    await fs.remove(tempFilePath).catch(() => {});
                    
                    console.error('OpenAI API error:', openaiError);
                    res.status(500).json({ 
                        success: false, 
                        error: 'Failed to transcribe audio: ' + openaiError.message 
                    });
                }
                
            } catch (error) {
                console.error('Speech-to-text error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error: ' + error.message 
                });
            }
        });
        
        // Initialize OpenAI client (optional)
        this.openai = null;
        this.initializeOpenAIClient();
        
        this.setupRoutes();
        this.saveFeedbackData();
    }

    /**
     * Check if a port is available
     * @param {number} port - Port number to check
     * @returns {Promise<boolean>} True if port is available
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const server = net.createServer();
            
            server.listen(port, 'localhost', () => {
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            
            server.on('error', () => {
                resolve(false);
            });
        });
    }
    
    /**
     * Find an available port starting from the preferred port
     * @param {number} startPort - Starting port number
     * @param {number} maxAttempts - Maximum number of ports to try
     * @returns {Promise<number>} Available port number
     */
    async findAvailablePort(startPort = 3636, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            const port = startPort + i;
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
    }
    
    /**
     * Initialize OpenAI client with proper error handling and validation
     */
    initializeOpenAIClient() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.log('⚠️  OpenAI API key not found in environment variables.');
            console.log('   Speech-to-Text feature will be disabled.');
            console.log('   To enable this feature, set OPENAI_API_KEY in your .env file.');
            return;
        }
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
            console.error('❌ Invalid OpenAI API key format. API key should start with "sk-"');
            console.log('   Please check your OPENAI_API_KEY in the .env file.');
            return;
        }
        
        if (apiKey.length < 20) {
            console.error('❌ OpenAI API key appears to be too short. Please verify your API key.');
            return;
        }
        
        try {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
            
            console.log('✅ OpenAI client initialized successfully');
            console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
            console.log(`   Speech Language: ${process.env.WHISPER_LANGUAGE || 'vi (default)'}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize OpenAI client:', error.message);
            console.log('   Please verify your OPENAI_API_KEY is correct.');
            this.openai = null;
        }
    }

    /**
     * Save feedback data to JSON file when receiving data from AI
     */
    async saveFeedbackData() {
        try {
            const feedbackData = {
                prompt: this.prompt,
                projectDirectory: this.projectDirectory,
                timestamp: new Date().toISOString(),
                feedback: '',
                commandLogs: []
            };
            
            await fs.ensureDir(path.dirname(this.feedbackJsonPath));
            await fs.writeJson(this.feedbackJsonPath, feedbackData, { spaces: 2 });
            console.log('Feedback data saved to JSON file');
        } catch (error) {
            console.error('Error saving feedback data:', error);
        }
    }
    
    /**
     * Clear feedback data from JSON file after feedback submission
     */
    async clearFeedbackData() {
        try {
            const emptyData = {
                prompt: '',
                projectDirectory: '',
                timestamp: '',
                feedback: '',
                commandLogs: []
            };
            
            await fs.writeJson(this.feedbackJsonPath, emptyData, { spaces: 2 });
            console.log('Feedback data cleared from JSON file');
        } catch (error) {
            console.error('Error clearing feedback data:', error);
        }
    }
    
    /**
     * Setup routes and middleware
     */
    setupRoutes() {
        // Static file serving
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        
        // API endpoints
        this.setupAPIEndpoints();
    }
    
    /**
     * Setup API endpoints
     */
    setupAPIEndpoints() {
        // GET /api/config - Load config
        this.app.get('/api/config', async (req, res) => {
            try {
                const config = await this.configManager.loadConfig();
                
                // Load feedback data from JSON file
                let feedbackData = {};
                try {
                    feedbackData = await fs.readJson(this.feedbackJsonPath);
                } catch (error) {
                    console.log('No existing feedback data found, using defaults');
                }
                
                res.json({
                    projectDirectory: feedbackData.projectDirectory || this.projectDirectory,
                    prompt: feedbackData.prompt || this.prompt,
                    config: config
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // POST /api/config - Save config
        this.app.post('/api/config', async (req, res) => {
            try {
                await this.configManager.saveConfig(req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // POST /api/run-command - Run command
        this.app.post('/api/run-command', async (req, res) => {
            try {
                const { command } = req.body;
                await this.processManager.runCommand(command, this.projectDirectory);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // POST /api/stop-command - Stop command
        this.app.post('/api/stop-command', async (req, res) => {
            try {
                await this.processManager.stopCommand();
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // POST /api/submit-feedback - Submit feedback
        this.app.post('/api/submit-feedback', async (req, res) => {
            try {
                const { feedback } = req.body;
                const logs = this.processManager.getLogs();
                
                this.feedbackResult = {
                    command_logs: logs,
                    interactive_feedback: feedback
                };
                
                // Write to output file if specified
                if (this.outputFile) {
                    await fs.writeJson(this.outputFile, this.feedbackResult, { spaces: 2 });
                }
                
                // Clear feedback data from JSON file after submission
                await this.clearFeedbackData();
                
                res.json({ success: true });
                
                // Schedule server close after 1 second
                setTimeout(() => {
                    this.close();
                }, 1000);
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // GET /api/browse-files - Browse project files and directories
        this.app.get('/api/browse-files', async (req, res) => {
            try {
                const { path: requestedPath = '' } = req.query;
                
                // Normalize and validate the requested path
                const normalizedPath = requestedPath.replace(/\\/g, '/');
                const fullPath = path.join(this.projectDirectory, normalizedPath);
                
                // Security check: ensure path is within project directory
                const resolvedPath = path.resolve(fullPath);
                const resolvedProjectDir = path.resolve(this.projectDirectory);
                
                if (!resolvedPath.startsWith(resolvedProjectDir)) {
                    return res.status(403).json({ 
                        success: false, 
                        error: 'Access denied: Path outside project directory' 
                    });
                }
                
                // Check if path exists
                if (!await fs.pathExists(fullPath)) {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Path not found' 
                    });
                }
                
                // Read directory contents
                const items = await fs.readdir(fullPath, { withFileTypes: true });
                
                // Convert to our format
                const fileItems = items.map(item => ({
                    name: item.name,
                    type: item.isDirectory() ? 'directory' : 'file',
                    path: path.join(normalizedPath, item.name).replace(/\\/g, '/')
                }));
                
                // Filter using gitignore rules
                const filteredItems = this.gitIgnoreParser.filterItems(fileItems, normalizedPath);
                
                // Sort: directories first, then files, both alphabetically
                filteredItems.sort((a, b) => {
                    if (a.type === 'directory' && b.type === 'file') return -1;
                    if (a.type === 'file' && b.type === 'directory') return 1;
                    return a.name.localeCompare(b.name);
                });
                
                res.json({
                    success: true,
                    currentPath: normalizedPath,
                    items: filteredItems
                });
                
            } catch (error) {
                console.error('Error browsing files:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

    }
    
    /**
     * Start server and return Promise with port number
     * @returns {Promise<number>} Port number
     */
    async start() {
        try {
            // Find an available port starting from 3636
            const availablePort = await this.findAvailablePort(3636, 10);
            
            return new Promise((resolve, reject) => {
                this.server = this.app.listen(availablePort, 'localhost', (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    this.port = this.server.address().port;
                    
                    if (this.port !== 3636) {
                        console.log(`⚠️  Port 3636 was occupied, using alternative port: ${this.port}`);
                    }
                    console.log(`✅ Web UI Server running at http://localhost:${this.port}`);
                    
                    // Setup WebSocket server
                    this.setupWebSocket();
                    
                    resolve(this.port);
                });
            });
        } catch (error) {
            throw new Error(`Failed to start server: ${error.message}`);
        }
    }
    
    /**
     * Setup WebSocket server
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('WebSocket client connected');
            
            // Send initial logs
            const initialLogs = this.processManager.getLogs();
            ws.send(JSON.stringify({
                type: 'logs',
                data: initialLogs
            }));
            
            // Setup event listeners
            const onLog = (data) => {
                ws.send(JSON.stringify({
                    type: 'log',
                    data: data
                }));
            };
            
            const onProcessStatus = (data) => {
                ws.send(JSON.stringify({
                    type: 'processStatus',
                    data: data
                }));
            };
            
            this.processManager.on('log', onLog);
            this.processManager.on('processStatus', onProcessStatus);
            
            // Handle client disconnect
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.processManager.removeListener('log', onLog);
                this.processManager.removeListener('processStatus', onProcessStatus);
            });
        });
    }
    
    /**
     * Mở trình duyệt với URL được cung cấp (đa nền tảng)
     */
    openBrowser() {
        const url = `http://localhost:${this.port}`;
        let command, args;
        
        // Detect platform
        switch (process.platform) {
            case 'darwin': // macOS
                command = 'open';
                args = [url];
                break;
            case 'win32': // Windows
                command = 'cmd';
                args = ['/c', 'start', '""', url];
                break;
            default: // Linux và các hệ điều hành khác
                command = 'xdg-open';
                args = [url];
                break;
        }
        
        try {
            // Spawn command
            const child = spawn(command, args, {
                detached: true,
                stdio: 'ignore'
            });
            
            child.unref();
            console.log(`Opening browser at ${url}`);
        } catch (error) {
            console.error('Error opening browser:', error.message);
        }
    }
    
    /**
     * Close server and cleanup
     */
    close() {
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        this.processManager.cleanup();
        process.exit(0);
    }
    
    /**
     * Main workflow - start server, open browser, wait for feedback
     * @returns {Promise<Object>} Feedback result
     */
    async run() {
        await this.start();
        this.openBrowser();
        
        // Return Promise that resolves when feedbackResult is available
        return new Promise((resolve) => {
            const checkResult = () => {
                if (this.feedbackResult) {
                    resolve(this.feedbackResult);
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            checkResult();
        });
    }
    

}

// Command line interface
if (require.main === module) {
    const args = parseArguments();
    
    const projectDirectory = args.project_directory || process.cwd();
    const prompt = args.prompt || 'I implemented the changes you requested.';
    const outputFile = args.output_file;
    
    const server = new WebUIServer(projectDirectory, prompt, outputFile);
    
    // Handle process termination
    process.on('SIGINT', () => {
        server.close();
    });
    
    process.on('SIGTERM', () => {
        server.close();
    });
    
    // Run server
    server.run().then((result) => {
        if (!outputFile) {
            console.log('Feedback result:', JSON.stringify(result, null, 2));
        }
    }).catch((error) => {
        console.error('Error running Web UI Server:', error.message);
        process.exit(1);
    });
}

// Module exports
module.exports = WebUIServer;