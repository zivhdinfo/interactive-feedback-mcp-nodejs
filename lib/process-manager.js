/**
 * Interactive Feedback MCP - Process Manager
 * Manages processes and system commands
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const os = require('os');

/**
 * Process Manager Class
 * Handles command execution, process lifecycle management and log collection
 */
class ProcessManager extends EventEmitter {
    /**
     * Initialize Process Manager
     */
    constructor() {
        super();
        
        // Properties according to specification Task 3
        this.currentProcess = null;
        this.logBuffer = [];
        this.isRunning = false;
        
        console.log('ProcessManager initialized');
    }
    
    /**
     * Run system command with cross-platform support
     * @param {string} command - Command to run
     * @param {string} cwd - Working directory (optional)
     */
    runCommand(command, cwd = process.cwd()) {
        // Check if there's already a process running
        if (this.isRunning) {
            this.addLog('Process is already running. Stopping current process first.');
            this.stopCommand();
        }
        
        try {
            // Detect platform and setup command
            let shell, args;
            if (os.platform() === 'win32') {
                shell = 'cmd.exe';
                args = ['/c', command];
            } else {
                shell = '/bin/bash';
                args = ['-c', command];
            }
            
            // Prefix command in log
            this.addLog(`$ ${command}\n`);
            
            // Spawn process with stdio pipes
            this.currentProcess = spawn(shell, args, {
                cwd: cwd,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // Set process status
            this.isRunning = true;
            this.emit('processStatus', { running: true });
            
            // Listen stdout data
            this.currentProcess.stdout.on('data', (data) => {
                const text = data.toString();
                this.addLog(text);
                this.emit('log', text);
            });
            
            // Listen stderr data
            this.currentProcess.stderr.on('data', (data) => {
                const text = data.toString();
                this.addLog(text);
                this.emit('log', text);
            });
            
            // Listen process close event
            this.currentProcess.on('close', (code) => {
                this.isRunning = false;
                this.currentProcess = null;
                
                const message = `\nProcess exited with code ${code}\n`;
                this.addLog(message);
                
                this.emit('processStatus', { running: false, exitCode: code });
                this.emit('log', message);
            });
            
            // Listen process error event
            this.currentProcess.on('error', (error) => {
                this.isRunning = false;
                this.currentProcess = null;
                
                const message = `\nProcess error: ${error.message}\n`;
                this.addLog(message);
                
                this.emit('processStatus', { running: false, error: error.message });
                this.emit('log', message);
            });
            
            console.log(`Command launched: ${command}`);
            
        } catch (error) {
            this.isRunning = false;
            this.currentProcess = null;
            
            const message = `Error launching command: ${error.message}\n`;
            this.addLog(message);
            this.emit('processStatus', { running: false, error: error.message });
            this.emit('log', message);
        }
    }
    
    /**
     * Stop current process
     */
    stopCommand() {
        if (!this.currentProcess || !this.isRunning) {
            console.log('No process is currently running');
            return;
        }
        
        try {
            // Kill process tree
            this.killProcessTree(this.currentProcess.pid);
            
            // Reset state
            this.currentProcess = null;
            this.isRunning = false;
            
            // Add log and emit events
            const message = 'Process stopped by user\n';
            this.addLog(message);
            this.emit('processStatus', { running: false, stopped: true });
            this.emit('log', message);
            
            console.log('Process stopped');
            
        } catch (error) {
            console.warn(`Error stopping process: ${error.message}`);
        }
    }
    
    /**
     * Kill process tree (cross-platform)
     * @param {number} pid - Process ID
     * @private
     */
    killProcessTree(pid) {
        try {
            if (os.platform() === 'win32') {
                // Windows: use taskkill
                spawn('taskkill', ['/pid', pid.toString(), '/t', '/f'], { stdio: 'ignore' });
            } else {
                // Unix: use process.kill with negative PID to kill process group
                process.kill(-pid, 'SIGKILL');
            }
        } catch (error) {
            console.warn(`Error killing process tree: ${error.message}`);
            // Fallback: kill process directly
            try {
                process.kill(pid, 'SIGKILL');
            } catch (fallbackError) {
                console.warn(`Fallback kill error: ${fallbackError.message}`);
            }
        }
    }
    
    /**
     * Add log to buffer
     * @param {string} text - Log content
     */
    addLog(text) {
        this.logBuffer.push(text);
        this.emit('log', text);
    }
    
    /**
     * Get all logs
     * @returns {string} Log content
     */
    getLogs() {
        return this.logBuffer.join('');
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logBuffer = [];
        this.emit('log', '');
        console.log('Logs cleared');
    }
    
    /**
     * Check if process is running
     * @returns {boolean} Process status
     */
    isProcessRunning() {
        return this.isRunning;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            // Stop running process if any
            if (this.isRunning) {
                this.stopCommand();
            }
            
            // Clear logs
            this.clearLogs();
            
            // Remove all listeners
            this.removeAllListeners();
            
            console.log('ProcessManager cleaned up');
            
        } catch (error) {
            console.warn(`Error cleaning up ProcessManager: ${error.message}`);
        }
    }
}

module.exports = ProcessManager;