# VoidWriter as a CLI-Integrated UI Service

## Overview

This document provides architectural recommendations for packaging VoidWriter as a runnable script/service that can be invoked by a CLI-based agentic coding tool. The web interface will serve as a **temporary, user-input collection UI** that opens when interaction is needed, captures user input, and returns it to the parent CLI tool.

---

## Architecture Recommendation: Node.js HTTP Server Wrapper

### Why Node.js?

1. **Same ecosystem**: Project already uses Node/TypeScript
2. **Zero additional dependencies**: Can reuse existing build setup
3. **Headless browser integration**: Easy to spawn browser window
4. **Cross-platform**: Works on Linux, macOS, Windows
5. **Process communication**: Simple stdin/stdout IPC with parent CLI
6. **Fast startup**: <500ms vs Docker's overhead

### Why NOT Docker for this use case?

- Overhead of container startup defeats the purpose of a quick UI popup
- Parent CLI tool controls the runtime, not VoidWriter
- Data serialization between container and parent CLI is complex
- Not needed for temporary, ephemeral UI interactions

---

## Recommended Architecture

### High-Level Flow

```
┌─────────────────────────────────┐
│   Agentic CLI Tool (Python)     │
│   - Main process                │
│   - Decides when to ask for UI  │
└──────────────┬──────────────────┘
               │ spawns with IPC
               ▼
┌─────────────────────────────────┐
│  Node Server Wrapper (index.js) │
│  - Serves built SPA              │
│  - Opens browser window          │
│  - Watches for text completion   │
│  - Communicates via stdout/IPC   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Vite Dev Server (dev mode)     │
│  OR Static HTTP (prod mode)     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Browser (headless or GUI)      │
│  - VoidWriter React App         │
│  - User types                   │
│  - Sends results to server      │
└─────────────────────────────────┘
```

### Data Flow for User Input Collection

```
1. Parent CLI calls: node voidwriter.js --prompt "Your prompt text"
2. Server starts on localhost:3333
3. Browser opens to http://localhost:3333?prompt=...
4. User types in VoidWriter
5. User completes input (signal TBD)
6. App sends text to server via POST /complete
7. Server outputs JSON to stdout
8. Parent CLI captures output, kills process
9. Parent CLI continues with captured text
```

---

## Implementation Recommendations

### 1. **Packaging Structure**

```
voidwriter/
├── dist/                          # Pre-built production files (committed)
├── src/                           # Source (React/TypeScript)
├── scripts/
│   ├── build-for-script.js        # Build specifically for script mode
│   └── voidwriter.js              # Entry point for CLI integration
├── server.js                      # HTTP server wrapper (simple)
├── package.json                   # Add scripts for script mode
└── README-CLI-INTEGRATION.md      # Documentation
```

### 2. **Server Implementation** (server.js - 50-100 lines)

**Purpose**: Minimal HTTP server that:
- Serves the pre-built SPA
- Receives completed text from the browser
- Returns JSON to the CLI tool
- Handles cleanup

```javascript
// Pseudo-code structure
import express from 'express';
import open from 'open';

const app = express();
let completedText = null;
let serverResolve = null;

app.use(express.static('dist'));
app.use(express.json());

// API endpoint for when user completes writing
app.post('/api/complete', (req, res) => {
  completedText = req.body;
  res.json({ status: 'received' });
  serverResolve?.();
});

app.listen(3333, () => {
  open('http://localhost:3333');
});

// Wait for completion or timeout
setTimeout(() => process.exit(0), 15 * 60 * 1000); // 15min timeout
```

### 3. **CLI Entry Point** (voidwriter.js - 100-150 lines)

**Purpose**: Node.js CLI script that:
- Parses arguments from parent process
- Builds if necessary
- Starts the server
- Opens the browser
- Waits for user input
- Returns data to parent

