# VoidWriter for Agentic Tools

A guide for integrating VoidWriter into agentic coding tools, AI assistants, and automated workflows.

## Installation

### Prerequisites

- **Node.js** 16 or higher
- **npm** (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/nealriley/voidwriter.git
cd voidwriter

# Dev Container starts by running (npm ci || npm install) and npm run build:cli inside writer/
# Manual setup (if needed):
cd writer
npm ci
npm run build:cli
node voidwriter.js --help

# Optional: add helper aliases (vw-text, vw-json, vw-perpetual) from repo root
cd ..
source ./voidwriter-aliases.sh
```

The CLI lives in the `writer/` subdirectory. All commands below assume you're running from the repository root (so use `node writer/voidwriter.js ...`) unless noted otherwise. VoidWriter ships with a pre-built UI (`writer/dist/`), and the dev container bootstraps the build automatically to keep it fresh.

---

## Quick Start

### Basic Usage

```bash
node writer/voidwriter.js \
  --title "YOUR TITLE" \
  --main-text "Your question or prompt" \
  --shutdown-on-save
```

**What happens:**
1. Browser window opens with your custom prompt
2. User types their response in the 3D interface
3. User clicks **Save** button
4. Server automatically shuts down
5. JSON response printed to stdout

### Automation-friendly CLI actions

- Install deps: `cd writer && npm ci`
- Build bundled UI: `cd writer && npm run build:cli` (already run in the dev container bootstrap)
- Run the CLI from repo root: `node writer/voidwriter.js [flags...]`

### Convenience wrappers (text/json/perpetual)

For cleaner agent pipelines, you can use the helper wrapper in `writer/voidwriter.sh`:

- `./writer/voidwriter.sh text [flags...]` prints only the captured text (uses `jq` when available).
- `./writer/voidwriter.sh json [flags...]` prints the final JSON line only.
- `./writer/voidwriter.sh perpetual /tmp/output.txt [flags...]` saves to disk and keeps the server running until timeout/Ctrl+C.

If you sourced `./voidwriter-aliases.sh`, the same commands are available as `vw-text`, `vw-json`, and `vw-perpetual`.

---

## Task-Based Examples

### 1. Collect Code Review Feedback

**Task:** Get detailed feedback on code changes

```bash
node writer/voidwriter.js \
  --title "CODE REVIEW" \
  --main-text "Review the following code changes" \
  --sub-text "Provide detailed feedback and suggestions" \
  --save-mode both \
  --save-path /tmp/code-review.txt \
  --shutdown-on-save \
  --timeout 600
```

**Output:**
- JSON with review text + metadata
- File saved to `/tmp/code-review.txt`
- Server auto-terminates after save

---

### 2. Capture Project Requirements

**Task:** Gather detailed project requirements from user

```bash
node writer/voidwriter.js \
  --title "REQUIREMENTS" \
  --main-text "Describe the project requirements" \
  --sub-text "Include features, constraints, and goals" \
  --save-mode both \
  --save-path ./requirements.txt \
  --shutdown-on-save
```

**Output:**
- Structured requirements in JSON
- Saved to `./requirements.txt`

---

### 3. Get Bug Report Details

**Task:** Collect comprehensive bug report from user

```bash
node writer/voidwriter.js \
  --title "BUG REPORT" \
  --main-text "Describe the bug you encountered" \
  --sub-text "Include steps to reproduce and expected behavior" \
  --save-mode return \
  --shutdown-on-save \
  --timeout 300
```

**Output:**
- Bug details in JSON format
- No file saved (return mode)

---

### 4. Capture Commit Messages

**Task:** Get a detailed commit message from developer

```bash
node writer/voidwriter.js \
  --title "COMMIT MESSAGE" \
  --main-text "Describe your changes" \
  --sub-text "Explain what and why" \
  --save-mode disk \
  --save-path /tmp/commit-msg.txt \
  --shutdown-on-save \
  --timeout 120
```

**Output:**
- Commit message saved to `/tmp/commit-msg.txt`
- Can be used: `git commit -F /tmp/commit-msg.txt`

---

### 5. Collect API Design Specifications

**Task:** Gather API endpoint specifications

```bash
node writer/voidwriter.js \
  --title "API DESIGN" \
  --main-text "Design the API endpoint" \
  --sub-text "Include routes, methods, request/response formats" \
  --save-mode both \
  --save-path ./api-spec.txt \
  --shutdown-on-save \
  --timeout 900
```

---

### 6. Get Architectural Decisions

**Task:** Document architectural decisions and rationale

```bash
node writer/voidwriter.js \
  --title "ARCHITECTURE" \
  --main-text "Describe the architectural approach" \
  --sub-text "Include trade-offs and alternatives considered" \
  --save-mode both \
  --save-path ./architecture-decision.md \
  --shutdown-on-save
```

---

### 7. Capture Test Scenarios

**Task:** Collect test cases and scenarios

```bash
node writer/voidwriter.js \
  --title "TEST CASES" \
  --main-text "List test scenarios for this feature" \
  --sub-text "Include edge cases and expected outcomes" \
  --save-mode both \
  --save-path ./test-scenarios.txt \
  --shutdown-on-save
```

---

### 8. Get Documentation Content

**Task:** Write documentation sections

```bash
node writer/voidwriter.js \
  --title "DOCUMENTATION" \
  --main-text "Write the documentation for this feature" \
  --sub-text "Include examples and usage instructions" \
  --save-mode both \
  --save-path ./docs/feature-guide.md \
  --shutdown-on-save \
  --timeout 1200
```

---

### 9. Collect User Stories

**Task:** Gather user stories for sprint planning

```bash
node writer/voidwriter.js \
  --title "USER STORIES" \
  --main-text "Write user stories for this feature" \
  --sub-text "Format: As a [user], I want [goal], so that [benefit]" \
  --save-mode both \
  --save-path ./user-stories.txt \
  --shutdown-on-save
```

---

### 10. Get Refactoring Plans

**Task:** Document refactoring strategy

```bash
node writer/voidwriter.js \
  --title "REFACTORING PLAN" \
  --main-text "Describe the refactoring approach" \
  --sub-text "Include steps, risks, and migration strategy" \
  --save-mode both \
  --save-path ./refactoring-plan.md \
  --shutdown-on-save \
  --timeout 900
```

---

## Integration Patterns

### Python Integration

```python
import subprocess
import json

def collect_input(title, prompt):
    """Collect user input via VoidWriter"""
    result = subprocess.run([
        'node', 'writer/voidwriter.js',
        '--title', title,
        '--main-text', prompt,
        '--shutdown-on-save'
    ], cwd='/path/to/voidwriter/repo', capture_output=True, text=True)
    
    data = json.loads(result.stdout)
    return data['text'], data['metadata']

# Usage
review, metadata = collect_input(
    'CODE REVIEW',
    'Review the recent changes'
)
print(f"Review ({metadata['wordCount']} words):")
print(review)
```

---

### Node.js Integration

```javascript
import { spawn } from 'child_process';

async function collectInput(title, prompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [
      'writer/voidwriter.js',
      '--title', title,
      '--main-text', prompt,
      '--shutdown-on-save'
    ], { cwd: '/path/to/voidwriter/repo' });
    
    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(output);
        resolve(result);
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });
  });
}

