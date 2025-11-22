/**
 * VoidWriter Centralized Logging System
 * 
 * Logs all events, errors, and diagnostics to:
 * - Console (real-time feedback)
 * - Log file in .voidwriter/logs/
 * - Structured for easy debugging
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// Color codes for console output
const COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[32m',     // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  FATAL: '\x1b[35m',    // Magenta
  reset: '\x1b[0m'
};

class Logger {
  constructor(options = {}) {
    this.minLevel = options.minLevel || LOG_LEVELS.INFO;
    this.logDir = options.logDir || path.join(os.homedir(), '.voidwriter', 'logs');
    this.verbose = options.verbose !== false;
    this.sessionId = options.sessionId || this.generateSessionId();
    this.sessionLogFile = null;
    this.initPromise = this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.sessionLogFile = path.join(this.logDir, `voidwriter-${timestamp}-${this.sessionId}.log`);
      
      // Write session header
      const header = `
================================================================================
VoidWriter Session Log
================================================================================
Session ID: ${this.sessionId}
Started: ${new Date().toISOString()}
Hostname: ${os.hostname()}
Platform: ${os.platform()}
Node Version: ${process.version}
================================================================================
`;
      await fs.appendFile(this.sessionLogFile, header);
    } catch (err) {
      console.error('Failed to initialize logger:', err);
    }
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 11);
  }

  async log(level, message, data = null) {
    // Wait for initialization
    await this.initPromise;

    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const color = COLORS[level] || '';
    
    // Format console output
    const consoleMsg = `${color}[${timestamp}] [${level}]${COLORS.reset} ${message}`;
    
    // Format file output
    const fileMsg = `[${timestamp}] [${level}] ${message}${data ? '\n' + this.formatData(data) : ''}`;

    // Output to console if verbose
    if (this.verbose) {
      console.log(consoleMsg);
      if (data) {
        console.log(this.formatData(data));
      }
    }

    // Write to file
    try {
      await fs.appendFile(this.sessionLogFile, fileMsg + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  formatData(data) {
    if (typeof data === 'string') {
      return `  ${data}`;
    }
    try {
      return '  ' + JSON.stringify(data, null, 2).split('\n').join('\n  ');
    } catch {
      return `  ${String(data)}`;
    }
  }

  debug(message, data) {
    return this.log('DEBUG', message, data);
  }

  info(message, data) {
    return this.log('INFO', message, data);
  }

  warn(message, data) {
    return this.log('WARN', message, data);
  }

  error(message, data) {
    return this.log('ERROR', message, data);
  }

  fatal(message, data) {
    return this.log('FATAL', message, data);
  }

  getLogFile() {
    return this.sessionLogFile;
  }

  getLogsDir() {
    return this.logDir;
  }
}

export default Logger;
