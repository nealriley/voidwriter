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

import { startServer } from './server.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3344;

let testsPassed = 0;
let testsFailed = 0;

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

// Helper: Fetch with error handling
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`http://localhost:${PORT}${endpoint}`, options);
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
    
    const server1 = startServer({
      uiConfig: { title: 'TEST_1', mainText: 'Hello', subText: 'World' },
      verbose: false,
      timeout: 5000
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const health = await fetchAPI('/api/health');
    assert(health.ok, 'Health endpoint responds');
    assert(health.data?.status === 'ok', 'Health status is ok');
    
    const html = await fetchAPI('/');
    assert(html.ok, 'Root endpoint responds');
    assert(html.data.includes('window.voidwriterConfig'), 'Config injection present');
    assert(html.data.includes('TEST_1'), 'Title parameter injected');
    assert(html.data.includes('Hello'), 'Main text parameter injected');
    assert(html.data.includes('World'), 'Sub text parameter injected');
    
    // Clean up
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 2: Save Mode - Return
    log('\nTEST 2: Save Mode - Return', 'yellow');
    
    const server2 = startServer({
      saveConfig: { mode: 'return', path: null },
      verbose: false,
      timeout: 5000
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const saveReturn = await fetchAPI('/api/save', {
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
    
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 3: Save Mode - Disk
    log('\nTEST 3: Save Mode - Disk', 'yellow');
    
    const tmpFile = path.join(__dirname, '.test-save-disk.txt');
    
    const server3 = startServer({
      saveConfig: { mode: 'disk', path: tmpFile },
      verbose: false,
      timeout: 5000
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const saveDisk = await fetchAPI('/api/save', {
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
    
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 4: Save Mode - Both
    log('\nTEST 4: Save Mode - Both', 'yellow');
    
    const tmpFile2 = path.join(__dirname, '.test-save-both.txt');
    
    const server4 = startServer({
      saveConfig: { mode: 'both', path: tmpFile2 },
      verbose: false,
      timeout: 5000
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const saveBoth = await fetchAPI('/api/save', {
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
    
    await new Promise(r => setTimeout(r, 100));
    
    // TEST 5: Complete Endpoint
    log('\nTEST 5: Complete Endpoint', 'yellow');
    
    const server5 = startServer({
      verbose: false,
      timeout: 5000
    });
    
    await new Promise(r => setTimeout(r, 300));
    
    const complete = await fetchAPI('/api/complete', {
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
