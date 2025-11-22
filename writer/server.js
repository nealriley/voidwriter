/**
 * VoidWriter HTTP Server
 * 
 * Lightweight Express server that:
 * - Serves the pre-built React SPA
 * - Provides /api/complete endpoint to receive user input
 * - Handles browser opening and cleanup
 * - Returns captured text as JSON to stdout
 * - Full logging and error tracking
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import Logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let completionData = null;
let serverResolve = null;
let server = null;
let uiConfig = {};
let saveConfig = { mode: 'return', path: null };
let shutdownOnSave = false;
let logger = null;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  if (logger) {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      contentType: req.get('content-type')
    });
  }
  next();
});

/**
 * API endpoint: Receive completed text from browser
 * POST /api/complete
 */
app.post('/api/complete', (req, res) => {
  try {
    completionData = req.body;
    
    if (logger) {
      logger.info('Completion received', {
        wordCount: req.body?.metadata?.wordCount || 0,
        textLength: req.body?.text?.length || 0,
        timestamp: req.body?.metadata?.timestamp
      });
    }
    
    res.json({ status: 'received', success: true });
    
    // Resolve the waiting promise to trigger server shutdown
    if (serverResolve) {
      serverResolve();
    }
  } catch (err) {
    if (logger) {
      logger.error('Error in /api/complete', {
        message: err.message,
        stack: err.stack
      });
    }
    res.status(500).json({ status: 'error', success: false, error: err.message });
  }
});

/**
 * API endpoint: Save buffer to disk and/or return it
 * POST /api/save
 */
app.post('/api/save', async (req, res) => {
  try {
    const { buffer, metadata } = req.body;
    
    if (!buffer) {
      if (logger) {
        logger.warn('Save request without buffer');
      }
      return res.status(400).json({ 
        success: false, 
        error: 'No buffer provided' 
      });
    }
    
    if (logger) {
      logger.info('Save request received', {
        mode: saveConfig.mode,
        bufferSize: buffer.length,
        metadata: metadata
      });
    }
    
    let savedPath = null;
    
    // Write to disk if mode is 'disk' or 'both'
    if ((saveConfig.mode === 'disk' || saveConfig.mode === 'both') && saveConfig.path) {
      try {
        await fs.writeFile(saveConfig.path, buffer, 'utf-8');
        savedPath = saveConfig.path;
        
        if (logger) {
          logger.info('Buffer saved to disk', {
            path: savedPath,
            size: buffer.length
          });
        }
      } catch (err) {
        if (logger) {
          logger.error('Failed to write file', {
            path: saveConfig.path,
            error: err.message
          });
        }
        return res.status(500).json({
          success: false,
          error: `Failed to write file: ${err.message}`
        });
      }
    }
    
    // Return buffer if mode is 'return' or 'both'
    const shouldReturn = saveConfig.mode === 'return' || saveConfig.mode === 'both';
    
    res.json({
      success: true,
      saved: shouldReturn ? { buffer, metadata } : null,
      filePath: savedPath,
      mode: saveConfig.mode
    });
    
    // Trigger shutdown if auto-shutdown on save is enabled
    if (shutdownOnSave && serverResolve) {
      if (logger) {
        logger.info('Save received, triggering auto-shutdown');
      }
      
      // Store the saved data as completion data
      completionData = {
        success: true,
        text: buffer,
        metadata: metadata || {},
        savedVia: 'save-button',
        filePath: savedPath
      };
      
      // Trigger shutdown after a brief delay to ensure response is sent
      setTimeout(() => {
        serverResolve();
      }, 100);
    }
  } catch (err) {
    if (logger) {
      logger.error('Error in /api/save', {
        message: err.message,
        stack: err.stack
      });
    }
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
  try {
    if (logger) {
      logger.debug('Health check');
    }
    res.json({ status: 'ok' });
  } catch (err) {
    if (logger) {
      logger.error('Error in /api/health', {
        message: err.message
      });
    }
    res.status(500).json({ status: 'error' });
  }
});

/**
 * Fallback to index.html for SPA routing
 * Injects UI config into window.voidwriterConfig
 */
app.get('/', async (_req, res) => {
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    
    if (logger) {
      logger.debug('Serving index.html', { path: indexPath });
    }
    
    let html = await fs.readFile(indexPath, 'utf-8');
    
    // Inject config into a script tag in the HTML head
    const configScript = `
    <script>
      window.voidwriterConfig = ${JSON.stringify(uiConfig)};
    </script>
    `;
    
    // Insert before closing </head> tag
    html = html.replace('</head>', configScript + '</head>');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
    if (logger) {
      logger.debug('HTML served with config injection', {
        configKeys: Object.keys(uiConfig)
      });
    }
  } catch (err) {
    if (logger) {
      logger.error('Error serving index.html', {
        message: err.message,
        stack: err.stack
      });
    }
    res.status(500).json({ error: 'Failed to load page' });
  }
});

