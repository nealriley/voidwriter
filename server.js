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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

let completionData = null;
let serverResolve = null;
let server = null;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

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
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

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
