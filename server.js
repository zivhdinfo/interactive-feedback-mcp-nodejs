#!/usr/bin/env node

/**
 * Interactive Feedback MCP Server - Node.js Implementation
 * Compliant with MCP Specification and JSON-RPC 2.0
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

/**
 * Get first line from text
 * @param {string} text - Input text
 * @returns {string} First line trimmed
 */
function firstLine(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text.split('\n')[0].trim();
}

/**
 * Launch Web UI and wait for feedback result
 * @param {string} projectDirectory - Project directory
 * @param {string} summary - Request summary
 * @returns {Promise<Object>} Feedback result from UI
 */
async function launchFeedbackUI(projectDirectory, summary) {
    // Create temporary file for result
    const tempDir = os.tmpdir();
    const uuid = crypto.randomUUID();
    const outputFile = path.join(tempDir, `feedback-${uuid}.json`);
    
    try {
        // Get path to web-ui.js
        const scriptDir = __dirname;
        const webUIPath = path.join(scriptDir, 'web-ui.js');
        
        // Prepare arguments for web UI process
        const args = [
            webUIPath,
            '--project-directory', projectDirectory,
            '--prompt', summary,
            '--output-file', outputFile
        ];
        
        // Spawn Web UI process
        const childProcess = spawn('node', args, {
            stdio: ['ignore', 'ignore', 'ignore'],
            detached: false
        });
        
        // Wait for process completion
        await new Promise((resolve, reject) => {
            childProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Web UI process exited with code ${code}`));
                }
            });
            
            childProcess.on('error', (error) => {
                reject(error);
            });
        });
        
        // Read result from temp file
        const result = await fs.readJson(outputFile);
        
        // Cleanup temp file
        await fs.unlink(outputFile);
        
        return result;
        
    } catch (error) {
        // Cleanup temp file if error occurs
        try {
            await fs.unlink(outputFile);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
        throw error;
    }
}

/**
 * Wrapper function for interactive feedback
 * @param {string} projectDirectory - Project directory
 * @param {string} summary - Request summary
 * @returns {Promise<Object>} Feedback result
 */
async function interactiveFeedback(projectDirectory, summary) {
    // Apply firstLine to both parameters
    const cleanProjectDirectory = firstLine(projectDirectory);
    const cleanSummary = firstLine(summary);
    
    return await launchFeedbackUI(cleanProjectDirectory, cleanSummary);
}

/**
 * MCP Server Class
 * Handles communication with AI assistants via MCP protocol
 * Compliant with MCP Specification and JSON-RPC 2.0
 */
class MCPServer {
    constructor() {
        this.initialized = false;
        this.clientCapabilities = null;
        
        // Initialize tools object with interactive_feedback tool
        this.tools = {
            interactive_feedback: {
                description: 'Request interactive feedback for a given project directory and summary',
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_directory: {
                            type: 'string',
                            description: 'Path to the project directory'
                        },
                        summary: {
                            type: 'string',
                            description: 'Summary of the request or context'
                        }
                    },
                    required: ['project_directory', 'summary']
                },
                handler: interactiveFeedback
            }
        };
        
        // Server capabilities
        this.serverCapabilities = {
            tools: {
                listChanged: false
            }
        };
        
        // Server info
        this.serverInfo = {
            name: 'interactive-feedback-mcp',
            version: '1.0.0'
        };
    }
    
    /**
     * Launch MCP Server
     */
    run() {
        // Setup stdin encoding
        process.stdin.setEncoding('utf8');
        
        // Listen for stdin data events
        process.stdin.on('data', async (data) => {
            try {
                const lines = data.trim().split('\n');
                
                for (const line of lines) {
                    if (line.trim()) {
                        const request = JSON.parse(line);
                        const response = await this.handleRequest(request);
                        if (response) {
                            this.sendMessage(response);
                        }
                    }
                }
            } catch (error) {
                // Send error response
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: null,
                    error: {
                        code: -32700,
                        message: 'Parse error',
                        data: error.message
                    }
                };
                this.sendMessage(errorResponse);
            }
        });
        
        // Handle process termination
        process.on('SIGINT', () => {
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            process.exit(0);
        });
    }
    
    /**
     * Send message to stdout
     * @param {Object} message - Message to send
     */
    sendMessage(message) {
        console.log(JSON.stringify(message));
    }
    
    /**
     * Handle MCP request
     * @param {Object} request - MCP request object
     * @returns {Object|null} MCP response object or null for notifications
     */
    async handleRequest(request) {
        try {
            // Validate JSON-RPC 2.0 format
            if (request.jsonrpc !== '2.0') {
                return {
                    jsonrpc: '2.0',
                    id: request.id || null,
                    error: {
                        code: -32600,
                        message: 'Invalid Request',
                        data: 'Invalid JSON-RPC version'
                    }
                };
            }
            
            switch (request.method) {
                case 'initialize':
                    return this.handleInitialize(request);
                    
                case 'initialized':
                    // Notification - no response needed
                    this.initialized = true;
                    return null;
                    
                case 'tools/list':
                    return this.handleToolsList(request);
                    
                case 'tools/call':
                    return await this.handleToolsCall(request);
                    
                default:
                    return {
                        jsonrpc: '2.0',
                        id: request.id || null,
                        error: {
                            code: -32601,
                            message: 'Method not found',
                            data: `Unknown method: ${request.method}`
                        }
                    };
            }
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id: request.id || null,
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error.message
                }
            };
        }
    }
    
    /**
     * Handle initialize request
     * @param {Object} request - Initialize request
     * @returns {Object} Initialize response
     */
    handleInitialize(request) {
        const { params } = request;
        
        // Store client capabilities
        this.clientCapabilities = params.capabilities || {};
        
        // Return server capabilities and info
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: this.serverCapabilities,
                serverInfo: this.serverInfo
            }
        };
    }
    
    /**
     * Handle tools/list request
     * @param {Object} request - Tools list request
     * @returns {Object} Tools list response
     */
    handleToolsList(request) {
        const tools = Object.keys(this.tools).map(name => ({
            name,
            description: this.tools[name].description,
            inputSchema: this.tools[name].inputSchema
        }));
        
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                tools
            }
        };
    }
    
    /**
     * Handle tools/call request
     * @param {Object} request - Tools call request
     * @returns {Object} Tools call response
     */
    async handleToolsCall(request) {
        const { name: toolName, arguments: toolArgs } = request.params;
        
        // Validate tool exists
        if (!this.tools[toolName]) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32602,
                    message: 'Invalid params',
                    data: `Unknown tool: ${toolName}`
                }
            };
        }
        
        try {
            // Call tool handler
            const result = await this.tools[toolName].handler(
                toolArgs.project_directory,
                toolArgs.summary
            );
            
            // Return MCP response format
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                }
            };
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: `Tool execution failed: ${error.message}`
                }
            };
        }
    }
    

}

// Command line interface
if (require.main === module) {
    try {
        const server = new MCPServer();
        server.run();
    } catch (error) {
        console.error('Error starting MCP Server:', error.message);
        process.exit(1);
    }
}

// Module exports
module.exports = {
    MCPServer,
    interactiveFeedback,
    launchFeedbackUI,
    firstLine
};