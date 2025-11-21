# VoidWriter

![VoidWriter](https://img.shields.io/badge/VoidWriter-2.0.0-purple)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

**A CLI tool for capturing user input through an immersive 3D typing experience.**

VoidWriter is a command-line tool that opens a beautiful 3D browser interface to collect text input from users. Perfect for CLI applications, agentic coding tools, or any script that needs rich text input with an engaging user experience.

## Features

✨ **CLI-First Design** - Invoke from any command line tool or script  
🎮 **3D Arcade Interface** - Engaging space-themed typing experience  
💾 **Multiple Save Modes** - Return data, save to disk, or both  
📊 **Rich Metadata** - Word count, typing speed, session duration  
🔧 **Highly Configurable** - Customize titles, prompts, timeouts, and behavior  
📝 **Comprehensive Logging** - All operations logged to `~/.voidwriter/logs/`  
⚡ **Auto-Shutdown** - Optionally terminate on save for streamlined workflows  
🚀 **Instant Startup** - Pre-built SPA for sub-second launch times

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```bash
# Ask a question and get the response
node voidwriter.js \
  --title "QUESTION" \
  --main-text "What is your favorite color?" \
  --shutdown-on-save

# Returns JSON:
# {"success":true,"text":"Blue","metadata":{...}}
```

### Advanced Usage

```bash
# Save to disk with custom configuration
node voidwriter.js \
  --port 3333 \
  --title "CODE REVIEW" \
  --main-text "Review the following code" \
  --sub-text "Provide detailed feedback" \
  --save-mode both \
  --save-path /tmp/review.txt \
  --shutdown-on-save \
  --timeout 600 \
  --verbose
```

## CLI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--port` | number | 3333 | HTTP server port |
| `--timeout` | number | 900 | Session timeout in seconds (15 min) |
| `--title` | string | "SKYWRITER" | UI title text |
| `--main-text` | string | null | Main instruction text |
| `--sub-text` | string | null | Sub-instruction text |
| `--save-mode` | string | "return" | Save mode: `return`, `disk`, or `both` |
| `--save-path` | string | null | File path for disk saves |
| `--shutdown-on-save` | boolean | false | Auto-shutdown when save button clicked |
| `--no-open` | boolean | false | Don't automatically open browser |
| `--verbose` | boolean | false | Show detailed logging output |
| `--output` | string | null | Write output to file instead of stdout |

## Save Modes

### `return` (default)
Buffer returned in JSON response, nothing saved to disk.

```bash
node voidwriter.js --save-mode return
# JSON includes: { "saved": { "buffer": "...", "metadata": {...} } }
```

### `disk`
Buffer saved to specified file path, not returned in response.

```bash
node voidwriter.js --save-mode disk --save-path /tmp/output.txt
# File written to /tmp/output.txt
```

### `both`
Buffer saved to disk AND returned in JSON response.

```bash
node voidwriter.js --save-mode both --save-path /tmp/output.txt
# File written AND JSON includes buffer
```

## Auto-Shutdown on Save

Enable `--shutdown-on-save` to automatically terminate the server when the user clicks Save:

```bash
node voidwriter.js \
  --main-text "Enter your response" \
  --shutdown-on-save \
  --save-mode both \
  --save-path /tmp/response.txt
```

**Workflow:**
1. User types their response
2. User clicks **Save** button
3. Content saved (if disk/both mode)
4. Server automatically shuts down
5. JSON returned to caller with success status

## Output Format

VoidWriter returns JSON to stdout:

```json
{
  "success": true,
  "text": "User's typed content here",
  "metadata": {
    "wordCount": 42,
    "sessionDuration": 12500,
    "avgWPM": 85,
    "peakCombo": 15,
    "timestamp": "2025-11-21T23:42:20.333Z"
  },
  "savedVia": "save-button",
  "filePath": "/tmp/output.txt"
}
```

## Logging

All operations are automatically logged to `~/.voidwriter/logs/`:

```bash
# View latest log
ls -t ~/.voidwriter/logs/ | head -1 | xargs -I {} cat ~/.voidwriter/logs/{}

# Search for errors
grep ERROR ~/.voidwriter/logs/*.log

# Watch logs in real-time
tail -f ~/.voidwriter/logs/voidwriter-*.log
```

**Log Levels:** DEBUG, INFO, WARN, ERROR, FATAL

See [LOGGING.md](./LOGGING.md) for complete logging documentation.

## Testing

### Automated Tests

```bash
# Run comprehensive test suite (27 tests)
node test-suite.mjs
```

### Manual Testing

```bash
# Start with verbose logging
node voidwriter.js --port 3344 --verbose

# Test save functionality
bash test-logging-demo.sh
```

See [TEST_PLAN.md](./TEST_PLAN.md) and [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) for detailed testing documentation.

## Use Cases

### Agentic Coding Tools
```bash
# Collect code review from user
node voidwriter.js \
  --title "CODE REVIEW" \
  --main-text "Review the code changes" \
  --shutdown-on-save
```

### Script Input Collection
```bash
# Get multi-line input in scripts
RESPONSE=$(node voidwriter.js --main-text "Enter configuration" --shutdown-on-save)
echo "$RESPONSE" | jq -r '.text'
```

### Interactive CLI Applications
```python
import subprocess
import json

result = subprocess.run([
    'node', 'voidwriter.js',
    '--title', 'QUESTIONNAIRE',
    '--main-text', 'Please answer the following',
    '--shutdown-on-save'
], capture_output=True, text=True)

data = json.loads(result.stdout)
user_text = data['text']
```

## Architecture

```
CLI Tool (Python/Node/Bash)
    ↓ spawns
voidwriter.js
    ↓ starts
Express HTTP Server (localhost:3333)
    ↓ serves
Pre-built React SPA (dist/)
    ↓ user types
Save/Submit clicked
    ↓ triggers
Server shutdown (optional)
    ↓ returns
JSON to stdout
```

## Project Structure

```
voidwriter/
├── voidwriter.js           # CLI entry point
├── server.js               # Express HTTP server with logging
├── logger.js               # Centralized logging utility
├── dist/                   # Pre-built React SPA (committed)
│   ├── index.html
│   └── assets/
├── src/                    # React source code
│   ├── App.tsx             # Main 3D UI component
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── test-suite.mjs          # Automated test suite (27 tests)
├── test-logging-demo.sh    # Logging demonstration script
├── package.json
├── README.md
├── LOGGING.md              # Logging documentation
├── TESTING_SUMMARY.md      # Test results and verification
├── TEST_PLAN.md            # Testing procedures
└── IMPLEMENTATION-GUIDE.md # Technical architecture details
```

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Opens http://localhost:5173

# Build for production
npm run build:cli

# Run tests
node test-suite.mjs
```

### NPM Scripts

```bash
npm run dev         # Start Vite dev server
npm run build       # Build production bundle
npm run build:cli   # Build and prepare for CLI use
npm run lint        # Lint TypeScript/React code
npm run typecheck   # Type check TypeScript
```

## Technologies

- **Runtime:** Node.js, Express
- **Frontend:** React 18, TypeScript
- **3D Graphics:** Three.js, React Three Fiber, React Three Drei
- **Build Tool:** Vite
- **CLI:** yargs (argument parsing), open (browser launching)
- **Logging:** Custom logger with file and console output

## Documentation

- **[LOGGING.md](./LOGGING.md)** - Complete logging system documentation
- **[TEST_PLAN.md](./TEST_PLAN.md)** - Testing procedures and examples
- **[TESTING_SUMMARY.md](./TESTING_SUMMARY.md)** - Test results and verification
- **[IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)** - Technical architecture

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3333

# Use a different port
node voidwriter.js --port 3344
```

### Browser doesn't open
```bash
# Disable auto-open and open manually
node voidwriter.js --no-open
# Then visit: http://localhost:3333
```

### Check logs for errors
```bash
# View latest log file
cat ~/.voidwriter/logs/voidwriter-*.log | tail -50

# Search for errors
grep ERROR ~/.voidwriter/logs/*.log
```

## Contributing

Contributions welcome! When adding features:

- Maintain CLI-first design philosophy
- Add tests to `test-suite.mjs`
- Update documentation
- Follow existing TypeScript patterns
- Run `npm run typecheck` and `npm run lint` before committing

## License

MIT

---

**Made with ❤️ for CLI developers who want beautiful UIs**
