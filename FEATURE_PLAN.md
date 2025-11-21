# VoidWriter Runtime Parameters & Save Button - Feature Design

## Overview

Two major features to implement:
1. **Runtime Parameters** - Pass UI configuration (title, main text, sub text) from CLI to React app
2. **Save Button** - Allow users to save buffer with configurable behavior (return/disk/both)

---

## Feature 1: Runtime Parameters

### Requirements
- Allow passing `title` parameter to replace "SKYWRITER" text (top-left)
- Allow passing `mainText` parameter for center display
- Allow passing `subText` parameter for center-below display
- All parameters optional with sensible defaults
- Parameters passed via CLI and rendered on-the-fly

### Design Decisions

#### Parameter Passing Strategy: Query String

**Why Query String?**
- ✅ Native browser support, no special encoding needed
- ✅ Can handle special characters via URL encoding
- ✅ Browser's URL bar shows what's passed (good for debugging)
- ✅ No state management complexity
- ✅ Simple React hook to parse: `new URLSearchParams(window.location.search)`

**Alternative considered: Environment variables**
- ❌ Requires server to inject values into HTML/script
- ❌ More complex setup
- ❌ Harder to debug

**Alternative considered: Postmessage from server**
- ❌ Requires iframe or special setup
- ❌ Unnecessary complexity
- ❌ Query string is simpler

#### URL Format

```
http://localhost:3333?
  title=My+Custom+Title&
  mainText=What+is+your+approach?&
  subText=Please+describe+in+detail
```

#### UIConfig Interface

```typescript
interface UIConfig {
  title: string;          // Default: "SKYWRITER"
  mainText: string;       // Default: ""
  subText: string;        // Default: ""
}
```

### Implementation Plan

**Step 1: CLI Parameters** (voidwriter.js)
```javascript
.option('title', { description: 'UI title (replaces SKYWRITER)', default: 'SKYWRITER' })
.option('main-text', { description: 'Main centered text', default: '' })
.option('sub-text', { description: 'Sub-centered text', default: '' })
```

Then pass as query params:
```javascript
const url = `http://localhost:${port}?` +
  `title=${encodeURIComponent(argv.title)}&` +
  `mainText=${encodeURIComponent(argv['main-text'])}&` +
  `subText=${encodeURIComponent(argv['sub-text'])}`;
```

**Step 2: Create Hook** (App.tsx)
```typescript
const useUIConfig = (): UIConfig => {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get('title') || 'SKYWRITER',
    mainText: params.get('mainText') || '',
    subText: params.get('subText') || ''
  };
};
```

**Step 3: Update UI** (App.tsx)
- Replace hardcoded "SKYWRITER" with config.title
- Add center text display components
- Use existing CSS/styling patterns

### UI Rendering Locations

1. **Title** (Top-left, already exists)
   - Replace text content with dynamic value
   - Same styling/positioning

2. **Main Text** (Center)
   - New div, centered horizontally and vertically
   - Same font styling as title (Press Start 2P)
   - Larger size than sub-text
   - Only show when populated

3. **Sub Text** (Center-below)
   - New div, positioned below main text
   - Smaller font than main
   - Only show when populated

---

## Feature 2: Save Button

### Requirements
- Add "Save" button to sidebar (alongside Download/Copy/Clear)
- Clicking save should:
  - Save current text buffer
  - Return it as a value (not just stdout)
  - Optionally write to disk
- Flexible save behavior: support multiple modes
- Provide user feedback ("SAVED", "SAVING", etc.)

### Design Decisions

#### Save Behavior Modes: Three Modes

**Mode 1: RETURN** (Default)
- Buffer returned via `/api/save` endpoint
- Returns JSON with buffer text
- Parent CLI captures the returned buffer
- Does NOT write to disk
- **Use case:** CLI tool needs buffer mid-session

**Mode 2: DISK**
- Buffer written to file on server (at specified path)
- Returns confirmation JSON
- Parent CLI knows file was saved
- **Use case:** Server-side persistence needed

**Mode 3: BOTH** (Mode 1 + Mode 2)
- Buffer returned AND written to disk
- Returns JSON with both data and file path
- **Use case:** Want both options

**Why not client-side file write?**
- Browser can't write to arbitrary disk paths (security restriction)
- Server-side approach is more flexible and secure

#### SaveConfig Interface

```typescript
interface SaveConfig {
  mode: 'return' | 'disk' | 'both';
  diskPath?: string;  // Only used if mode is 'disk' or 'both'
  overwrite?: boolean; // Default: true
}
```

#### API Endpoints

**New Endpoint: `/api/save`**
```
POST /api/save
{
  "buffer": "text content here",
  "metadata": { "wordCount": 47, ... }
}

