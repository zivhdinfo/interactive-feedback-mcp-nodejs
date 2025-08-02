# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-27

### Added
- ✅ **Markdown Support**: Integrated Showdown.js for full Markdown rendering in prompt text
- ✅ **Scroll Functionality**: Added auto-scroll for long prompt content with 300px max height
- ✅ **Enhanced UI**: Improved user experience with cleaner interface

### Changed
- 🔧 **Markdown Library**: Replaced previous markdown implementation with Showdown.js
- 🎨 **Prompt Display**: Updated prompt text rendering to support HTML with Markdown processing
- 🧹 **Code Cleanup**: Removed all console.log statements for production-ready code
- 📱 **UI Polish**: Removed markdown hint text for cleaner feedback interface

### Fixed
- ⚡ **Markdown Rendering**: Fixed issue where Markdown content was displayed as plain text
- 📜 **Long Content**: Added proper scrolling for lengthy prompt content
- 🔒 **Production Ready**: Eliminated debug logging for better performance and security

### Technical Details
- **Showdown.js**: Configured with tables, strikethrough, tasklists, and GitHub code blocks support
- **DOMPurify**: Maintained for XSS protection in rendered HTML
- **Highlight.js**: Continued support for syntax highlighting in code blocks
- **Responsive Design**: Enhanced scroll behavior with smooth scrolling

## [1.0.1] - 2025-07-31 20:12

### Changed
- 🔧 **Fixed port configuration**: Changed from auto-assigned port to fixed port 3636
- 📝 **Updated documentation**: Reflected port changes in README.md
- 🛡️ **Security improvement**: Removed specific user paths from configuration examples

### Fixed
- ⚡ **Port consistency**: Eliminates random port assignment for better predictability
- 📖 **Documentation accuracy**: Updated all references to use generic path placeholders

## [1.0.0] - 2025-07-31 20:10

### Added
- ✅ **Initial Node.js implementation** of Interactive Feedback MCP
- ✅ **MCP Server Core** with `interactive_feedback` tool
- ✅ **Configuration Manager** for per-project settings persistence
- ✅ **Process Manager** for command execution and logging
- ✅ **Web UI Server** with Express.js and WebSocket support
- ✅ **Modern Frontend UI** with responsive design
- ✅ **Dark theme** with smooth animations and transitions
- ✅ **Real-time communication** via WebSocket
- ✅ **Cross-platform compatibility** (Windows/macOS/Linux)
- ✅ **Auto-execute commands** with checkbox option
- ✅ **Toggle command section** for better UX
- ✅ **Keyboard shortcuts** (Enter to run, Ctrl+Enter to submit)
- ✅ **Auto-focus management** for improved user experience
- ✅ **Process management** with start/stop controls
- ✅ **Configuration persistence** per project directory
- ✅ **Comprehensive documentation** with installation and usage guides
- ✅ **MIT License** with proper attribution to original Python version

### Technical Features
- **Express.js** web server with static file serving
- **WebSocket** real-time communication for logs and status updates
- **fs-extra** for enhanced file system operations
- **Cross-platform browser opening** (Windows/macOS/Linux)
- **Fixed port 3636** for consistent access
- **JSON-based configuration** storage
- **Responsive CSS Grid/Flexbox** layout
- **Modern JavaScript ES6+** with class-based architecture
- **Error handling** and graceful degradation
- **Memory-efficient** log management

### Differences from Python Version
- **Web-based UI** instead of Qt desktop application
- **Browser compatibility** instead of Qt dependencies
- **WebSocket real-time updates** instead of Qt signals
- **Responsive design** with mobile support
- **Lightweight deployment** with only Node.js requirement
- **Modern web technologies** (CSS Grid, Flexbox, ES6+)
- **Cross-platform browser opening** without OS-specific dependencies

### Credits
- **Original Concept**: [Fábio Ferreira](https://github.com/fabiomlferreira) - [Interactive Feedback MCP (Python)](https://github.com/noopstudios/interactive-feedback-mcp)
- **Node.js Implementation**: [Zivhd](https://github.com/zivhdinfo/) - STMMO Project
- **Inspiration**: [dotcursorrules.com](https://dotcursorrules.com) for AI development enhancements

---

## Future Roadmap

### Planned Features
- [ ] **Plugin system** for custom commands
- [ ] **Theme customization** options
- [ ] **Command history** and favorites
- [ ] **Multi-project** workspace support
- [ ] **Docker deployment** option
- [ ] **Performance monitoring** dashboard
- [ ] **Automated testing** suite
- [ ] **CI/CD pipeline** setup

### Potential Enhancements
- [ ] **File explorer** integration
- [ ] **Syntax highlighting** for logs
- [ ] **Export/import** configurations
- [ ] **Collaborative feedback** features
- [ ] **Integration** with more AI tools
- [ ] **Mobile app** companion
- [ ] **Cloud sync** for configurations
- [ ] **Analytics** and usage insights

---

*For detailed technical information, see [README.md](README.md)*