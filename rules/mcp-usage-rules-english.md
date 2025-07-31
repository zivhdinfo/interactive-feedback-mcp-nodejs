# MCP Interactive Feedback Usage Rules - English
## NOTE
Note: I just configured simple rules so as not to waste too much resources on this rule and focus on other rules of the project.
You should reply to whoever is after completing this task, please ask me again before finishing. This will be more optimal!
## Overview

This document defines the mandatory and recommended usage rules for AI assistants when working with the Interactive Feedback MCP server in AI IDEs like Cursor, Claude Desktop, Cline, and Windsurf.

## Core Principle

**Human-in-the-loop workflow**: Always involve the user in critical decisions to prevent costly mistakes and optimize resource usage.

## Mandatory Usage Rules

### 🔴 CRITICAL ACTIONS (ALWAYS Required)

AI assistants MUST use `interactive_feedback` before:

1. **Significant Code Changes**
   - Modifying multiple files (3+ files)
   - Changing core functionality or architecture
   - Refactoring large code sections
   - Modifying configuration files

2. **System Commands**
   - Installing/updating/removing packages (`npm install`, `pip install`, etc.)
   - Running build commands (`npm run build`, `docker build`, etc.)
   - Deployment operations
   - Database migrations
   - File system operations (creating/deleting directories)

3. **Environment Changes**
   - Modifying environment variables
   - Changing server configurations
   - Updating CI/CD pipelines
   - Docker/container operations

4. **Error Resolution**
   - When encountering compilation errors
   - Runtime errors requiring debugging
   - Dependency conflicts
   - Permission issues

5. **Task Completion**
   - Before finalizing any response
   - When marking tasks as complete
   - Before closing work sessions

### 🟡 RECOMMENDED ACTIONS (Strongly Suggested)

AI assistants SHOULD use `interactive_feedback` when:

1. **Unclear Requirements**
   - User requests are ambiguous
   - Multiple implementation approaches exist
   - Need to clarify scope or priorities

2. **File Creation**
   - Creating new configuration files
   - Adding new modules or components
   - Creating documentation files
   - Setting up new project structures

3. **Breaking Changes**
   - API modifications
   - Database schema changes
   - Dependency version updates
   - Interface modifications

4. **Security-Related Operations**
   - Working with API keys or secrets
   - Authentication/authorization code
   - Database operations
   - Network security configurations

### 🟢 OPTIONAL ACTIONS (Use When Beneficial)

AI assistants MAY use `interactive_feedback` for:

1. **Progress Updates**
   - Long-running tasks
   - Complex multi-step operations
   - Status reports

2. **Optimization Feedback**
   - Performance improvements
   - Code quality suggestions
   - Best practice recommendations

3. **Educational Purposes**
   - Explaining complex concepts
   - Teaching new technologies
   - Code review sessions

## Tool Call Format

```javascript
{
  "tool": "interactive_feedback",
  "arguments": {
    "project_directory": "/absolute/path/to/project",
    "summary": "Clear, concise description of what you're about to do and why user input is needed"
  }
}
```

## Best Practices

1. **Clear Summaries** - Explain what you plan to do and why user confirmation is needed
2. **Proper Timing** - Call before taking action, not after
3. **Provide Context** - Include relevant file paths and affected systems/components

## Cost Optimization Benefits

- **Reduces tool calls by 80-90%** - From 15-25 speculative calls to 2-5 guided calls per task
- **Decreases token usage** - Less exploration and fewer rollbacks
- **Improves accuracy** - Human guidance prevents costly mistakes
- **Streamlines workflow** - Eliminates system conflicts from unguided operations

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: STMMO Project Team  
**Contact**: nguyenhop530@gmail.com