/**
 * Interactive Feedback MCP - Frontend JavaScript
 * FeedbackUI class implementation for Task 6
 * 
 * Author: STMMO Project
 * Version: 1.0.0
 */

/**
 * FeedbackUI Class
 * Manages user interface and backend interactions
 */
class FeedbackUI {
    constructor() {
        // Properties initialization
        this.ws = null;
        this.config = null;
        this.isCommandSectionVisible = false;
        this.isProcessRunning = false;
        this.elements = {};
        
        // Speech to Text properties
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
        
        // File Browser controls
        this.isFilePickerOpen = false;
        this.currentPath = '';
        this.pathHistory = [];
        this.cursorPosition = 0;
        this.selectedItemIndex = -1;
        this.fileItems = [];
        
        // Initialize
        this.initializeElements();
        this.setupEventListeners();
        this.loadConfig();
        this.connectWebSocket();
        
        // Initialize language switching
        initializeLanguageSwitch();
    }
    
    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            // Project directory display
            projectDirectory: document.getElementById('project-directory'),
            
            // Toggle command section
            toggleCommandBtn: document.getElementById('toggle-command-btn'),
            commandSection: document.getElementById('command-section'),
            
            // Command controls
            commandInput: document.getElementById('command-input'),
            runBtn: document.getElementById('run-btn'),
            autoExecuteCheckbox: document.getElementById('auto-execute-checkbox'),
            saveConfigBtn: document.getElementById('save-config-btn'),
            
            // Console
            consoleOutput: document.getElementById('console-output'),
            clearConsoleBtn: document.getElementById('clear-console-btn'),
            
            // Feedback
            promptText: document.getElementById('prompt-text'),
            feedbackTextarea: document.getElementById('feedback-textarea'),
            submitFeedbackBtn: document.getElementById('submit-feedback-btn'),
            
            // Speech to Text controls
            micBtn: document.getElementById('mic-btn'),
            micStatus: document.getElementById('mic-status'),
            recordingIndicator: document.getElementById('recording-indicator'),
            recordingTimer: document.getElementById('recording-timer'),
            transcriptionStatus: document.getElementById('transcription-status'),
            
            // File Browser controls
            filePickerDropdown: document.getElementById('file-picker-dropdown'),
            currentPathDisplay: document.getElementById('current-path'),
            fileList: document.getElementById('file-list'),
            closeFilePickerBtn: document.getElementById('close-file-picker'),
            goBackBtn: document.getElementById('go-back-btn'),
            filePickerStatus: document.getElementById('file-picker-status'),
            multiSelectStatus: document.getElementById('multi-select-status'),
            
