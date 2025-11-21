# VoidWriter Logging & Error Handling

## Overview

VoidWriter now includes comprehensive logging and error handling to help diagnose issues and track all operations. All logs are automatically stored in your home directory for easy access.

## Log Storage Location

All VoidWriter session logs are stored in:

```
~/.voidwriter/logs/
```

On Linux/Mac:
```bash
~/.voidwriter/logs/
```

On your system specifically:
```
/home/codespace/.voidwriter/logs/
```

## Log File Naming

Each session creates a timestamped log file with a unique session ID:

```
voidwriter-YYYY-MM-DDTHH-MM-SS-ZZZZ-SESSIONID.log
```

Example:
```
voidwriter-2025-11-21T23-37-22-679Z-fddc90uow.log
```

## Log File Contents

Each log file contains:

### Session Header
```
================================================================================
VoidWriter Session Log
================================================================================
Session ID: fddc90uow
Started: 2025-11-21T23:37:22.679Z
Hostname: codespaces-252b2b
Platform: linux
Node Version: v22.17.0
================================================================================
```

### Log Entries
Each log entry includes:
- **Timestamp** - ISO 8601 format (YYYY-MM-DDTHH:MM:SS.ZZZZ)
- **Log Level** - DEBUG, INFO, WARN, ERROR, or FATAL
- **Message** - Description of the event
- **Data** - Structured JSON data (formatted for readability)

### Log Levels

| Level | Color | Use Case |
|-------|-------|----------|
| DEBUG | Cyan | Detailed diagnostics (only when `--verbose` flag used) |
| INFO | Green | Normal operation events |
| WARN | Yellow | Warnings (missing data, unusual conditions) |
| ERROR | Red | Error conditions (file I/O failures, invalid requests) |
| FATAL | Magenta | Critical failures that stop execution |

## Viewing Logs

### View All Log Files
```bash
ls -lh ~/.voidwriter/logs/
```

### View Latest Log
```bash
ls -t ~/.voidwriter/logs/ | head -1 | xargs -I {} cat ~/.voidwriter/logs/{}
```

### View Specific Session
```bash
cat ~/.voidwriter/logs/voidwriter-2025-11-21T23-37-22-679Z-fddc90uow.log
```

### Search for Errors
```bash
grep ERROR ~/.voidwriter/logs/*.log
```

### Follow a Live Session
```bash
# Start VoidWriter in one terminal
node voidwriter.js --port 3333 --verbose

# In another terminal, find the log file
tail -f ~/.voidwriter/logs/voidwriter-*.log
```

## Console Output

When running with `--verbose` flag, logs also print to console with color-coded output:

```bash
node voidwriter.js --port 3333 --verbose
```

Output format:
```
[2025-11-21T23:37:22.685Z] [INFO] Server started successfully
  {
    "port": "3333",
    "url": "http://localhost:3333",
    "logFile": "/home/codespace/.voidwriter/logs/voidwriter-2025-11-21T23-37-22-679Z-fddc90uow.log"
  }
```

## What Gets Logged

### Server Startup
- UI configuration loaded
- Save configuration loaded
- Server port and timeout
- Full configuration details

### API Activity
- Request method and path (DEBUG level)
- Content type information
- Save operations (buffer size, file path)
- Completion notifications (word count, text length)
- Health checks

### Errors
- Missing required data
- File I/O failures
- Configuration errors
- Server initialization failures

### Shutdown
- Session timeout reached
- Graceful shutdown initiated
- Server close completion
- Log file location

## Example: Debugging a Save Failure

If you encounter an issue with the save functionality:

1. Run with verbose logging:
```bash
node voidwriter.js --save-mode disk --save-path /tmp/output.txt --verbose
```

2. Find the log file:
```bash
ls -t ~/.voidwriter/logs/ | head -1 | xargs -I {} echo ~/.voidwriter/logs/{}
```

3. Review the log for save-related entries:
```bash
grep -E "Save|Buffer|filePath" ~/.voidwriter/logs/voidwriter-*.log
```