```javascript
// Pseudo-code structure
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const args = process.argv.slice(2);
const prompt = args[0] || 'Start writing...';
const timeout = parseInt(args[1]) || 900000; // 15min default

// Check if dist exists, rebuild if needed
if (!existsSync('./dist')) {
  console.error('Building VoidWriter...');
  spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

// Start server subprocess
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PROMPT: prompt }
});

// Wait for completion
serverProcess.on('close', (code) => {
  const result = JSON.parse(fs.readFileSync('./completion.json'));
  console.log(JSON.stringify(result)); // Output for parent to capture
  process.exit(0);
});

// Handle timeout
setTimeout(() => {
  serverProcess.kill();
  process.exit(1);
}, timeout);
```

### 4. **React Integration** (Minimal changes to App.tsx)

Add completion endpoint and API call:

```typescript
// In App.tsx
const handleSubmitWriting = useCallback(async () => {
  try {
    const response = await fetch('/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textBuffer.join(' '),
        wordCount: textBuffer.length,
        sessionDuration: Date.now() - sessionStartTime,
        metadata: {
          avgWPM: calculateWPM(),
          peakCombo: performance.combo,
          // ... other metrics
        }
      })
    });
    
    if (response.ok) {
      window.close(); // Close on success
    }
  } catch (error) {
    console.error('Failed to submit:', error);
  }
}, [textBuffer, performance]);
```

---

## Three Implementation Options

### Option A: **Simple HTTP Server** (Recommended for MVP)

**Pros:**
- Minimal code (~200 lines total)
- Works immediately
- Easy to debug
- Suitable for single-user CLI interactions

**Cons:**
- No persistence between invocations
- Basic error handling

**Time to implement:** 1-2 hours

**Entry point:**
```bash
node voidwriter.js "Your writing prompt" 900
# Returns: { text: "...", wordCount: N, sessionDuration: Ms }
```

---

### Option B: **Express + IPC (File-based)** (Recommended for Production)

**Pros:**
- More robust error handling
- Can handle multiple concurrent instances
- Better logging and debugging
- Flexible data persistence

**Cons:**
- Slightly more setup (~300 lines)
- File I/O overhead

**Time to implement:** 2-3 hours

**Key components:**
- Each invocation gets unique session ID
- Results written to `/tmp/voidwriter-{id}.json`
- Parent reads results after process exits

---

### Option C: **Electron Wrapper** (Not Recommended)

**Pros:**
- Native desktop app feel
- Better window management
- Can run in background

**Cons:**
- Large executable (~150MB)
- Slow startup (2-3 seconds)
- Adds 15+ dependencies
- Overkill for temporary UI

**Time to implement:** 4-6 hours

**Verdict:** Skip this unless you need persistent background service

---

## Data Exchange Format

### Input (from CLI to VoidWriter)

```json
{
  "prompt": "What are the main themes in this section?",
  "context": "Optional context about the project",
  "maxDuration": 900,
  "minWords": 10,
  "placeholder": "Start typing your response..."
}
```

### Output (from VoidWriter to CLI)

```json
{
  "success": true,
  "text": "The user's complete written response here...",
  "metadata": {
    "wordCount": 47,
    "sessionDuration": 125000,
    "avgWPM": 22.5,
    "peakCombo": 15,
    "timestamp": "2025-11-21T14:30:00Z",
    "cancelled": false,
    "timeoutOccurred": false
  }
}
```

### CLI Integration Example (Python)

```python
import subprocess
import json
import time

def get_user_input(prompt, timeout=900):
    """Open VoidWriter UI and wait for user input."""
    try:
        result = subprocess.run(
            ['node', 'voidwriter.js', prompt, str(timeout)],
            capture_output=True,
            text=True,
            timeout=timeout + 10
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            print(f"VoidWriter error: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        print("VoidWriter session timed out")
        return None
    except Exception as e:
        print(f"Failed to run VoidWriter: {e}")
        return None

# Usage
result = get_user_input("Describe your approach to this problem")
if result:
    user_text = result['text']
    word_count = result['metadata']['wordCount']
    print(f"Captured {word_count} words")
```