Response (mode: return):
{
  "success": true,
  "saved": true,
  "data": "text content here"
}

Response (mode: disk):
{
  "success": true,
  "saved": true,
  "filePath": "/path/to/file.txt",
  "message": "Saved to disk"
}

Response (mode: both):
{
  "success": true,
  "saved": true,
  "data": "text content here",
  "filePath": "/path/to/file.txt"
}
```

### Implementation Plan

**Step 1: CLI Parameters** (voidwriter.js)
```javascript
.option('save-mode', {
  choices: ['return', 'disk', 'both'],
  description: 'Save behavior: return buffer, write to disk, or both',
  default: 'return'
})
.option('save-path', {
  type: 'string',
  description: 'File path for disk saves (required if save-mode is disk/both)',
  default: null
})
```

**Step 2: Server Configuration** (server.js)
```typescript
export function startServer(options = {}) {
  const saveMode = options.saveMode || 'return';
  const savePath = options.savePath || null;
  
  // Store config for use in /api/save endpoint
  // ...
}
```

**Step 3: API Endpoint** (server.js)
```typescript
app.post('/api/save', (req, res) => {
  const { buffer, metadata } = req.body;
  
  // Handle save based on mode
  if (mode === 'return' || mode === 'both') {
    // Return buffer
  }
  if (mode === 'disk' || mode === 'both') {
    // Write to disk
    fs.writeFileSync(savePath, buffer);
  }
  
  res.json({ success: true, ... });
});
```

**Step 4: App Handler** (App.tsx)
```typescript
const handleSaveBuffer = useCallback(async () => {
  try {
    const fullText = textBuffer.join(' ') + (currentWord ? ' ' + currentWord : '');
    
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buffer: fullText,
        metadata: { wordCount, sessionDuration, ... }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showFeedback('SAVED');
      // Optionally close window or continue
    }
  } catch (error) {
    showFeedback('SAVE FAILED');
  }
}, [textBuffer, currentWord, showFeedback]);
```

**Step 5: UI Button** (App.tsx)
- Add "Save" button to sidebar
- Position: After "Copy" button, before "Clear"
- Same styling as other buttons
- Only show when textBuffer.length > 0

### Save Button Styling

```jsx
<button className="button save-button" onClick={handleSaveBuffer}>
  <i className="fas fa-save"></i>
</button>
```

Add to App.css:
```css
.save-button {
  /* Same as download-button and copy-button */
}
```

---

## Data Flow Diagrams

### Feature 1: Runtime Parameters

```
CLI Call:
node voidwriter.js \
  --title "Custom Title" \
  --main-text "Your prompt" \
  --sub-text "Please elaborate"
  
→ voidwriter.js
  Parses arguments
  Builds URL: http://localhost:3333?
    title=Custom+Title&
    mainText=Your+prompt&
    subText=Please+elaborate
  
→ Server opens browser
  Browser navigates to URL with query params
  
→ React App
  useUIConfig hook reads URLSearchParams
  Returns { title, mainText, subText }
  Renders text in appropriate locations
```

### Feature 2: Save Button

```
User clicks "Save" button
  
→ handleSaveBuffer()
  Collects textBuffer + currentWord
  POST to /api/save with { buffer, metadata }
  
