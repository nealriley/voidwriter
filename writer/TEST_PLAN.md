# VoidWriter Comprehensive Testing Plan

## Test Environment Configuration

**Port:** 3344
- Selected to avoid conflicts with common ports (3000, 3333, etc.)
- Easily overridable via `--port` flag if needed
- For testing: `--port 3344` or modify test files

**Test Directory:** `/workspaces/voidwriter/`
**Test Files:**
- `test-suite.mjs` - Automated API tests
- `TEST_PLAN.md` - This document

---

## Test Suite 1: API Endpoint Tests (Automated)

**File:** `test-suite.mjs`
**Command:** `node test-suite.mjs`

### What It Tests

#### 1. Basic Server & Config Injection
- [x] Server starts and responds to /api/health
- [x] HTML includes window.voidwriterConfig script
- [x] Title parameter injected into HTML
- [x] Main text parameter injected into HTML
- [x] Sub text parameter injected into HTML

#### 2. Save Mode: Return
- [x] POST /api/save succeeds
- [x] Response includes "success": true
- [x] Mode shows as "return"
- [x] Buffer included in response.saved.buffer
- [x] No file path returned (filePath is null)

#### 3. Save Mode: Disk
- [x] POST /api/save succeeds with disk mode
- [x] Response includes "success": true
- [x] Mode shows as "disk"
- [x] Buffer NOT included (saved is null)
- [x] File path returned
- [x] File actually written to disk with correct content

#### 4. Save Mode: Both
- [x] POST /api/save succeeds with both mode
- [x] Response includes "success": true
- [x] Mode shows as "both"
- [x] Buffer included in response
- [x] File path returned
- [x] File actually written to disk with correct content

#### 5. Complete Endpoint
- [x] POST /api/complete succeeds
- [x] Response includes "success": true
- [x] Server receives submission data

---

## Test Suite 2: CLI Parameter Tests (Manual + Script)

### Commands to Test

```bash
# Test 1: Basic server start
node voidwriter.js --port 3344 --no-open --timeout 3

# Test 2: With runtime parameters
node voidwriter.js --port 3344 \
  --title "CUSTOM_TITLE" \
  --main-text "Enter your response" \
  --sub-text "Be detailed" \
  --no-open --timeout 3

# Test 3: With save mode: return
node voidwriter.js --port 3344 \
  --save-mode return \
  --no-open --timeout 3

# Test 4: With save mode: disk
node voidwriter.js --port 3344 \
  --save-mode disk \
  --save-path /tmp/voidwriter-output.txt \
  --no-open --timeout 3

# Test 5: With save mode: both
node voidwriter.js --port 3344 \
  --save-mode both \
  --save-path /tmp/voidwriter-output.txt \
  --no-open --timeout 3
```

### What to Verify (Manual)

1. Server starts without errors
2. No port conflicts
3. Parameters passed to browser (verify in browser console)
4. Save button visible in sidebar
5. All buttons functional (Download, Copy, Save, Clear)

---

## Test Suite 3: Full Integration Flow

### Flow 1: Type → Save → Submit

```
1. Start server
2. User types several words
3. User clicks Save button
4. Verify "SAVED" feedback appears
5. User clicks Submit (Ctrl+Enter)
6. Verify completion
```

### Flow 2: Save in Different Modes

```
Mode: Return
1. Type text
2. Click Save
3. Verify /api/save returns buffer in response

Mode: Disk
1. Type text
2. Click Save
3. Verify file written to disk
4. Verify response shows file path

Mode: Both
1. Type text
2. Click Save
3. Verify file written to disk
4. Verify response includes buffer
```

### Flow 3: Multiple Saves

```
1. Type some text
2. Click Save (saves buffer #1)
3. Type more text
4. Click Save (saves buffer #2)
5. Verify both saves succeed
```

---

## Test Execution Plan

### Step 1: Automated Tests (5 minutes)
```bash
cd /workspaces/voidwriter
node test-suite.mjs
```

Expected output:
- ✓ All 20+ assertions pass
- Green success message

### Step 2: Manual CLI Tests (10 minutes)

Run each test command in separate terminals:

```bash
# Terminal 1: Basic start
cd /workspaces/voidwriter
node voidwriter.js --port 3344 --no-open --timeout 3

# Terminal 2: With parameters (in another shell)
cd /workspaces/voidwriter
node voidwriter.js --port 3344 \
  --title "TEST_MODE" \
  --main-text "Type your response" \
  --sub-text "Be creative" \
  --no-open --timeout 3
```

### Step 3: API Tests with curl (5 minutes)

```bash
# Test health check
curl http://localhost:3344/api/health

# Test save (return mode)
curl -X POST http://localhost:3344/api/save \
  -H "Content-Type: application/json" \
  -d '{"buffer":"test text","metadata":{"wordCount":2}}'

# Test complete
curl -X POST http://localhost:3344/api/complete \
  -H "Content-Type: application/json" \
  -d '{"success":true,"text":"test","metadata":{}}'
```

---

## Expected Results

### Automated Test Suite
- All 20+ test assertions pass
- No errors in console
- Test files cleaned up (temp files removed)

### CLI Tests
- Server starts without errors on port 3344
- No warnings about missing modules
- Parameters correctly parsed
- No crashes or hangs

### Manual Integration
- UI renders correctly
- Save button visible and clickable
- Feedback messages display correctly
- All three save modes work as expected

---

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 3344
lsof -i :3344

# Kill it if needed
kill -9 <PID>

# Or use different port
node voidwriter.js --port 3345
```

### Module Import Errors
```bash
# Reinstall dependencies
npm install

# Check imports in test-suite.mjs
```

### File Write Failures
```bash
# Check directory permissions
ls -la /tmp/

# Test write access
touch /tmp/test-voidwriter.txt
```

---

## Test Summary Template

Fill this in after tests:

```
Automated Tests:     ✓ PASS / ✗ FAIL  (20/20 assertions)
CLI Start Test:      ✓ PASS / ✗ FAIL
Parameters Test:     ✓ PASS / ✗ FAIL
Save Return Mode:    ✓ PASS / ✗ FAIL
Save Disk Mode:      ✓ PASS / ✗ FAIL
Save Both Mode:      ✓ PASS / ✗ FAIL
Complete Endpoint:   ✓ PASS / ✗ FAIL
Full Integration:    ✓ PASS / ✗ FAIL
```

---

## Notes

- All tests non-destructive
- Temporary test files auto-cleaned
- Can be run repeatedly without state issues
- Tests use port 3344 to avoid conflicts
- Tests have 5-second timeout
- No network calls required (all localhost)