---

## Build & Packaging Strategy

### Pre-built Distribution

**Rationale:**
- Users shouldn't need to `npm install` every time
- Faster startup
- CLI tool can distribute single VoidWriter package
- Similar to how popular CLI tools work

### Build Process

1. **Development:** `npm run dev` (Vite dev server)
2. **Production build:** `npm run build` (outputs to `dist/`)
3. **Package:** Commit `dist/` to repo OR distribute as tarball

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:for-cli": "tsc && vite build --mode production",
    "start": "node voidwriter.js",
    "start:dev": "node -r esbuild-register server.js",
    "preview": "vite preview"
  }
}
```

### Distribution Options

**Option 1: Git Submodule** (if part of larger project)
```bash
git submodule add https://github.com/nealriley/voidwriter
```

**Option 2: NPM Package**
```bash
npm install voidwriter-cli
npx voidwriter "Your prompt"
```

**Option 3: Standalone Binary** (advanced)
```bash
# Using pkg or esbuild to bundle Node + assets into single executable
npx pkg voidwriter.js --output voidwriter
./voidwriter "Your prompt"
```

---

## Implementation Checklist

### Phase 1: MVP (Option A - Simple HTTP Server)

- [ ] Create `server.js` with Express server
- [ ] Create `voidwriter.js` CLI entry point
- [ ] Add `/api/complete` endpoint to App.tsx
- [ ] Add submission button/keybind to UI (e.g., Ctrl+Enter)
- [ ] Test manual flow: `node voidwriter.js "test prompt"`
- [ ] Add output to stdout as JSON
- [ ] Write README-CLI-INTEGRATION.md
- [ ] Add pre-built dist/ to repo

### Phase 2: Production Polish

- [ ] Add error handling and logging
- [ ] Implement timeout behavior
- [ ] Add metadata collection
- [ ] Create Python example integration
- [ ] Add command-line argument parsing (yargs)
- [ ] Auto-rebuild if dist/ is missing/outdated
- [ ] Add cleanup on process termination

### Phase 3: Advanced

- [ ] Publish as NPM package
- [ ] Add Electron wrapper (optional)
- [ ] Create Docker image (optional, for server deployments)
- [ ] Add session persistence
- [ ] Implement concurrent session handling

---

## Configuration Recommendations

### Command-Line Arguments

```bash
node voidwriter.js [OPTIONS]

Options:
  --prompt TEXT              Text to display as prompt (required)
  --timeout SECONDS          Max session duration (default: 900)
  --min-words N              Minimum words to allow submission (default: 1)
  --port PORT                Server port (default: 3333)
  --headless                 Run browser in headless mode
  --dev                      Run with Vite dev server
  --output FILE              Write results to file instead of stdout
  --no-open                  Don't automatically open browser
```

### Environment Variables

```bash
VOIDWRITER_PORT=3333
VOIDWRITER_TIMEOUT=900
VOIDWRITER_HEADLESS=false
VOIDWRITER_DEV_MODE=false
```

---

## Performance Considerations

### Startup Time Target: <1 second

- Pre-built dist/ (not building on each invocation)
- Lightweight Express server
- Browser opens while server initializes

### Memory Footprint

- Node server: ~50MB
- Browser: ~100-150MB
- Total: ~200MB (acceptable for temporary UI)

### Browser Choice

- **Default:** User's system browser (fastest)
- **Headless option:** For server environments
- **Fallback:** Display localhost URL in terminal if browser fails

---

## Security Considerations

### For CLI Integration Context

1. **Process Isolation:**
   - Each VoidWriter session is independent process
   - Parent CLI tool controls spawning/termination
   - No shared state between sessions

2. **Data Handling:**
   - Text only flows between browser → server → stdout
   - No cloud uploads unless explicitly configured
   - All data deleted after session ends

3. **Port Security:**
   - Server only listens on localhost:3333
   - Not accessible from network by default
   - Parent CLI can specify different port if needed

4. **File System:**
   - Sensitive: If using file-based IPC, ensure `/tmp/` permissions
   - Consider using UUID for session files

---

## Alternative: Lightweight Approach with stdin/stdout

If you want **maximum simplicity** (no HTTP server):

```bash
# Instead of HTTP, pipe data through stdio
echo '{"prompt":"Your question?"}' | node voidwriter.js

