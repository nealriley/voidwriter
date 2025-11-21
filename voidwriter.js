#!/usr/bin/env node

/**
 * VoidWriter CLI Entry Point
 * 
 * This script:
 * 1. Parses CLI arguments
 * 2. Ensures dist/ is built
 * 3. Starts the HTTP server
 * 4. Opens browser
 * 5. Waits for user input completion
 * 6. Returns JSON to stdout for parent process
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command line arguments
 */
const argv = yargs(hideBin(process.argv))
  .option('prompt', {
    alias: 'p',
    type: 'string',
    description: 'Text prompt to display in the UI',
    default: 'Start writing...'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    description: 'Session timeout in seconds',
    default: 900 // 15 minutes
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Server port',
    default: 3333
  })
  .option('min-words', {
    type: 'number',
    description: 'Minimum words required to submit',
    default: 1
  })
  .option('title', {
    type: 'string',
    description: 'UI title text (defaults to SKYWRITER)',
    default: null
  })
  .option('main-text', {
    type: 'string',
    description: 'Main instruction text displayed when empty',
    default: null
  })
  .option('sub-text', {
    type: 'string',
    description: 'Sub-instruction text displayed below main text',
    default: null
  })
  .option('no-open', {
    type: 'boolean',
    description: 'Do not automatically open browser',
    default: false
  })
  .option('headless', {
    type: 'boolean',
    description: 'Run in headless mode (no browser)',
    default: false
  })
  .option('dev', {
    type: 'boolean',
    description: 'Run with dev server instead of built dist',
    default: false
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Show detailed logging',
    default: false
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Write output to file instead of stdout',
    default: null
  })
  .help()
  .parseSync();

/**
 * Main CLI function
 */
async function main() {
  try {
    // Check if dist exists
    const distExists = existsSync(path.join(__dirname, 'dist'));
    
    if (!distExists && !argv.dev) {
      if (argv.verbose) {
        console.error('dist/ not found. Building...');
      }
      
      const buildResult = spawnSync('npm', ['run', 'build:cli'], {
        cwd: __dirname,
        stdio: argv.verbose ? 'inherit' : 'pipe'
      });
      
      if (buildResult.status !== 0) {
        console.error('Build failed');
        process.exit(1);
      }
    }

     // Set environment variables for server
     process.env.PORT = argv.port;
     process.env.PROMPT = argv.prompt;
     process.env.MIN_WORDS = argv['min-words'];

     if (argv.verbose) {
       console.log('Starting VoidWriter server...');
       console.log(`  Prompt: ${argv.prompt}`);
       console.log(`  Timeout: ${argv.timeout}s`);
       console.log(`  Port: ${argv.port}`);
       if (argv.title) console.log(`  Title: ${argv.title}`);
       if (argv.mainText) console.log(`  Main Text: ${argv.mainText}`);
       if (argv.subText) console.log(`  Sub Text: ${argv.subText}`);
     }

     // Build UI config to pass to browser
     const uiConfig = {
       title: argv.title || null,
       mainText: argv.mainText || null,
       subText: argv.subText || null
     };

     // Start the server and wait for completion
     const result = await startServer({
       timeout: argv.timeout * 1000,
       verbose: argv.verbose,
       uiConfig
     });

    // Open browser if requested
    if (!argv.noOpen && !argv.headless) {
      try {
        await open(`http://localhost:${argv.port}`);
      } catch (err) {
        if (argv.verbose) {
          console.error('Could not open browser automatically');
          console.log(`Please visit: http://localhost:${argv.port}`);
        }
      }
    } else if (argv.verbose) {
      console.log(`Server available at: http://localhost:${argv.port}`);
    }

    // Wait for server to return result
    const output = {
      success: result.success !== false,
      text: result.text || '',
      metadata: result.metadata || {
        wordCount: (result.text || '').split(/\s+/).filter(w => w.length > 0).length,
        sessionDuration: 0,
        timestamp: new Date().toISOString()
      }
    };

    // Output result
    if (argv.output) {
      // Write to file
      import('fs/promises').then(async (fs) => {
        await fs.writeFile(argv.output, JSON.stringify(output, null, 2));
        if (argv.verbose) {
          console.log(`Results written to: ${argv.output}`);
        }
      });
    } else {
      // Write to stdout as JSON
      console.log(JSON.stringify(output));
    }

    process.exit(0);

  } catch (error) {
    console.error('VoidWriter error:', error.message);
    if (argv.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the CLI
main();
