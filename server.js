/**
 * VoidWriter HTTP Server
 * 
 * Lightweight Express server that:
 * - Serves the pre-built React SPA
 * - Provides /api/complete endpoint to receive user input
 * - Handles browser opening and cleanup
 * - Returns captured text as JSON to stdout
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

let completionData = null;
let serverResolve = null;
let server = null;
let uiConfig = {};

// Middleware
app.use(express.json());

/**
 * API endpoint: Receive completed text from browser
 * POST /api/complete
 */
app.post('/api/complete', (req, res) => {
  completionData = req.body;
  res.json({ status: 'received', success: true });
  
  // Resolve the waiting promise to trigger server shutdown
  if (serverResolve) {
    serverResolve();
  }
});

/**
 * Health check endpoint (optional, for monitoring)
 */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Fallback to index.html for SPA routing
 * Injects UI config into window.voidwriterConfig
 * This MUST come before the static middleware to intercept requests
 */
app.get('*', async (_req, res) => {
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
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
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).json({ error: 'Failed to load page' });
  }
});

// Serve static files (assets, etc.) but NOT index.html (handled above)
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    // Don't serve index.html as a static file
    if (path.endsWith('index.html')) {
      res.status(404).send('Not Found');
    }
  }
}));

/**
 * Error handler
 */
app.use((err, _req, res) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    status: 'error', 
    message: err.message 
  });
});

/**
 * Start the server and wait for completion
 */
export function startServer(options = {}) {
  // Store UI config if provided
  if (options.uiConfig) {
    uiConfig = options.uiConfig;
  }
  
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 15 * 60 * 1000; // 15 minutes default
    
    try {
      server = app.listen(PORT, () => {
        if (options.verbose) {
          console.log(`VoidWriter server running on http://localhost:${PORT}`);
        }
      });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        if (options.verbose) {
          console.log('Session timeout reached');
        }
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
        console.error('Server error:', err);
        reject(err);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  });
}

/**
 * Gracefully shutdown server and return data
 */
function shutdown(resolve) {
  if (server) {
    server.close(() => {
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
    resolve(completionData || {});
  }
}

/**
 * Graceful shutdown on signal
 */
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (serverResolve) {
    serverResolve();
  }
});

process.on('SIGTERM', () => {
  if (serverResolve) {
    serverResolve();
  }
});

export default app;