# VoidWriter processes piped JSON, opens UI, returns on stdout
# Parent reads stdout, parses JSON result
```

**Pros:**
- No server management
- Pure pipe-based IPC
- Simpler debugging

**Cons:**
- Need headless browser interaction handling
- Can't use standard browser easily
- More complex for user input capture

**Verdict:** HTTP server approach is cleaner and more robust.

---

## Recommended Next Steps

### Immediate (Next session)

1. **Create server.js** - Express server with `/api/complete` endpoint
2. **Create voidwriter.js** - CLI entry point that spawns server
3. **Modify App.tsx** - Add submit functionality and API call
4. **Test manually** - Verify the flow works
5. **Write integration guide** - Document for CLI tool usage

### Short-term (Following week)

1. **Add argument parsing** - Support command-line options
2. **Implement logging** - Debug output for troubleshooting
3. **Add metadata collection** - WPM, duration, etc.
4. **Create example Python CLI** - Show how to integrate
5. **Package for distribution** - Tarball or NPM

### Medium-term (Month out)

1. **Publish to NPM** - Make it `npm install voidwriter-cli`
2. **Add configuration** - User preferences, themes
3. **Build as standalone binary** - Single `voidwriter` executable
4. **Documentation site** - Integration guides, examples
5. **Telemetry/analytics** - Optional, track usage patterns

---

## Summary: Quick Decision Matrix

| Aspect | Recommendation | Rationale |
|--------|---|---|
| **Language** | Node.js | Same ecosystem, fast startup |
| **Server** | Express (simple HTTP) | Low overhead, standard approach |
| **Distribution** | Pre-built dist/ + Node script | No build step needed, faster |
| **Data format** | JSON stdin/stdout | Standard, easy to integrate |
| **Browser** | System default | Best UX, fastest |
| **Timeline** | 2-4 hours for MVP | Simple, focused scope |
| **Scalability** | Single user per session | Design for concurrent spawning |

---

## Files to Create/Modify

### New Files

1. **server.js** - ~100 lines
2. **voidwriter.js** - ~150 lines
3. **README-CLI-INTEGRATION.md** - documentation
4. **.npmrc** (optional) - for NPM package
5. **scripts/build-for-cli.js** (optional) - custom build script

### Modified Files

1. **App.tsx** - Add API endpoint call, submit button
2. **package.json** - Add new scripts
3. **.gitignore** - Ensure dist/ is tracked or ignored appropriately
4. **README.md** - Add CLI integration section

---

## Questions to Consider Before Implementation

1. **Should users be able to cancel mid-session?** (Recommend: yes, ESC key)
2. **Minimum word count requirement?** (Recommend: configurable, default 1)
3. **Save writing history?** (Recommend: local storage per session only)
4. **Analytics/tracking?** (Recommend: optional, off by default)
5. **Multiple concurrent sessions?** (Recommend: support via unique ports)
6. **Custom styling/branding?** (Recommend: defer to Phase 2)

---

## References

- **Express.js:** https://expressjs.com/
- **Node.js child_process:** https://nodejs.org/api/child_process.html
- **Vite Build Guide:** https://vitejs.dev/guide/build.html
- **open npm package:** https://www.npmjs.com/package/open
- **yargs CLI args:** https://www.npmjs.com/package/yargs