4. Check for errors:
```bash
grep ERROR ~/.voidwriter/logs/voidwriter-*.log
```

## Log Output Example

```
================================================================================
VoidWriter Session Log
================================================================================
Session ID: r88j2ytqe
Started: 2025-11-21T23:36:20.171Z
Hostname: codespaces-252b2b
Platform: linux
Node Version: v22.17.0
================================================================================
[2025-11-21T23:36:20.172Z] [INFO] UI Config loaded
  {
    "title": "API TEST",
    "mainText": null,
    "subText": null
  }
[2025-11-21T23:36:20.173Z] [INFO] Save Config loaded
  {
    "mode": "both",
    "path": "/tmp/api-test.txt"
  }
[2025-11-21T23:36:21.965Z] [INFO] Save request received
  {
    "mode": "both",
    "bufferSize": 21,
    "metadata": {
      "wordCount": 4,
      "wpm": 120
    }
  }
[2025-11-21T23:36:21.966Z] [INFO] Buffer saved to disk
  {
    "path": "/tmp/api-test.txt",
    "size": 21
  }
[2025-11-21T23:36:21.985Z] [WARN] Save request without buffer
[2025-11-21T23:36:21.999Z] [INFO] Completion received
  {
    "wordCount": 3,
    "textLength": 17
  }
[2025-11-21T23:36:22.000Z] [INFO] Shutting down server
[2025-11-21T23:36:22.000Z] [INFO] Server closed
  {
    "logFile": "/home/codespace/.voidwriter/logs/voidwriter-2025-11-21T23-36-20-171Z-r88j2ytqe.log"
  }
```

## Logger Implementation

The logging system is implemented in `logger.js` with the following features:

- **Automatic Log Directory Creation** - Creates `~/.voidwriter/logs/` if needed
- **Async Initialization** - Safely initializes before server startup
- **Session Tracking** - Each session gets a unique ID
- **Structured JSON** - All data logged as valid JSON
- **Multi-Output** - Logs to both console and file
- **Color-Coded Console** - Easy identification of log levels
- **Readable Format** - Human-friendly indentation and structure

## Integration with VoidWriter

Every component of VoidWriter logs its activities:

1. **voidwriter.js (CLI)**
   - Argument parsing
   - Build process
   - Error handling

2. **server.js (HTTP Server)**
   - Server startup
   - API endpoints
   - Request/response handling
   - File operations
   - Error conditions

3. **App.tsx (React Component)**
   - User interactions
   - API calls
   - State changes
   - Errors

## Troubleshooting Guide

### "ERR_EMPTY_RESPONSE" Browser Error
**Solution**: Check the log file for server errors during startup
```bash
grep ERROR ~/.voidwriter/logs/voidwriter-*.log
```

### Save File Not Created
**Solution**: Check if the path is writable and review save logs
```bash
grep -E "Save|Buffer" ~/.voidwriter/logs/voidwriter-*.log
```

### Configuration Not Applied
**Solution**: Review UI config in logs
```bash
grep "Config loaded" ~/.voidwriter/logs/voidwriter-*.log
```

## Log File Management

### View Logs for Today
```bash
ls ~/.voidwriter/logs/ | grep "2025-11-21"
```

### Clean Up Old Logs (keep last 10)
```bash
ls -t ~/.voidwriter/logs/ | tail -n +11 | xargs rm
```

### Archive Old Logs
```bash
tar -czf ~/.voidwriter/logs/archive-$(date +%Y%m%d).tar.gz \
  $(ls -t ~/.voidwriter/logs/ | tail -n +20)
```

## Environment Variables

Control logging behavior with environment variables:

```bash
# Enable all debug logging
DEBUG=voidwriter:* node voidwriter.js

# Custom log directory (optional, defaults to ~/.voidwriter/logs)
VOIDWRITER_LOG_DIR=/custom/path node voidwriter.js

# Set verbose mode via env
VERBOSE=1 node voidwriter.js
```

---

**Note**: Log files are created automatically and are human-readable. No additional setup is required.
