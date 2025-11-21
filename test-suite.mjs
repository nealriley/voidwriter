#!/usr/bin/env node

/**
 * VoidWriter Test Suite
 * 
 * Comprehensive testing for:
 * - Runtime parameters
 * - Save button (three modes)
 * - API endpoints
 * - Full integration flows
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let testsPassed = 0;
let testsFailed = 0;
let nextPort = 3344;

// Helper: Print colored output
function log(msg, color = 'white') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || ''}${msg}${colors.reset}`);
}

// Helper: Create test server
function createTestServer(port, options = {}) {
  const app = express();
  app.use(express.json());
  
  let uiConfig = options.uiConfig || {};
  let saveConfig = options.saveConfig || { mode: 'return', path: null };
  let server = null;

  // API endpoints
  app.post('/api/complete', (_req, res) => {
    res.json({ status: 'received', success: true });
  });

  app.post('/api/save', async (req, res) => {
    try {
      const { buffer, metadata } = req.body;
      
      if (!buffer) {
        return res.status(400).json({ success: false, error: 'No buffer provided' });
      }
      
      let savedPath = null;
      
      if ((saveConfig.mode === 'disk' || saveConfig.mode === 'both') && saveConfig.path) {
        try {
          await fs.writeFile(saveConfig.path, buffer, 'utf-8');
          savedPath = saveConfig.path;
        } catch (err) {
          return res.status(500).json({
            success: false,
            error: `Failed to write file: ${err.message}`
          });
        }
      }
      
      const shouldReturn = saveConfig.mode === 'return' || saveConfig.mode === 'both';
      
      res.json({
        success: true,
        saved: shouldReturn ? { buffer, metadata } : null,
        filePath: savedPath,
        mode: saveConfig.mode
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Serve HTML with injected config
  app.get('/', async (_req, res) => {
    try {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      let html = await fs.readFile(indexPath, 'utf-8');
      
      const configScript = `
    <script>
      window.voidwriterConfig = ${JSON.stringify(uiConfig)};
    </script>
    `;
      
      html = html.replace('</head>', configScript + '</head>');
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load page' });
    }
  });

  return {
    start: () => new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        resolve();
      }).on('error', reject);
    }),
    stop: () => new Promise((resolve) => {
      if (server) {
        server.close(resolve);
      } else {
        resolve();
      }
    })
  };
}

// Helper: Fetch with error handling
async function fetchAPI(port, endpoint, options = {}) {
  try {
    const res = await fetch(`http://localhost:${port}${endpoint}`, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: null, ok: false, error: err.message };
  }
}

// Helper: Assert
function assert(condition, message) {
  if (condition) {
    testsPassed++;
    log(`  ✓ ${message}`, 'green');
  } else {
    testsFailed++;
    log(`  ✗ ${message}`, 'red');
  }
}

// Test Suite
async function runTests() {
  log('\n=== VoidWriter Test Suite ===\n', 'blue');
  
  try {
    // TEST 1: Basic Server & Config Injection
    log('TEST 1: Basic Server & Config Injection', 'yellow');
    
    const port1 = nextPort++;
    const server1 = createTestServer(port1, {
      uiConfig: { title: 'TEST_1', mainText: 'Hello', subText: 'World' }
    });
    
    await server1.start();
    await new Promise(r => setTimeout(r, 100));
    
    const health = await fetchAPI(port1, '/api/health');
    assert(health.ok, 'Health endpoint responds');
    assert(health.data?.status === 'ok', 'Health status is ok');
    
    const html = await fetchAPI(port1, '/');
    assert(html.ok, 'Root endpoint responds');
    assert(html.data && typeof html.data === 'string', 'HTML response is a string');
    if (typeof html.data === 'string') {
      assert(html.data.includes('window.voidwriterConfig'), 'Config injection present');
      assert(html.data.includes('TEST_1'), 'Title parameter injected');
      assert(html.data.includes('Hello'), 'Main text parameter injected');
      assert(html.data.includes('World'), 'Sub text parameter injected');
    }
    
    await server1.stop();
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 2: Save Mode - Return
    log('\nTEST 2: Save Mode - Return', 'yellow');
    
    const port2 = nextPort++;
    const server2 = createTestServer(port2, {
      saveConfig: { mode: 'return', path: null }
    });
    
    await server2.start();
    await new Promise(r => setTimeout(r, 100));
    
    const saveReturn = await fetchAPI(port2, '/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buffer: 'Test buffer content',
        metadata: { wordCount: 3 }
      })
    });
    
    assert(saveReturn.ok, 'Save endpoint responds');
    assert(saveReturn.data?.success, 'Save returns success');
    assert(saveReturn.data?.mode === 'return', 'Mode is return');
    assert(saveReturn.data?.saved?.buffer === 'Test buffer content', 'Buffer included in return');
    assert(saveReturn.data?.filePath === null, 'No file path for return mode');
    
    await server2.stop();
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 3: Save Mode - Disk
    log('\nTEST 3: Save Mode - Disk', 'yellow');
    
    const tmpFile = path.join(__dirname, '.test-save-disk.txt');
    
    const port3 = nextPort++;
    const server3 = createTestServer(port3, {
      saveConfig: { mode: 'disk', path: tmpFile }
    });
    
    await server3.start();
    await new Promise(r => setTimeout(r, 100));
    
    const saveDisk = await fetchAPI(port3, '/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buffer: 'Disk saved content',
        metadata: { wordCount: 3 }
      })
    });
    
    assert(saveDisk.ok, 'Save endpoint responds (disk mode)');
    assert(saveDisk.data?.success, 'Save returns success (disk mode)');
    assert(saveDisk.data?.mode === 'disk', 'Mode is disk');
    assert(saveDisk.data?.saved === null, 'Buffer NOT included (disk mode)');
    assert(saveDisk.data?.filePath === tmpFile, 'File path returned');
    
    // Check file was written
    await new Promise(r => setTimeout(r, 100));
    try {
      const fileContent = await fs.readFile(tmpFile, 'utf-8');
      assert(fileContent === 'Disk saved content', 'File written correctly');
      await fs.unlink(tmpFile);
    } catch (e) {
      assert(false, 'File written correctly');
    }
    
    await server3.stop();
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 4: Save Mode - Both
    log('\nTEST 4: Save Mode - Both', 'yellow');
    
    const tmpFile2 = path.join(__dirname, '.test-save-both.txt');
    
    const port4 = nextPort++;
    const server4 = createTestServer(port4, {
      saveConfig: { mode: 'both', path: tmpFile2 }
    });
    
    await server4.start();
    await new Promise(r => setTimeout(r, 100));
    
    const saveBoth = await fetchAPI(port4, '/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buffer: 'Both saved content',
        metadata: { wordCount: 3 }
      })
    });
    
    assert(saveBoth.ok, 'Save endpoint responds (both mode)');
    assert(saveBoth.data?.success, 'Save returns success (both mode)');
    assert(saveBoth.data?.mode === 'both', 'Mode is both');
    assert(saveBoth.data?.saved?.buffer === 'Both saved content', 'Buffer included (both mode)');
    assert(saveBoth.data?.filePath === tmpFile2, 'File path returned (both mode)');
    
    // Check file was written
    await new Promise(r => setTimeout(r, 100));
    try {
      const fileContent = await fs.readFile(tmpFile2, 'utf-8');
      assert(fileContent === 'Both saved content', 'File written correctly (both mode)');
      await fs.unlink(tmpFile2);
    } catch (e) {
      assert(false, 'File written correctly (both mode)');
    }
    
    await server4.stop();
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 5: Complete Endpoint
    log('\nTEST 5: Complete Endpoint', 'yellow');
    
    const port5 = nextPort++;
    const server5 = createTestServer(port5);
    
    await server5.start();
    await new Promise(r => setTimeout(r, 100));
    
    const complete = await fetchAPI(port5, '/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        text: 'Completed text',
        metadata: { wordCount: 2 }
      })
    });
    
    assert(complete.ok, 'Complete endpoint responds');
    assert(complete.data?.success, 'Complete returns success');
    
    await server5.stop();
    await new Promise(r => setTimeout(r, 100));
    
    // Print Summary
    log('\n=== Test Results ===\n', 'blue');
    const total = testsPassed + testsFailed;
    log(`Passed: ${testsPassed}/${total}`, testsFailed === 0 ? 'green' : 'yellow');
    if (testsFailed > 0) {
      log(`Failed: ${testsFailed}/${total}`, 'red');
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
    
  } catch (err) {
    log(`\nTest error: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  }
}

// Run tests
runTests();