            // Auto MCP request checkbox
            autoMcpCheckbox: document.getElementById('auto-mcp-request'),
            autoMcpLabel: document.getElementById('auto-mcp-label')
        };
        
        // Multi-selection state
        this.selectedFiles = new Set();
        this.isMultiSelectMode = false;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle command section
        if (this.elements.toggleCommandBtn) {
            this.elements.toggleCommandBtn.addEventListener('click', () => {
                this.toggleCommandSection();
            });
        }
        
        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
        
                const newLang = currentLanguage === 'en' ? 'vi' : 'en';
        
                
                currentLanguage = newLang;
                updateLanguage();
                saveLanguagePreference();
                
        
            });
        }
        
        // Command execution
        if (this.elements.runBtn) {
            this.elements.runBtn.addEventListener('click', () => {
                this.handleRunCommand();
            });
        }
        
        if (this.elements.commandInput) {
            this.elements.commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleRunCommand();
                }
            });
        }
        
        // Configuration management
        if (this.elements.autoExecuteCheckbox) {
            this.elements.autoExecuteCheckbox.addEventListener('change', () => {
                this.updateConfig();
            });
        }
        
        if (this.elements.commandInput) {
            this.elements.commandInput.addEventListener('input', () => {
                this.updateConfig();
            });
        }
        
        if (this.elements.saveConfigBtn) {
            this.elements.saveConfigBtn.addEventListener('click', () => {
                this.saveConfig();
            });
        }
        
        // Feedback submission
        if (this.elements.submitFeedbackBtn) {
            this.elements.submitFeedbackBtn.addEventListener('click', () => {
                this.handleSubmitFeedback();
            });
        }
        
        if (this.elements.feedbackTextarea) {
            this.elements.feedbackTextarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.handleSubmitFeedback();
                }
            });
        }
        
        // Speech to Text - Microphone button
        if (this.elements.micBtn) {
            this.elements.micBtn.addEventListener('click', () => {
                this.handleMicrophoneClick();
            });
        }
        
        // Utility functions
        if (this.elements.clearConsoleBtn) {
            this.elements.clearConsoleBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
        
        // File Browser event listeners
        if (this.elements.feedbackTextarea) {
            this.elements.feedbackTextarea.addEventListener('input', (e) => this.handleTextareaInput(e));
            this.elements.feedbackTextarea.addEventListener('keydown', (e) => this.handleTextareaKeydown(e));
        }
        
        if (this.elements.closeFilePickerBtn) {
            this.elements.closeFilePickerBtn.addEventListener('click', () => this.closeFilePicker());
        }
        
        if (this.elements.goBackBtn) {
            this.elements.goBackBtn.addEventListener('click', () => this.goBackDirectory());
        }
        
        // Auto MCP request checkbox listener
        if (this.elements.autoMcpCheckbox) {
            this.elements.autoMcpCheckbox.addEventListener('change', (e) => this.handleAutoMcpToggle(e));
            
            // Initialize auto MCP request if checked
            if (this.elements.autoMcpCheckbox.checked) {
                this.addMcpRequestToTextarea();
            }
        }
        
        // Close file picker when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isFilePickerOpen && !this.elements.filePickerDropdown.contains(e.target) && e.target !== this.elements.feedbackTextarea) {
                this.closeFilePicker();
            }
        });
    }
    
    /**
     * Load configuration from server
     */
    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();
            
            if (data) {
                this.config = data.config || {};
                
                // Update project directory display
                if (this.elements.projectDirectory && data.projectDirectory) {
                    this.elements.projectDirectory.textContent = data.projectDirectory;
                }
                
                // Update prompt display with markdown support
                if (this.elements.promptText) {
                    if (data.prompt && data.prompt.trim() !== '') {
                        // Process prompt with markdown support
                        const processedPrompt = processFeedbackWithMarkdown(data.prompt);
                        this.elements.promptText.innerHTML = processedPrompt;
                        
                        // Add scroll functionality for long content
                        const promptContainer = this.elements.promptText.parentElement;
                        if (promptContainer) {
                            promptContainer.style.maxHeight = '300px';
                            promptContainer.style.overflowY = 'auto';
                            promptContainer.style.scrollBehavior = 'smooth';
                        }
                    } else {
                        // Fallback if no prompt provided
                        this.elements.promptText.textContent = translations[currentLanguage] ? 
                            translations[currentLanguage].loadingPrompt : 
                            'Loading prompt...';
                    }
                }
                
                // Update UI elements with config values
                if (this.elements.commandInput && this.config.command) {
                    this.elements.commandInput.value = this.config.command;
                }
                
                if (this.elements.autoExecuteCheckbox && this.config.autoExecute !== undefined) {
                    this.elements.autoExecuteCheckbox.checked = this.config.autoExecute;
                }
                
                // Set initial visibility states
                if (this.config.commandSectionVisible !== undefined) {
                    this.isCommandSectionVisible = this.config.commandSectionVisible;
                    this.updateCommandSectionVisibility();
                }
                
                // Auto-execute command if configured
                if (this.config.autoExecute && this.config.command) {
                    setTimeout(() => {
                        this.handleRunCommand();
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }
    
    /**
     * Update local config object
     */
    updateConfig() {
        if (!this.config) this.config = {};
        
        // Sync with form values
        if (this.elements.commandInput) {
            this.config.command = this.elements.commandInput.value;
        }
        
        if (this.elements.autoExecuteCheckbox) {
            this.config.autoExecute = this.elements.autoExecuteCheckbox.checked;
        }
        
        this.config.commandSectionVisible = this.isCommandSectionVisible;
    }
    
    /**
     * Save configuration to server
     */
    async saveConfig() {
        try {
            this.updateConfig();
            
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show confirmation message
                this.showMessage('Configuration saved successfully!', 'success');
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            this.showMessage('Error saving configuration', 'error');
        }
    }
    
    /**
     * Connect to WebSocket server
     */
    connectWebSocket() {
        // Determine protocol (ws/wss) based on location.protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
        
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
        
                // Auto-reconnect logic
                setTimeout(() => {
                    this.connectWebSocket();
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }
    
    /**
     * Handle WebSocket messages
     * @param {Object} message - WebSocket message
     */
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'logs':
                // Replace console content
                if (this.elements.consoleOutput) {
                    this.elements.consoleOutput.textContent = message.data;
                    this.scrollConsoleToBottom();
                }
                break;
                
            case 'log':
                // Append to console
                this.appendLog(message.data);
                break;
                
            case 'processStatus':
                // Update UI state
                this.updateProcessStatus(message.data);
                break;
                
            default:
    
        }
    }
    
    /**
     * Toggle command section visibility
     */
    toggleCommandSection() {
        this.isCommandSectionVisible = !this.isCommandSectionVisible;
        this.updateCommandSectionVisibility();
        // Update toggle button text after visibility change
        setTimeout(() => updateLanguage(), 100);
        this.updateConfig();
    }
    
    /**
     * Update command section visibility
     */
    updateCommandSectionVisibility() {
        if (this.elements.commandSection) {
            if (this.isCommandSectionVisible) {
                this.elements.commandSection.classList.remove('hidden');
                this.elements.commandSection.classList.add('fade-in');
            } else {
                this.elements.commandSection.classList.add('hidden');
                this.elements.commandSection.classList.remove('fade-in');
            }
        }
        
        if (this.elements.toggleCommandBtn) {
            // Update button text with current language
            const key = this.isCommandSectionVisible ? 'hideCommand' : 'showCommand';
            const toggleText = this.elements.toggleCommandBtn.querySelector('[data-lang-key]');
            
            if (toggleText) {
                // Update the text span with proper data-lang-key
                toggleText.textContent = translations[currentLanguage][key] || (this.isCommandSectionVisible ? 'Hide' : 'Show');
                toggleText.setAttribute('data-lang-key', key);
            } else {
                // Fallback for buttons without structured text
                const helpIcon = this.elements.toggleCommandBtn.querySelector('.help-icon');
                const helpIconHtml = helpIcon ? helpIcon.outerHTML : '';
                const buttonText = translations[currentLanguage][key] || (this.isCommandSectionVisible ? 'Hide Command Section' : 'Show Command Section');
                this.elements.toggleCommandBtn.innerHTML = helpIconHtml + buttonText;
            }
        }
    }
    
    /**
     * Handle run command button click
     */
    async handleRunCommand() {
        if (this.isProcessRunning) {
            // Stop command
            await this.stopCommand();
        } else {
            // Run command
            const command = this.elements.commandInput?.value.trim();
            if (command) {
                await this.runCommand(command);
            }
        }
    }
    
    /**
     * Run command via API
     * @param {string} command - Command to run
     */
    async runCommand(command) {
        try {
            const response = await fetch('/api/run-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isProcessRunning = true;
                this.updateRunButton();
            } else {
                throw new Error('Failed to run command');
            }
        } catch (error) {
            console.error('Error running command:', error);
            this.showMessage('Error running command', 'error');
        }
    }
    
    /**
     * Stop command via API
     */
    async stopCommand() {
        try {
            const response = await fetch('/api/stop-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isProcessRunning = false;
                this.updateRunButton();
            } else {
                throw new Error('Failed to stop command');
            }
        } catch (error) {
            console.error('Error stopping command:', error);
            this.showMessage('Error stopping command', 'error');
        }
    }
    
    /**
     * Update run button text and style
     */
    updateRunButton() {
        if (this.elements.runBtn) {
            if (this.isProcessRunning) {
                this.elements.runBtn.textContent = 'Stop';
                this.elements.runBtn.className = 'btn btn-danger';
            } else {
                this.elements.runBtn.textContent = 'Run';
                this.elements.runBtn.className = 'btn btn-primary';
            }
        }
    }
    
    /**
     * Update process status from WebSocket
     * @param {Object} status - Process status data
     */
    updateProcessStatus(status) {
        this.isProcessRunning = status.running || false;
        this.updateRunButton();
        
        // Focus management based on process state
        if (!this.isProcessRunning && this.elements.feedbackTextarea) {
            this.elements.feedbackTextarea.focus();
        }
    }
    
    /**
     * Append log text to console
     * @param {string} text - Log text to append
     */
    appendLog(text) {
        if (this.elements.consoleOutput) {
            this.elements.consoleOutput.textContent += text;
            this.scrollConsoleToBottom();
        }
    }
    
    /**
     * Clear console logs
     */
    clearLogs() {
        if (this.elements.consoleOutput) {
            this.elements.consoleOutput.textContent = '';
        }
    }
    
    /**
     * Scroll console to bottom
     */
    scrollConsoleToBottom() {
        if (this.elements.consoleOutput) {
            this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
        }
    }
    
    /**
     * Handle submit feedback button click
     */
    async handleSubmitFeedback() {
        const feedback = this.elements.feedbackTextarea?.value.trim();
        
        if (!feedback) {
            this.showMessage('Please enter feedback before submitting', 'error');
            return;
        }
        
        try {
            // Disable form during submission
            this.setFormDisabled(true);
            
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('Feedback submitted successfully!', 'success');
                
                // Auto-close window after delay
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            this.showMessage('Error submitting feedback', 'error');
            this.setFormDisabled(false);
        }
    }
    
    /**
     * Set form disabled state
     * @param {boolean} disabled - Whether to disable the form
     */
    setFormDisabled(disabled) {
        if (this.elements.feedbackTextarea) {
            this.elements.feedbackTextarea.disabled = disabled;
        }
        
        if (this.elements.submitFeedbackBtn) {
            this.elements.submitFeedbackBtn.disabled = disabled;
            this.elements.submitFeedbackBtn.textContent = disabled 
                ? 'Submitting...' 
                : 'Submit Feedback';
        }
    }
    
    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.className = `message message-${type} fade-in`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#28a745';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#dc3545';
                break;
            default:
                messageEl.style.backgroundColor = '#4a9eff';
        }
        
        // Add to page
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
    
    /**
     * Handle microphone button click
     */
    async handleMicrophoneClick() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    /**
     * Start audio recording
     */
    async startRecording() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Initialize MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            // Setup event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingUI(true);
            this.startRecordingTimer();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showMessage('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.', 'error');
        }
    }
    
    /**
     * Stop audio recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks to release microphone
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            // Update UI
            this.updateRecordingUI(false);
            this.stopRecordingTimer();
        }
    }
    
    /**
     * Process recorded audio and send to speech-to-text API
     */
    async processRecording() {
        if (this.audioChunks.length === 0) {
            this.showMessage('Không có dữ liệu âm thanh để xử lý.', 'error');
            return;
        }
        
        try {
            // Show transcription status
            this.showTranscriptionStatus(true);
            
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Create form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            // Send to speech-to-text API
            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Insert transcribed text into feedback textarea
                const currentText = this.elements.feedbackTextarea.value;
                const newText = currentText + (currentText ? ' ' : '') + result.text;
                this.elements.feedbackTextarea.value = newText;
                
                // Focus on textarea
                this.elements.feedbackTextarea.focus();
                
                this.showMessage('Chuyển đổi giọng nói thành công!', 'success');
            } else {
                throw new Error(result.error || 'Lỗi chuyển đổi giọng nói');
            }
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showMessage('Lỗi khi chuyển đổi giọng nói: ' + error.message, 'error');
        } finally {
            this.showTranscriptionStatus(false);
        }
    }
    
    /**
     * Update recording UI state
     */
    updateRecordingUI(isRecording) {
        if (isRecording) {
            this.elements.micBtn.classList.add('recording');
            this.elements.micStatus.textContent = currentLanguage === 'vi' ? 'Đang ghi' : 'Recording';
            this.elements.recordingIndicator.classList.remove('hidden');
        } else {
            this.elements.micBtn.classList.remove('recording');
            this.elements.micStatus.textContent = currentLanguage === 'vi' ? 'Sẵn sàng' : 'Ready';
            this.elements.recordingIndicator.classList.add('hidden');
        }
    }
    
    /**
     * Start recording timer
     */
    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.elements.recordingTimer.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    /**
     * Stop recording timer
     */
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.elements.recordingTimer.textContent = '00:00';
    }
    
    /**
     * Show/hide transcription status
     */
    showTranscriptionStatus(show) {
        if (show) {
            this.elements.transcriptionStatus.classList.remove('hidden');
        } else {
            this.elements.transcriptionStatus.classList.add('hidden');
        }
    }
    
    /**
     * Handle textarea input for file picker trigger
     */
    handleTextareaInput(e) {
        const textarea = e.target;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        
        // Check if user typed @ at the beginning of a line or after whitespace
        const atMatch = textBeforeCursor.match(/(^|\s)@$/);
        
        if (atMatch) {
            this.cursorPosition = cursorPos;
            this.openFilePicker();
        } else if (this.isFilePickerOpen) {
            // Close file picker if @ is deleted or cursor moved away
            const currentAtMatch = textBeforeCursor.match(/(^|\s)@[^\s]*$/);
            if (!currentAtMatch) {
                this.closeFilePicker();
            }
        }
    }
    
    /**
     * Handle keyboard navigation in file picker
     */
    handleTextareaKeydown(e) {
        if (!this.isFilePickerOpen) return;
        
        // Update multi-select mode based on Shift key
        this.isMultiSelectMode = e.shiftKey;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(-1);
                break;
            case 'ArrowRight':
            case 'Enter':
                e.preventDefault();
                this.selectCurrentItem(e.shiftKey);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.goBackDirectory();
                break;
            case 'Escape':
                e.preventDefault();
                this.closeFilePicker();
                break;
        }
    }
    
    /**
     * Move selection in file picker
     */
    moveSelection(direction) {
        if (this.fileItems.length === 0) return;
        
        this.selectedItemIndex += direction;
        
        // Wrap around
        if (this.selectedItemIndex < 0) {
            this.selectedItemIndex = this.fileItems.length - 1;
        } else if (this.selectedItemIndex >= this.fileItems.length) {
            this.selectedItemIndex = 0;
        }
        
        this.updateSelectionHighlight();
    }
    
    /**
     * Select current highlighted item
     */
    selectCurrentItem(isMultiSelect = false) {
        if (this.selectedItemIndex >= 0 && this.selectedItemIndex < this.fileItems.length) {
            const item = this.fileItems[this.selectedItemIndex];
            
            if (item.type === 'directory') {
                // Directories are always navigated to, not selected
                this.navigateToDirectory(item.path);
            } else {
                // Handle file selection
                if (isMultiSelect) {
                    this.toggleFileSelection(item.path);
                } else {
                    // Single selection - clear previous, select current and close
                    this.selectedFiles.clear();
                    this.selectFile(item.path);
                }
            }
        }
    }
    
    /**
     * Update visual highlight for selected item
     */
    updateSelectionHighlight() {
        const fileItems = this.elements.fileList.querySelectorAll('.file-item');
        fileItems.forEach((item, index) => {
            if (index === this.selectedItemIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    /**
     * Open file picker dropdown
     */
    async openFilePicker() {
        this.isFilePickerOpen = true;
        this.currentPath = '';
        this.pathHistory = [];
        this.selectedItemIndex = -1;
        
        if (this.elements.filePickerDropdown) {
            this.elements.filePickerDropdown.classList.remove('hidden');
            this.elements.filePickerDropdown.style.display = 'block';
        }
        
        await this.loadDirectoryContents('');
    }
    
    /**
     * Close file picker dropdown
     */
    closeFilePicker() {
        this.isFilePickerOpen = false;
        
        if (this.elements.filePickerDropdown) {
            this.elements.filePickerDropdown.classList.add('hidden');
            this.elements.filePickerDropdown.style.display = 'none';
        }
        
        this.currentPath = '';
        this.pathHistory = [];
        this.selectedFiles.clear();
        this.isMultiSelectMode = false;
        this.updateMultiSelectStatus();
    }
    
    /**
     * Load directory contents from server
     */
    async loadDirectoryContents(path) {
        try {
            const response = await fetch(`/api/browse-files?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentPath = path;
                this.updateCurrentPathDisplay();
                this.renderFileList(data.items);
                this.updateGoBackButton();
            } else {
                console.error('Failed to load directory:', data.error);
            }
        } catch (error) {
            console.error('Error loading directory:', error);
        }
    }
    
    /**
     * Update current path display
     */
    updateCurrentPathDisplay() {
        if (this.elements.currentPathDisplay) {
            this.elements.currentPathDisplay.textContent = this.currentPath || 'Project Root';
        }
    }
    
    /**
     * Render file list in dropdown
     */
    renderFileList(items) {
        if (!this.elements.fileList) return;
        
        this.fileItems = items;
        this.selectedItemIndex = -1;
        this.elements.fileList.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `file-item ${item.type}`;
            
            // Add selected class if file is in selectedFiles
            if (item.type === 'file' && this.selectedFiles.has(item.path)) {
                itemElement.classList.add('multi-selected');
            }
            
            const icon = item.type === 'directory' ? '📁' : '📄';
            const checkmark = (item.type === 'file' && this.selectedFiles.has(item.path)) ? '✓ ' : '';
            
            itemElement.innerHTML = `
                <span class="file-icon">${icon}</span>
                <span class="file-name">${checkmark}${item.name}</span>
            `;
            
            itemElement.addEventListener('click', (e) => {
                if (item.type === 'directory') {
                    this.navigateToDirectory(item.path);
                } else {
                    if (e.shiftKey) {
                        this.toggleFileSelection(item.path);
                    } else {
                        this.selectedFiles.clear();
                        this.selectFile(item.path);
                    }
                }
            });
            
            this.elements.fileList.appendChild(itemElement);
        });
    }
    
    /**
     * Update file list display to reflect current selections
     */
    updateFileListDisplay() {
        if (!this.elements.fileList) return;
        
        const fileItems = this.elements.fileList.querySelectorAll('.file-item.file');
        fileItems.forEach((itemElement, index) => {
            const item = this.fileItems.find(i => i.type === 'file' && i.name === itemElement.querySelector('.file-name').textContent.replace('✓ ', ''));
            if (item) {
                const isSelected = this.selectedFiles.has(item.path);
                const nameSpan = itemElement.querySelector('.file-name');
                
                if (isSelected) {
                    itemElement.classList.add('multi-selected');
                    if (!nameSpan.textContent.startsWith('✓ ')) {
                        nameSpan.textContent = '✓ ' + nameSpan.textContent;
                    }
                } else {
                    itemElement.classList.remove('multi-selected');
                    nameSpan.textContent = nameSpan.textContent.replace('✓ ', '');
                }
            }
        });
        this.updateMultiSelectStatus();
    }

    /**
     * Update multi-select status display
     */
    updateMultiSelectStatus() {
        const count = this.selectedFiles.size;
        if (count > 0) {
            this.elements.multiSelectStatus.textContent = `${count} files selected • Press Escape to finish`;
            this.elements.multiSelectStatus.classList.remove('hidden');
            this.elements.filePickerStatus.classList.add('hidden');
        } else {
            this.elements.multiSelectStatus.classList.add('hidden');
            this.elements.filePickerStatus.classList.remove('hidden');
        }
    }

    /**
     * Add file to textarea immediately when selected
     */
    addFileToTextarea(filePath) {
        if (this.elements.feedbackTextarea) {
            const textarea = this.elements.feedbackTextarea;
            const currentValue = textarea.value;
            
            // Find the @ symbol position and replace it with files
            const textBeforeCursor = currentValue.substring(0, this.cursorPosition);
            const atMatch = textBeforeCursor.match(/(^|\s)@$/);
            
            if (atMatch) {
                const beforeAt = currentValue.substring(0, this.cursorPosition - 1); // Remove @
                const afterCursor = currentValue.substring(this.cursorPosition);
                
                // Get all selected files including the new one
                const allFiles = Array.from(this.selectedFiles);
                if (!allFiles.includes(filePath)) {
                    allFiles.push(filePath);
                }
                
                const filesList = allFiles.join('\n');
                const newValue = beforeAt + filesList + afterCursor;
                textarea.value = newValue;
                
                // Update cursor position
                const newCursorPos = beforeAt.length + filesList.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                
                // Update stored cursor position for future operations
                this.cursorPosition = beforeAt.length + 1; // Position after the file list
                
                // Trigger input event
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    /**
     * Remove file from textarea immediately when deselected
     */
    removeFileFromTextarea(filePath) {
        if (this.elements.feedbackTextarea) {
            const textarea = this.elements.feedbackTextarea;
            const currentValue = textarea.value;
            
            // Remove the specific file path from textarea
            const lines = currentValue.split('\n');
            const filteredLines = lines.filter(line => line.trim() !== filePath.trim());
            const newValue = filteredLines.join('\n');
            
            textarea.value = newValue;
            
            // Set cursor position
            const newCursorPos = newValue.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            
            // Trigger input event
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    /**
     * Handle auto MCP request checkbox toggle
     */
    handleAutoMcpToggle(event) {
        if (event.target.checked) {
            this.addMcpRequestToTextarea();
        } else {
            this.removeMcpRequestFromTextarea();
        }
    }
    
    /**
     * Add MCP request line to textarea
     */
    addMcpRequestToTextarea() {
        const textarea = this.elements.feedbackTextarea;
        const currentLang = this.getCurrentLanguage();
        
        const mcpRequestText = currentLang === 'vi' 
            ? 'Hãy call mcp Feedback khi giải quyết xong vấn đề trên.'
            : 'Please call MCP Feedback when the above issue is resolved.';
        
        // Check if MCP request already exists
        if (!textarea.value.includes(mcpRequestText)) {
            const currentContent = textarea.value.trim();
            const newContent = currentContent 
                ? `${currentContent}\n\n${mcpRequestText}`
                : mcpRequestText;
            
            textarea.value = newContent;
            
            // Dispatch input event
            const inputEvent = new Event('input', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
        }
    }
    
    /**
     * Remove MCP request line from textarea
     */
    removeMcpRequestFromTextarea() {
        const textarea = this.elements.feedbackTextarea;
        
        const mcpRequestTextVi = 'Hãy call mcp Feedback khi giải quyết xong vấn đề trên.';
        const mcpRequestTextEn = 'Please call MCP Feedback when the above issue is resolved.';
        
        let content = textarea.value;
        
        // Remove both Vietnamese and English versions
        content = content.replace(new RegExp(`\\n?\\n?${mcpRequestTextVi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
        content = content.replace(new RegExp(`\\n?\\n?${mcpRequestTextEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
        
        // Clean up extra newlines
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        
        textarea.value = content;
        
        // Dispatch input event
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
    }
    
    /**
     * Get current language setting
     */
    getCurrentLanguage() {
        const langToggle = document.querySelector('.lang-toggle');
        return langToggle && langToggle.textContent.includes('EN') ? 'vi' : 'en';
    }
    
    /**
     * Navigate to directory
     */
    async navigateToDirectory(dirPath) {
        // Add current path to history before navigating
        if (this.currentPath !== '') {
            this.pathHistory.push(this.currentPath);
        }
        
        await this.loadDirectoryContents(dirPath);
    }
    
    /**
     * Go back to previous directory
     */
    async goBackDirectory() {
        if (this.pathHistory.length > 0) {
            const previousPath = this.pathHistory.pop();
            await this.loadDirectoryContents(previousPath);
        } else if (this.currentPath !== '') {
            // If we're not at root and no history, go to root
            await this.loadDirectoryContents('');
        }
    }
    
    /**
     * Update go back button state
     */
    updateGoBackButton() {
        if (this.elements.goBackBtn) {
            this.elements.goBackBtn.disabled = this.pathHistory.length === 0;
        }
    }
    
    /**
     * Toggle file selection for multi-select
     */
    toggleFileSelection(filePath) {
        if (this.selectedFiles.has(filePath)) {
            this.selectedFiles.delete(filePath);
            this.removeFileFromTextarea(filePath);
        } else {
            this.selectedFiles.add(filePath);
            this.addFileToTextarea(filePath);
        }
        this.updateFileListDisplay();
    }
    
    /**
     * Select file(s) and insert path(s) into textarea
     */
    selectFile(filePath) {
        // Single selection only - insert file and close picker
        this.insertSingleFile(filePath);
        this.closeFilePicker();
    }
    
    /**
     * Insert single file path into textarea
     */
    insertSingleFile(filePath) {
        if (this.elements.feedbackTextarea) {
            const textarea = this.elements.feedbackTextarea;
            const currentValue = textarea.value;
            
            // Find the @ symbol position and replace it with file path
            const textBeforeCursor = currentValue.substring(0, this.cursorPosition);
            const atMatch = textBeforeCursor.match(/(^|\s)@$/);
            
            if (atMatch) {
                const beforeAt = currentValue.substring(0, this.cursorPosition - 1); // Remove @
                const afterCursor = currentValue.substring(this.cursorPosition);
                
                // Insert file path
                const newValue = beforeAt + filePath + afterCursor;
                textarea.value = newValue;
                
                // Set cursor position after inserted path
                const newCursorPos = beforeAt.length + filePath.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                
                // Trigger input event to update any listeners
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
    
    /**
     * Insert multiple selected files into textarea
     */
    insertMultipleFiles() {
        if (this.elements.feedbackTextarea && this.selectedFiles.size > 0) {
            const textarea = this.elements.feedbackTextarea;
            const currentValue = textarea.value;
            
            // Find the @ symbol position and replace it with selected files
            const textBeforeCursor = currentValue.substring(0, this.cursorPosition);
            const atMatch = textBeforeCursor.match(/(^|\s)@$/);
            
            if (atMatch) {
                const beforeAt = currentValue.substring(0, this.cursorPosition - 1); // Remove @
                const afterCursor = currentValue.substring(this.cursorPosition);
                
                // Join selected files with newlines
                const filesList = Array.from(this.selectedFiles).join('\n');
                const newValue = beforeAt + filesList + afterCursor;
                textarea.value = newValue;
                
                // Set cursor position after inserted paths
                const newCursorPos = beforeAt.length + filesList.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                
                // Trigger input event to update any listeners
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FeedbackUI();
    
    // Auto-focus on feedback input
    const feedbackTextarea = document.getElementById('feedback-textarea');
    if (feedbackTextarea) {
        setTimeout(() => {
            feedbackTextarea.focus();
        }, 500);
    }
    
    // Initialize markdown support
    initializeMarkdownSupport();
});

/**
  * Initialize markdown support for terminal interface
  */
 function initializeMarkdownSupport() {
     // Add markdown rendering capabilities
     if (typeof showdown !== 'undefined') {
         // Initialize showdown converter with options
         window.markdownConverter = new showdown.Converter({
             tables: true,
             strikethrough: true,
             tasklists: true,
             ghCodeBlocks: true,
             smoothLivePreview: true,
             simpleLineBreaks: true,
             requireSpaceBeforeHeadingText: true
         });
     
     }
     
     // Add markdown support hint
     addMarkdownPreviewToggle();
     
     // Initialize syntax highlighting if available
     if (typeof hljs !== 'undefined') {
         hljs.highlightAll();
     }
 }

/**
  * Add markdown support to feedback textarea
  */
 function addMarkdownPreviewToggle() {
     // Markdown support is now integrated without UI hints
     // This function is kept for compatibility but no longer adds UI elements

 }

/**
  * Render markdown text to HTML with proper line break handling
  * @param {string} markdownText - The markdown text to render
  * @returns {string} - The rendered HTML
  */
 function renderMarkdown(markdownText) {
     if (!markdownText.trim()) {
         return '<p class="text-gray-500">No content to preview</p>';
     }
     
     // Handle double line breaks (\n\n) for paragraph separation
     markdownText = markdownText.replace(/\\n\\n/g, '\n\n');
     markdownText = markdownText.replace(/\\n/g, '\n');
     
     // Use showdown library if available, otherwise basic formatting
     if (window.markdownConverter) {
         const htmlContent = window.markdownConverter.makeHtml(markdownText);
         return `<div class="markdown-content">${htmlContent}</div>`;
     } else {
         // Basic markdown-like formatting
         const htmlContent = basicMarkdownRender(markdownText);
         return `<div class="markdown-content">${htmlContent}</div>`;
     }
 }

/**
  * Basic markdown rendering fallback with proper line break handling
  * @param {string} text - The text to format
  * @returns {string} - The formatted HTML
  */
 function basicMarkdownRender(text) {
     return text
         // Headers
         .replace(/^### (.*$)/gim, '<h3>$1</h3>')
         .replace(/^## (.*$)/gim, '<h2>$1</h2>')
         .replace(/^# (.*$)/gim, '<h1>$1</h1>')
         // Bold
         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
         // Italic
         .replace(/\*(.*?)\*/g, '<em>$1</em>')
         // Code blocks
         .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
         // Inline code
         .replace(/`(.*?)`/g, '<code>$1</code>')
         // Links
         .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
         // Double line breaks for paragraphs
         .replace(/\n\n/g, '</p><p>')
         // Single line breaks
         .replace(/\n/g, '<br>')
         // Wrap in paragraph tags
         .replace(/^/, '<p>')
         .replace(/$/, '</p>')
         // Clean up empty paragraphs
         .replace(/<p><\/p>/g, '');
 }

/**
  * Enhanced console output with markdown support
  * @param {string} content - The content to display
  * @param {boolean} isMarkdown - Whether to render as markdown
  */
 function updateConsoleWithMarkdown(content, isMarkdown = false) {
     const consoleOutput = document.getElementById('console-output');
     if (!consoleOutput) return;
     
     if (isMarkdown) {
         consoleOutput.innerHTML = renderMarkdown(content);
     } else {
         consoleOutput.textContent = content;
     }
     
     // Scroll to bottom
     consoleOutput.scrollTop = consoleOutput.scrollHeight;
     
     // Highlight code blocks if hljs is available
     if (typeof hljs !== 'undefined') {
         consoleOutput.querySelectorAll('pre code').forEach((block) => {
             hljs.highlightElement(block);
         });
     }
 }
 
 /**
  * Process feedback content with markdown support
  * @param {string} feedbackText - The feedback text to process
  * @returns {string} - The processed feedback content
  */
 function processFeedbackWithMarkdown(feedbackText) {
     if (!feedbackText.trim()) {
         return feedbackText;
     }
     
     // Handle escape sequences for line breaks
     let processedText = feedbackText
         .replace(/\\n\\n/g, '\n\n')
         .replace(/\\n/g, '\n');
     
     // Check if content contains markdown syntax
     const hasMarkdown = /[*_`#\[\]]/g.test(processedText) || /```/g.test(processedText);
     
     if (hasMarkdown) {
         // Return markdown-rendered content
         return renderMarkdown(processedText);
     } else {
         // Return plain text with proper line breaks
         return processedText.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
     }
 }

// Language translations
const translations = {
    en: {
        title: 'Interactive Feedback MCP Terminal',
        toggleCommand: 'Toggle Command Section',
        showCommand: 'Show',
        hideCommand: 'Hide',
        commandPlaceholder: 'Enter command to run...',
        runButton: 'Run',
        autoExecute: 'Auto-execute on load',
        saveConfig: 'Save Config',
        consoleOutput: 'Console Output',
        clearConsole: 'Clear',
        feedbackPrompt: 'Feedback Prompt',
        loadingPrompt: 'Loading prompt...',
        feedbackPlaceholder: 'Enter your feedback here...',
        submitFeedback: 'Submit Feedback',
        autoMcpRequest: 'Automatically add MCP feedback request',
        micReady: 'Ready',
        recording: 'Recording...',
        transcribing: 'Transcribing...'
    },
    vi: {
        title: 'Interactive Feedback MCP Terminal',
        toggleCommand: 'Chuyển đổi Phần Lệnh',
        showCommand: 'Hiện',
        hideCommand: 'Ẩn',
        commandPlaceholder: 'Nhập lệnh để chạy...',
        runButton: 'Chạy',
        autoExecute: 'Tự động thực thi khi tải',
        saveConfig: 'Lưu Cấu hình',
        consoleOutput: 'Kết quả Console',
        clearConsole: 'Xóa',
        feedbackPrompt: 'Yêu cầu Phản hồi',
        loadingPrompt: 'Đang tải yêu cầu...',
        feedbackPlaceholder: 'Nhập phản hồi của bạn tại đây...',
        submitFeedback: 'Gửi Phản hồi',
        autoMcpRequest: 'Tự động thêm yêu cầu MCP feedback',
        micReady: 'Sẵn sàng',
        recording: 'Đang ghi âm...',
        transcribing: 'Đang chuyển đổi...'
    }
};

let currentLanguage = 'en';

/**
 * Initialize language switching functionality
 */
function initializeLanguageSwitch() {
    // Load saved language preference
    loadSavedLanguage();
    
    // Initial language update
    updateLanguage();
}

/**
 * Switch language
 */
function switchLanguage(lang) {
    if (translations[lang] && currentLanguage !== lang) {
        currentLanguage = lang;
        updateLanguage();
        saveLanguagePreference();
    }
}

/**
 * Update interface according to selected language
 */
function updateLanguage() {

    const langData = translations[currentLanguage];
    
    if (!langData) {
        console.error('No translation data for language:', currentLanguage);
        return;
    }
    
    // Update page title
    if (langData.title) {
        document.title = langData.title;
    }
    
    // Update language display first
    const langDisplay = document.getElementById('lang-display');
    if (langDisplay) {
        langDisplay.textContent = currentLanguage.toUpperCase();
    
    }
    
    // Update all translatable elements except prompt text
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        
        // Special handling for prompt text - preserve real content
        if (element.id === 'prompt-text') {
            const currentText = element.textContent.trim();
            // Only update if it's clearly a loading message
            if (currentText === 'Loading prompt...' || 
                currentText === 'Đang tải yêu cầu...' ||
                currentText === '' ||
                currentText === langData.loadingPrompt) {
                element.textContent = langData.loadingPrompt || 'Loading prompt...';
            }
            return; // Always skip further processing for prompt text
        }
        
        if (langData[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = langData[key];
            } else {
                // Preserve help icons when updating text
                const helpIcon = element.querySelector('.help-icon');
                const helpIconHtml = helpIcon ? helpIcon.outerHTML : '';
                const textContent = langData[key];
                
                if (helpIcon) {
                    element.innerHTML = textContent + ' ' + helpIconHtml;
                } else {
                    element.textContent = textContent;
                }
            }
        }
    });
    
    // Update toggle button text based on current state
    const toggleBtn = document.getElementById('toggle-command-btn');
    const commandSection = document.getElementById('command-section');
    if (toggleBtn && commandSection) {
        const isVisible = !commandSection.classList.contains('hidden');
        const key = isVisible ? 'hideCommand' : 'toggleCommand';
        if (langData[key]) {
            const helpIcon = toggleBtn.querySelector('.help-icon');
            const helpIconHtml = helpIcon ? helpIcon.outerHTML : '';
            toggleBtn.innerHTML = helpIconHtml + langData[key];
        }
    }
    
    // Update lang attribute of html
    document.documentElement.lang = currentLanguage;
    
    // Add smooth transition effect
    document.body.style.opacity = '0.9';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    
}

/**
 * Save language preference to localStorage
 */
function saveLanguagePreference() {
    try {
        localStorage.setItem('preferredLanguage', currentLanguage);
    } catch (error) {
        console.warn('Could not save language preference:', error);
    }
}

/**
 * Load saved language from localStorage
 */
function loadSavedLanguage() {
    try {
        const saved = localStorage.getItem('preferredLanguage');
        if (saved && translations[saved]) {
            currentLanguage = saved;
        } else {
            currentLanguage = 'en'; // Default to English
        }
    } catch (error) {
        console.warn('Could not load language preference:', error);
        currentLanguage = 'en';
    }
}

/**
 * Khởi tạo giao diện placeholder
 */
function initializePlaceholder() {
    // Thêm hiệu ứng hover cho card chính
    const mainCard = document.querySelector('.bg-white.rounded-xl');
    if (mainCard) {
        mainCard.addEventListener('mouseenter', function() {
            this.classList.add('transform', 'scale-105', 'transition-transform', 'duration-200');
        });
        
        mainCard.addEventListener('mouseleave', function() {
            this.classList.remove('transform', 'scale-105');
        });
        
        mainCard.addEventListener('click', function() {
            const message = currentLanguage === 'vi' 
                ? 'Giao diện sẽ được triển khai trong Task 6!' 
                : 'Interface will be implemented in Task 6!';
            alert(message);
        });
    }
}

// ===== Configuration Manager Functions =====

/**
 * Real Configuration Manager API
 */
const ConfigAPI = {
    async loadConfig(name) {
        const response = await fetch(`/api/config/${name || 'default'}`);
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },
    
    async saveConfig(config, name) {
        const response = await fetch(`/api/config/${name || 'default'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    },
    
    async deleteConfig(name) {
        const response = await fetch(`/api/config/${name || 'default'}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    },
    
    async listConfigs() {
        const response = await fetch('/api/config');
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
};

/**
 * Configuration Manager UI Functions
 */
function initializeConfigManager() {
    // Add event listeners for config buttons
    const loadBtn = document.getElementById('loadConfigBtn');
    const saveBtn = document.getElementById('saveConfigBtn');
    const deleteBtn = document.getElementById('deleteConfigBtn');
    
    if (loadBtn) loadBtn.addEventListener('click', loadConfiguration);
    if (saveBtn) saveBtn.addEventListener('click', saveConfiguration);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteConfiguration);
}

async function loadConfiguration() {
    try {
        showNotification(languages[currentLanguage].config_loaded, 'success');
        const config = await ConfigAPI.loadConfig();
        displayConfigInUI(config);
    } catch (error) {
        showNotification('Error loading config: ' + error.message, 'error');
    }
}

async function saveConfiguration() {
    try {
        const config = getConfigFromUI();
        await ConfigAPI.saveConfig(config);
        showNotification(languages[currentLanguage].config_saved, 'success');
    } catch (error) {
        showNotification('Error saving config: ' + error.message, 'error');
    }
}

async function deleteConfiguration() {
    if (confirm('Are you sure you want to delete the configuration?')) {
        try {
            await ConfigAPI.deleteConfig();
            showNotification(languages[currentLanguage].config_deleted, 'success');
            clearConfigUI();
        } catch (error) {
            showNotification('Error deleting config: ' + error.message, 'error');
        }
    }
}

function displayConfigInUI(config) {
    // Mock display config in UI
    
}

function getConfigFromUI() {
    // Mock get config from UI
    return {
        projectName: 'Interactive Feedback MCP',
        version: '1.0.0',
        settings: {
            theme: 'dark',
            language: currentLanguage
        }
    };
}

function clearConfigUI() {
    // Mock clear config UI
    
}

// ===== Process Manager Functions =====

/**
 * Real Process Manager API
 */
const ProcessAPI = {
    async runCommand(command) {
        const response = await fetch('/api/process/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },
    
    async stopProcess(processId) {
        const response = await fetch('/api/process/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ processId })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    },
    
    async getLogs() {
        const response = await fetch('/api/process/logs');
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },
    
    async clearLogs() {
        const response = await fetch('/api/process/logs', {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    },
    
    async getStatus() {
        const response = await fetch('/api/process/status');
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
};

/**
 * Feedback API for interactive communication
 */
const FeedbackAPI = {
    async submit(feedback) {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result;
    },
    
    async getInitialData() {
        const response = await fetch('/api/initial-data');
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    },
    
    async getHistory() {
        const response = await fetch('/api/feedback/history');
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
};

/**
 * Process Manager UI Functions
 */
function initializeProcessManager() {
    // Add event listeners for process buttons
    const runBtn = document.getElementById('runCommandBtn');
    const stopBtn = document.getElementById('stopProcessBtn');
    const clearBtn = document.getElementById('clearLogsBtn');
    const commandInput = document.getElementById('commandInput');
    
    if (runBtn) runBtn.addEventListener('click', runCommand);
    if (stopBtn) stopBtn.addEventListener('click', stopProcess);
    if (clearBtn) clearBtn.addEventListener('click', clearLogs);
    
    // Enter key to run command
    if (commandInput) {
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                runCommand();
            }
        });
    }
}

async function runCommand() {
    const commandInput = document.getElementById('commandInput');
    if (!commandInput) return;
    
    const command = commandInput.value.trim();
    if (!command) return;
    
    try {
        showNotification(languages[currentLanguage].process_started, 'info');
        updateProcessStatus(true);
        
        const result = await ProcessAPI.runCommand(command);
        updateLogsDisplay();
        
        commandInput.value = '';
        updateProcessStatus(false);
    } catch (error) {
        showNotification('Error running command: ' + error.message, 'error');
        updateProcessStatus(false);
    }
}

function stopProcess() {
    try {
        const result = ProcessAPI.stopProcess();
        if (result.success) {
            showNotification(languages[currentLanguage].process_stopped, 'info');
            updateProcessStatus(false);
            updateLogsDisplay();
        } else {
            showNotification(result.message || 'No process to stop', 'warning');
        }
    } catch (error) {
        showNotification('Error stopping process: ' + error.message, 'error');
    }
}

function clearLogs() {
    try {
        ProcessAPI.clearLogs();
        updateLogsDisplay();
        showNotification(languages[currentLanguage].logs_cleared, 'info');
    } catch (error) {
        showNotification('Error clearing logs: ' + error.message, 'error');
    }
}

function updateProcessStatus(isRunning) {
    const statusElement = document.getElementById('processStatus');
    if (statusElement) {
        statusElement.textContent = isRunning ? 'Running' : 'Ready';
        statusElement.className = isRunning ? 'text-yellow-400' : 'text-green-400';
    }
}

function updateLogsDisplay() {
    const logsElement = document.getElementById('processLogs');
    if (logsElement) {
        logsElement.textContent = ProcessAPI.getLogs();
        logsElement.scrollTop = logsElement.scrollHeight;
    }
}

// ===== Utility Functions =====

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300`;
    
    // Set color based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500';
            break;
        case 'error':
            notification.className += ' bg-red-500';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500';
            break;
        default:
            notification.className += ' bg-blue-500';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== Enhanced Initialization =====

/**
 * Enhanced initialization with new features
 */
function initializeEnhancedFeatures() {
    initializeConfigManager();
    initializeProcessManager();
    initializeFeedbackSystem();
    initializeWebSocket();
    
    // Update placeholder text for command input
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
        commandInput.placeholder = languages[currentLanguage].command_placeholder;
    }
    
    // Load initial data
    loadInitialData();
}

/**
 * Load initial application data
 */
async function loadInitialData() {
    try {
        const initialData = await FeedbackAPI.getInitialData();
        if (initialData.config) {
            displayConfigInUI(initialData.config);
        }
        if (initialData.processStatus) {
            updateProcessStatus(initialData.processStatus.isRunning);
        }
        if (initialData.logs) {
            updateLogsDisplay(initialData.logs);
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// ===== WebSocket Connection for Real-time Updates =====

let websocket = null;

/**
 * Initialize WebSocket connection
 */
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = function(event) {
        
        showNotification('Connected to server', 'success');
    };
    
    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    websocket.onclose = function(event) {
        
        showNotification('Disconnected from server', 'warning');
        // Attempt to reconnect after 3 seconds
        setTimeout(initializeWebSocket, 3000);
    };
    
    websocket.onerror = function(error) {
        console.error('WebSocket error:', error);
        showNotification('Connection error', 'error');
    };
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'process_update':
            updateProcessStatus(data.isRunning);
            if (data.logs) {
                updateLogsDisplay(data.logs);
            }
            break;
        case 'config_update':
            showNotification('Configuration updated', 'info');
            break;
        case 'feedback_response':
            handleFeedbackResponse(data.response);
            break;
        default:
            
    }
}

/**
 * Send message via WebSocket
 */
function sendWebSocketMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
    }
}

// ===== Feedback System =====

/**
 * Initialize feedback system
 */
function initializeFeedbackSystem() {
    // Add feedback form event listeners
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', submitFeedback);
    }
    
    // Load initial feedback data
    loadFeedbackHistory();
}

/**
 * Submit feedback to server
 */
async function submitFeedback(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const feedback = {
        type: formData.get('type'),
        message: formData.get('message'),
        priority: formData.get('priority'),
        timestamp: new Date().toISOString()
    };
    
    try {
        await FeedbackAPI.submit(feedback);
        showNotification('Feedback submitted successfully', 'success');
        event.target.reset();
        loadFeedbackHistory();
    } catch (error) {
        showNotification('Error submitting feedback: ' + error.message, 'error');
    }
}

/**
 * Load feedback history
 */
async function loadFeedbackHistory() {
    try {
        const history = await FeedbackAPI.getHistory();
        displayFeedbackHistory(history);
    } catch (error) {
        console.error('Error loading feedback history:', error);
    }
}

/**
 * Display feedback history in UI
 */
function displayFeedbackHistory(history) {
    const historyContainer = document.getElementById('feedbackHistory');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    history.forEach(item => {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback-item p-3 mb-2 bg-gray-100 rounded';
        feedbackElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <span class="font-medium">${item.type}</span>
                    <span class="text-sm text-gray-500 ml-2">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <span class="text-xs px-2 py-1 rounded ${getPriorityClass(item.priority)}">${item.priority}</span>
            </div>
            <p class="mt-1 text-sm">${item.message}</p>
        `;
        historyContainer.appendChild(feedbackElement);
    });
}

/**
 * Get CSS class for priority badge
 */
function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'bg-red-200 text-red-800';
        case 'medium': return 'bg-yellow-200 text-yellow-800';
        case 'low': return 'bg-green-200 text-green-800';
        default: return 'bg-gray-200 text-gray-800';
    }
}

/**
 * Handle feedback response from server
 */
function handleFeedbackResponse(response) {
    showNotification(`Server response: ${response.message}`, 'info');
    if (response.action) {
        // Handle specific actions from server
        switch (response.action) {
            case 'reload_config':
                loadConfiguration();
                break;
            case 'restart_process':
                // Handle process restart
                break;
        }
    }
}