→ Server /api/save endpoint
  Receives buffer
  Based on saveMode:
    - 'return': Return data immediately
    - 'disk': Write to file
    - 'both': Do both
  Returns JSON response
  
→ React App
  Receives response
  Shows feedback ("SAVED")
  Optionally closes window or continues
```

---

## Testing Strategy

### Feature 1: Runtime Parameters

- [ ] Test with title only: `node voidwriter.js --title "Test"`
- [ ] Test with all parameters filled
- [ ] Test with special characters: `--title "Question? Let's go!"`
- [ ] Test with long text: ensure truncation/wrapping works
- [ ] Test with empty strings: verify defaults work
- [ ] Test with different fonts/sizes match existing UI

### Feature 2: Save Button

- [ ] Test button appears when text exists
- [ ] Test button disappears when no text
- [ ] Test save to return mode: verify buffer returned correctly
- [ ] Test save to disk mode: verify file written to correct path
- [ ] Test save to both: verify both operations succeed
- [ ] Test with special characters in buffer
- [ ] Test with large buffers (100+KB)
- [ ] Test overwrite behavior (existing file)
- [ ] Test error handling (permission denied, path invalid, etc.)

---

## Implementation Order

### Phase A: Runtime Parameters (Simpler, no breaking changes)
1. feature-1-research ✓ (This document)
2. feature-1-design ← START HERE
3. feature-1-cli
4. feature-1-server
5. feature-1-hook
6. feature-1-ui-title
7. feature-1-ui-main
8. feature-1-ui-sub
9. feature-1-test

### Phase B: Save Button (More complex, more endpoints)
10. feature-2-research ← RESEARCH starts here
11. feature-2-design
12. feature-2-cli
13. feature-2-cli-path
14. feature-2-server
15. feature-2-server-config
16. feature-2-save-handler
17. feature-2-ui-button
18. feature-2-disk
19. feature-2-return
20. feature-2-test-disk
21. feature-2-test-return
22. feature-2-test-ui

### Phase C: Documentation & Polish
23. docs-update
24. example-update
25. final-commit

---

## Edge Cases & Error Handling

### Feature 1: Runtime Parameters
- Long title text: Use CSS text-overflow/truncation
- Special characters: Already handled by URL encoding
- Empty strings: Fall back to defaults
- Very long main/sub text: Consider line breaks/wrapping

### Feature 2: Save Button
- File doesn't exist: Create it (fs.writeFileSync)
- File exists: Overwrite or prompt? (decision: overwrite by default)
- Permission denied: Return error JSON, show feedback
- Invalid path: Return error JSON
- Buffer empty: Show validation feedback
- Network error: Show error feedback

---

## CLI Usage Examples

### Feature 1
```bash
# Basic
node voidwriter.js "What's your approach?"

# With custom UI
node voidwriter.js \
  --title "Task Name" \
  --main-text "What's your approach?" \
  --sub-text "Please be as detailed as possible"

# With save mode
node voidwriter.js \
  --title "Feedback" \
  --main-text "What did you think?" \
  --save-mode both \
  --save-path ./feedback.txt
```

### Python Integration
```python
import subprocess
import json

result = subprocess.run([
    'node', 'voidwriter.js',
    '--title', 'Code Review',
    '--main-text', 'Review this code',
    '--sub-text', 'Focus on performance',
    '--save-mode', 'return'
], capture_output=True, text=True)

data = json.loads(result.stdout)
review_text = data['text']
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Query string too long | Medium | URL length limit ~2000 chars; most use cases <500 chars |
| File write permissions | Medium | Error handling + clear error messages |
| Browser security restrictions | Low | Server-side save avoids these issues |
| Parameter name conflicts | Low | Use clear, unique names (mainText, subText) |
| Backward compatibility | Low | All parameters optional with defaults |

---

## Success Criteria

✅ All runtime parameters render correctly
✅ Save button functions in all three modes
✅ Error handling provides clear feedback
✅ Backward compatible (existing scripts still work)
✅ Documentation updated
✅ All tests pass

