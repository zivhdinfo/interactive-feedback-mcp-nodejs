# Interactive Feedback MCP - Node.js Implementation
# Interactive Feedback MCP - Phiên bản Node.js

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)
[![JSON-RPC 2.0](https://img.shields.io/badge/JSON--RPC-2.0-green.svg)](https://www.jsonrpc.org/specification)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-blue.svg)](https://cursor.sh/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

---

## 🌍 Language / Ngôn ngữ
- [English](#english)
- [Tiếng Việt](#tiếng-việt)

---

# English

## Overview

**Interactive Feedback MCP - Node.js Implementation** is a modern Node.js implementation of the [Interactive Feedback MCP (Python)](https://github.com/noopstudios/interactive-feedback-mcp) developed by Fábio Ferreira. This version replaces the Qt desktop interface with a responsive web-based UI, providing better user experience and cross-platform compatibility.

Developed by **Zivhd** (@zivhdinfo) as part of the STMMO Project.

### Purpose

Create a "human-in-the-loop" workflow for AI development tools like Cursor, Cline, and Windsurf. This server allows you to:
- Run commands and view their output
- Provide textual feedback directly to the AI
- Manage per-project configurations
- Auto-execute commands when needed

### Why Use This?

By guiding the assistant to check in with the user instead of branching out into speculative, high-cost tool calls, this module can drastically reduce the number of premium requests (e.g., OpenAI tool invocations) on platforms like Cursor. In some cases, it helps consolidate what would be up to 25 tool calls into a single, feedback-aware request — saving resources and improving performance.

## 🌟 Features

- **✅ MCP Specification Compliant**: 100% compatible with official MCP specification and JSON-RPC 2.0
- **🔄 Proper Handshake**: Implements correct initialize/initialized handshake protocol
- **🛠️ Tool Management**: Full support for tools/list and tools/call methods
- **🌐 Interactive Web UI**: Modern, dark-themed interface with real-time feedback
- **🖥️ Cross-Platform**: Works on Windows, macOS, and Linux
- **⚡ Real-Time Communication**: WebSocket-based live updates
- **💻 Command Execution**: Run and monitor system commands with live output
- **📁 Project Management**: Per-project configuration and settings
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🚀 Zero Configuration**: Works out of the box with sensible defaults
- **🧪 Comprehensive Testing**: Includes MCP compliance test suite
- **⌨️ Keyboard Shortcuts**: Enter to run, Ctrl+Enter to submit
- **🎛️ Process Management**: Start/stop controls with auto-focus

## Technologies Used

### Core Technologies
- **Node.js** (v18.0.0+) - Runtime environment
- **Express.js** (v4.18.2+) - Web framework
- **WebSocket** (ws v8.14.2+) - Real-time communication
- **fs-extra** (v11.1.1+) - Enhanced file system operations

### Frontend Technologies
- **HTML5** - Modern semantic markup
- **CSS3** - Dark theme with responsive design
- **Vanilla JavaScript** - ES6+ features, no frameworks
- **WebSocket Client** - Real-time UI updates

## System Requirements

### Minimum Requirements
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm**: Version 8.0.0 or higher
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: 512MB available memory
- **Disk**: 100MB free space
- **Network**: Port access for local server (auto-assigned)

### Supported Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, CentOS 8+, etc.)

## Quick Installation

### Prerequisites

Ensure you have Node.js 18.0.0 or newer installed:
```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version
# Should output 8.0.0 or higher
```

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/zivhdinfo/interactive-feedback-mcp-nodejs.git
cd interactive-feedback-mcp-nodejs

# 2. Install dependencies
npm install

# 3. Test installation
node server.js
# Should output: MCP Server listening on stdio
```

## Configuration

### For Cursor IDE

Add to Cursor settings.json:

```json
{
  "mcpServers": {
    "interactive-feedback-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\STMMO_PJ\\MCP\\interactive-feedback-mcp-nodejs\\server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Note**: Update the path in `args` to match your installation directory.

### For Claude Desktop

Add to Claude Desktop config:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "interactive-feedback-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\STMMO_PJ\\MCP\\interactive-feedback-mcp-nodejs\\server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Note**: Update the path in `args` to match your installation directory.

### For Cline / Windsurf

Use the same configuration format as above. Configure the server in the respective tool's MCP settings with `interactive-feedback-mcp` as the server identifier.

## Usage

### Basic Workflow

1. **AI Assistant calls tool**: AI uses `interactive_feedback` tool
2. **Web UI opens**: Browser automatically opens with feedback interface
3. **Review project**: View project directory and prompt from AI
4. **Run commands** (optional): Execute commands to test/verify
5. **Provide feedback**: Enter feedback for AI assistant
6. **Submit**: Send feedback and close UI

### Available Tool

#### `interactive_feedback`

**Parameters:**
- `project_directory` (string): Path to the project directory
- `summary` (string): Summary of the request or context

**Returns:**
- `command_logs` (string): Output from executed commands
- `interactive_feedback` (string): User feedback for the AI

### Example Usage

```javascript
// AI assistant calls this tool
{
  "tool": "interactive_feedback",
  "arguments": {
    "project_directory": "/path/to/project",
    "summary": "Need feedback on the new feature implementation"
  }
}
```

## Testing

### Manual Testing

```bash
# Start the MCP server
node server.js

# Test with your MCP client (Cursor, Claude Desktop, etc.)
# The server should respond to MCP protocol messages
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Server auto-assigns available ports
2. **Permission errors**: Ensure Node.js has proper permissions
3. **Browser not opening**: Check default browser settings
4. **WebSocket connection failed**: Verify firewall settings

### Debug Mode

```bash
# Enable debug logging
DEBUG=* node server.js
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/zivhdinfo/interactive-feedback-mcp-nodejs/issues)
- Email: zivhdinfo@gmail.com

---

# Tiếng Việt

## Tổng quan

**Interactive Feedback MCP - Phiên bản Node.js** là phiên bản Node.js hiện đại của [Interactive Feedback MCP (Python)](https://github.com/noopstudios/interactive-feedback-mcp) được phát triển bởi Fábio Ferreira. Phiên bản này thay thế giao diện desktop Qt bằng giao diện web responsive, mang lại trải nghiệm người dùng tốt hơn và khả năng tương thích đa nền tảng.

Phát triển bởi **Zivhd** (@zivhdinfo) như một phần của STMMO Project.

### Mục đích

Tạo ra một workflow "human-in-the-loop" cho các công cụ phát triển AI như Cursor, Cline, và Windsurf. Server này cho phép bạn:
- Chạy các lệnh và xem kết quả đầu ra
- Cung cấp phản hồi văn bản trực tiếp cho AI
- Quản lý cấu hình theo từng dự án
- Tự động thực thi lệnh khi cần thiết

### Tại sao nên sử dụng?

Bằng cách hướng dẫn trợ lý kiểm tra với người dùng thay vì phân nhánh thành các lệnh gọi công cụ đầy suy đoán và tốn kém, module này có thể giảm đáng kể số lượng yêu cầu premium (ví dụ: lệnh gọi công cụ OpenAI) trên các nền tảng như Cursor. Trong một số trường hợp, nó giúp hợp nhất những gì có thể là tới 25 lệnh gọi công cụ thành một yêu cầu duy nhất có nhận thức phản hồi — tiết kiệm tài nguyên và cải thiện hiệu suất.

## 🌟 Tính năng

- **✅ Tuân thủ MCP Specification**: Tương thích 100% với MCP specification chính thức và JSON-RPC 2.0
- **🔄 Handshake đúng chuẩn**: Triển khai giao thức handshake initialize/initialized chính xác
- **🛠️ Quản lý Tool**: Hỗ trợ đầy đủ các phương thức tools/list và tools/call
- **🌐 Web UI tương tác**: Giao diện hiện đại với theme tối và phản hồi thời gian thực
- **🖥️ Đa nền tảng**: Hoạt động trên Windows, macOS, và Linux
- **⚡ Giao tiếp thời gian thực**: Cập nhật trực tiếp qua WebSocket
- **💻 Thực thi lệnh**: Chạy và giám sát lệnh hệ thống với đầu ra trực tiếp
- **📁 Quản lý dự án**: Cấu hình và cài đặt theo từng dự án
- **📱 Thiết kế responsive**: Hoạt động trên desktop và mobile
- **🚀 Cấu hình zero**: Hoạt động ngay với cài đặt mặc định hợp lý
- **🧪 Kiểm thử toàn diện**: Bao gồm bộ test tuân thủ MCP
- **⌨️ Phím tắt**: Enter để chạy, Ctrl+Enter để gửi
- **🎛️ Quản lý tiến trình**: Điều khiển start/stop với auto-focus

## Công nghệ sử dụng

### Công nghệ cốt lõi
- **Node.js** (v18.0.0+) - Môi trường runtime
- **Express.js** (v4.18.2+) - Web framework
- **WebSocket** (ws v8.14.2+) - Giao tiếp thời gian thực
- **fs-extra** (v11.1.1+) - Thao tác file system nâng cao

### Công nghệ Frontend
- **HTML5** - Markup ngữ nghĩa hiện đại
- **CSS3** - Theme tối với thiết kế responsive
- **Vanilla JavaScript** - Tính năng ES6+, không framework
- **WebSocket Client** - Cập nhật UI thời gian thực

## Yêu cầu hệ thống

### Yêu cầu tối thiểu
- **Node.js**: Phiên bản 18.0.0 trở lên (khuyến nghị LTS)
- **npm**: Phiên bản 8.0.0 trở lên
- **Trình duyệt**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **RAM**: 512MB bộ nhớ khả dụng
- **Ổ đĩa**: 100MB dung lượng trống
- **Mạng**: Truy cập port cho local server (tự động gán)

### Hệ điều hành được hỗ trợ
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, CentOS 8+, v.v.)

## Cài đặt nhanh

### Điều kiện tiên quyết

Đảm bảo bạn đã cài đặt Node.js 18.0.0 trở lên:
```bash
# Kiểm tra phiên bản Node.js
node --version
# Nên xuất ra v18.0.0 hoặc cao hơn

# Kiểm tra phiên bản npm
npm --version
# Nên xuất ra 8.0.0 hoặc cao hơn
```

### Các bước cài đặt

```bash
# 1. Clone repository
git clone https://github.com/zivhdinfo/interactive-feedback-mcp-nodejs.git
cd interactive-feedback-mcp-nodejs

# 2. Cài đặt dependencies
npm install

# 3. Kiểm tra cài đặt
node server.js
# Nên xuất ra: MCP Server listening on stdio
```

## Cấu hình

### Cho Cursor IDE

#### Phương pháp 1: Sử dụng settings.json (Khuyến nghị)

1. Mở Cursor Settings (Ctrl+,)
2. Nhấp "Open Settings (JSON)" ở góc phải trên
3. Thêm cấu hình MCP server:
   ```json
   {
     "mcp.servers": {
       "interactive-feedback-mcp": {
         "command": "node",
         "args": ["server.js"],
         "cwd": "C:\\path\\to\\interactive-feedback-mcp-nodejs",
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

#### Phương pháp 2: Sử dụng file cấu hình

1. Copy nội dung file `cursor-mcp-config.json` được cung cấp
2. Dán vào file settings.json của Cursor
3. Cập nhật đường dẫn `cwd` để khớp với thư mục cài đặt của bạn

#### Phương pháp 3: Cấu hình trực tiếp qua UI

1. Mở Cursor Settings (Ctrl+,)
2. Tìm "MCP Servers"
3. Nhấp "Add Server" và cấu hình:
   - **Server Name**: `interactive-feedback-mcp`
   - **Command**: `node`
   - **Arguments**: `server.js`
   - **Working Directory**: `C:\\path\\to\\interactive-feedback-mcp-nodejs`
   - **Environment Variables**: `NODE_ENV=production`

#### Xác minh

Sau khi cấu hình, khởi động lại Cursor và xác minh MCP server đã được tải:
1. Mở Command Palette (Ctrl+Shift+P)
2. Gõ "MCP" để xem các lệnh MCP có sẵn
3. Tìm tool "interactive_feedback" trong gợi ý của AI assistant

### Cho Claude Desktop

Thêm vào cấu hình Claude Desktop:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "interactive-feedback": {
      "command": "node",
      "args": ["server.js"],
      "cwd": "C:/path/to/interactive-feedback-mcp-nodejs"
    }
  }
}
```

### Cho Cline / Windsurf

Áp dụng nguyên tắc cài đặt tương tự. Cấu hình lệnh server trong cài đặt MCP của công cụ tương ứng, sử dụng `interactive-feedback` làm định danh server.

## Sử dụng

### Quy trình cơ bản

1. **AI Assistant gọi tool**: AI sử dụng tool `interactive_feedback`
2. **Web UI mở**: Trình duyệt tự động mở với giao diện phản hồi
3. **Xem lại dự án**: Xem thư mục dự án và prompt từ AI
4. **Chạy lệnh** (tùy chọn): Thực thi lệnh để kiểm tra/xác minh
5. **Cung cấp phản hồi**: Nhập phản hồi cho AI assistant
6. **Gửi**: Gửi phản hồi và đóng UI

### Tool có sẵn

#### `interactive_feedback`

**Tham số:**
- `project_directory` (string): Đường dẫn đến thư mục dự án
- `summary` (string): Tóm tắt yêu cầu hoặc ngữ cảnh

**Trả về:**
- `command_logs` (string): Đầu ra từ các lệnh đã thực thi
- `interactive_feedback` (string): Phản hồi của người dùng cho AI

### Ví dụ sử dụng

```javascript
// AI assistant gọi tool này
{
  "tool": "interactive_feedback",
  "arguments": {
    "project_directory": "/path/to/project",
    "summary": "Cần phản hồi về việc triển khai tính năng mới"
  }
}
```

## Kiểm thử

### Kiểm thử thủ công

```bash
# Khởi động MCP server
node server.js

# Kiểm thử với MCP client của bạn (Cursor, Claude Desktop, v.v.)
# Server sẽ phản hồi các tin nhắn MCP protocol
```

## Khắc phục sự cố

### Vấn đề thường gặp

1. **Xung đột port**: Server tự động gán port khả dụng
2. **Lỗi quyền**: Đảm bảo Node.js có quyền phù hợp
3. **Trình duyệt không mở**: Kiểm tra cài đặt trình duyệt mặc định
4. **Kết nối WebSocket thất bại**: Xác minh cài đặt firewall

### Chế độ Debug

```bash
# Bật debug logging
DEBUG=* node server.js
```

## Giấy phép

Giấy phép MIT - xem file [LICENSE](LICENSE) để biết chi tiết.

## Đóng góp

Chào mừng các đóng góp! Vui lòng đọc hướng dẫn đóng góp trước khi gửi PR.

## Hỗ trợ

Đối với các vấn đề và câu hỏi:
- GitHub Issues: [Tạo issue](https://github.com/zivhdinfo/interactive-feedback-mcp-nodejs/issues)
- Email: zivhdinfo@gmail.com

---

**Developed with ❤️ by Zivhd (@zivhdinfo) - STMMO Project**