// Usage
const result = await collectInput(
  'FEATURE REQUEST',
  'Describe the feature you need'
);
console.log(`Feature: ${result.text}`);
console.log(`Words: ${result.metadata.wordCount}`);
```

---

### Bash Script Integration

```bash
#!/bin/bash

# Collect commit message
MESSAGE=$(./writer/voidwriter.sh text \
  --title "COMMIT MESSAGE" \
  --main-text "Describe your changes" \
  --shutdown-on-save)

# Create commit
git commit -m "$MESSAGE"

echo "Committed with message: $MESSAGE"
```

---

## Command-Line Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--port` | number | 3333 | HTTP server port |
| `--timeout` | number | 900 | Session timeout (seconds) |
| `--title` | string | "SKYWRITER" | UI title text |
| `--main-text` | string | null | Main instruction text |
| `--sub-text` | string | null | Sub-instruction text |
| `--save-mode` | choice | "return" | `return`, `disk`, or `both` |
| `--save-path` | string | null | File path for disk saves |
| `--shutdown-on-save` | boolean | false | Auto-shutdown on save |
| `--no-open` | boolean | false | Don't open browser |
| `--verbose` | boolean | false | Show detailed logs |
| `--output` | string | null | Write to file instead of stdout |

---

## Save Modes Explained

### `return` (default)
Buffer included in JSON response, nothing saved to disk.

**Use when:** You want data in your script only

```bash
node writer/voidwriter.js --save-mode return --shutdown-on-save
# Output: { "saved": { "buffer": "...", "metadata": {...} } }
```

---

### `disk`
Buffer written to file, not included in JSON response.

**Use when:** You need persistent storage only

```bash
node writer/voidwriter.js --save-mode disk --save-path /tmp/output.txt --shutdown-on-save
# File: /tmp/output.txt (created)
# Output: { "success": true, "filePath": "/tmp/output.txt" }
```

---

### `both`
Buffer written to file AND included in JSON response.

**Use when:** You need both immediate access and persistence

```bash
node writer/voidwriter.js --save-mode both --save-path /tmp/output.txt --shutdown-on-save
# File: /tmp/output.txt (created)
# Output: { "saved": { "buffer": "...", "metadata": {...} }, "filePath": "/tmp/output.txt" }
```

---

## Output Format

VoidWriter returns JSON to stdout:

```json
{
  "success": true,
  "text": "User's typed content",
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

**Fields:**
- `success` - true if completed, false if cancelled/timeout
- `text` - The user's typed content
- `metadata.wordCount` - Number of words
- `metadata.sessionDuration` - Time in milliseconds
- `metadata.avgWPM` - Average words per minute
- `metadata.peakCombo` - Longest consecutive typing streak
- `savedVia` - How completion occurred ("save-button" or "submit-button")
- `filePath` - Path to saved file (if save-mode is disk/both)

---

## Logging

All sessions are automatically logged to `~/.voidwriter/logs/`

### View Latest Log

```bash
ls -t ~/.voidwriter/logs/ | head -1 | xargs -I {} cat ~/.voidwriter/logs/{}
```

### Search for Errors

```bash
grep ERROR ~/.voidwriter/logs/*.log
```

### Monitor in Real-Time

```bash
# Start VoidWriter in one terminal
node writer/voidwriter.js --verbose

# In another terminal
tail -f ~/.voidwriter/logs/voidwriter-*.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
node writer/voidwriter.js --port 3344
```

### Browser Doesn't Open

```bash
# Disable auto-open, manually navigate
node writer/voidwriter.js --no-open
# Then visit: http://localhost:3333
```

### Timeout Too Short

```bash
# Increase timeout to 30 minutes
node writer/voidwriter.js --timeout 1800
```

### Debug Session Issues

```bash
# Run with verbose logging
node writer/voidwriter.js --verbose

# Check the log file
cat ~/.voidwriter/logs/voidwriter-*.log
```

---

## Best Practices

### 1. Always Set Timeouts
Prevent indefinite waits in automated workflows:

```bash
node writer/voidwriter.js --timeout 300  # 5 minute timeout
```

### 2. Use `--shutdown-on-save` for Scripts
Ensures immediate termination when data is captured:

```bash
node writer/voidwriter.js --shutdown-on-save
```

### 3. Choose Appropriate Save Mode
- Scripts reading stdout → `return`
- Need file for later → `disk`
- Both script + persistence → `both`

### 4. Provide Clear Instructions
Use `--main-text` and `--sub-text` for clarity:

```bash
node writer/voidwriter.js \
  --main-text "What's the bug?" \
  --sub-text "Include steps to reproduce"
```

### 5. Save to Unique Files
Avoid overwriting with timestamps:

```bash
FILE="/tmp/review-$(date +%s).txt"
node writer/voidwriter.js --save-path "$FILE" --save-mode disk
```

---

## Advanced Usage

### Capture and Parse JSON in Scripts

```bash
#!/bin/bash

# Collect input
JSON=$(node writer/voidwriter.js \
  --title "CONFIG" \
  --main-text "Enter configuration" \
  --shutdown-on-save)

# Parse JSON
TEXT=$(echo "$JSON" | jq -r '.text')
WORDS=$(echo "$JSON" | jq -r '.metadata.wordCount')

echo "Captured $WORDS words:"
echo "$TEXT"
```

### Chain Multiple Inputs

```bash
# Get requirements
REQ=$(node writer/voidwriter.js --title "REQUIREMENTS" --main-text "What do you need?" --shutdown-on-save)

# Get implementation plan
PLAN=$(node writer/voidwriter.js --title "PLAN" --main-text "How will you build it?" --shutdown-on-save)

# Save both
echo "$REQ" > requirements.json
echo "$PLAN" > plan.json
```

### Conditional Workflows

```bash
RESULT=$(node writer/voidwriter.js --title "APPROVE?" --main-text "Review and approve" --shutdown-on-save)
SUCCESS=$(echo "$RESULT" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "Approved! Proceeding..."
  # Continue workflow
else
  echo "Cancelled or timed out"
  exit 1
fi
```

---

## FAQ

### Q: Can I use VoidWriter in CI/CD pipelines?

**A:** No. VoidWriter requires browser interaction, so it's designed for local/interactive workflows. For CI/CD, use non-interactive input methods.

---

### Q: How do I customize the UI appearance?

**A:** Currently, the UI is fixed. The `--title`, `--main-text`, and `--sub-text` options control the displayed text, but visual styling is not customizable via CLI.

---

### Q: Can multiple instances run simultaneously?

**A:** Yes, use different ports:

```bash
node writer/voidwriter.js --port 3333 &
node writer/voidwriter.js --port 3334 &
node writer/voidwriter.js --port 3335 &
```

---

### Q: What happens if the user closes the browser?

**A:** The server continues running until timeout. The session is logged, and the response will have `success: false`.

---

### Q: How do I cancel a running session?

**A:** Press `Ctrl+C` in the terminal where VoidWriter is running.

---

## Support

- **Documentation:** [README.md](./README.md)
- **Logging Guide:** [writer/LOGGING.md](./writer/LOGGING.md)
- **Testing:** [writer/TEST_PLAN.md](./writer/TEST_PLAN.md)
- **Architecture:** [writer/IMPLEMENTATION-GUIDE.md](./writer/IMPLEMENTATION-GUIDE.md)

---

**Happy coding! 🚀**