// Serve static files (assets, etc.) but NOT index.html
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('index.html')) {
      res.status(404).send('Not Found');
    }
  }
}));

/**
 * Error handler
 */
app.use((err, _req, res, _next) => {
  if (logger) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack
    });
  }
  if (res && typeof res.status === 'function') {
    res.status(500).json({ 
      status: 'error', 
      message: err.message 
    });
  }
});

/**
 * Start the server and wait for completion
 */
export function startServer(options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Initialize logger
      logger = new Logger({
        verbose: options.verbose !== false,
        minLevel: options.verbose ? 0 : 1, // DEBUG if verbose, else INFO
        sessionId: options.sessionId
      });
      
      // Wait for logger to initialize
      await logger.initPromise;
      
      // Store UI config if provided
      if (options.uiConfig) {
        uiConfig = options.uiConfig;
        logger.info('UI Config loaded', uiConfig);
      }
      
      // Store save config if provided
      if (options.saveConfig) {
        saveConfig = options.saveConfig;
        logger.info('Save Config loaded', saveConfig);
      }
      
      // Store shutdown on save setting
      if (options.shutdownOnSave !== undefined) {
        shutdownOnSave = options.shutdownOnSave;
        logger.info('Auto-shutdown on save', { enabled: shutdownOnSave });
      }
      
      // Get port from options or environment
      const port = options.port || process.env.PORT || 3333;
      
      const timeout = options.timeout || 15 * 60 * 1000; // 15 minutes default
      
      logger.info('Starting server', {
        port: port,
        timeout: timeout,
        uiConfig: uiConfig,
        saveConfig: saveConfig
      });
      
      server = app.listen(port, () => {
        logger.info('Server started successfully', {
          port: port,
          url: `http://localhost:${port}`,
          logFile: logger.getLogFile()
        });
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        logger.info('Session timeout reached');
        shutdown(resolve);
      }, timeout);

      // Wait for completion or timeout
      serverResolve = () => {
        clearTimeout(timeoutHandle);
        shutdown(resolve);
      };

      // Handle server errors
      server.on('error', (err) => {
        clearTimeout(timeoutHandle);
        logger.error('Server error event', {
          message: err.message,
          code: err.code,
          stack: err.stack
        });
        reject(err);
      });

    } catch (error) {
      logger.fatal('Failed to start server', {
        message: error.message,
        stack: error.stack
      });
      reject(error);
    }
  });
}

/**
 * Gracefully shutdown server and return data
 */
function shutdown(resolve) {
  logger.info('Shutting down server');
  
  if (server) {
    server.close(() => {
      logger.info('Server closed', {
        logFile: logger.getLogFile()
      });
      
      // Print log file location to stdout
      console.log(`\n📋 Log file: ${logger.getLogFile()}`);
      
      // Return the captured data
      if (completionData) {
        resolve(completionData);
      } else {
        // No data received, return empty result
        resolve({
          success: false,
          text: '',
          metadata: {
            cancelled: true,
            wordCount: 0,
            sessionDuration: 0,
            timestamp: new Date().toISOString()
          }
        });
      }
    });
  } else {
    logger.warn('Server not running, cannot shutdown');
    resolve(completionData || {});
  }
}

/**
 * Graceful shutdown on signal
 */
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down');
  if (serverResolve) {
    serverResolve();
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  if (serverResolve) {
    serverResolve();
  }
});

export default app;
