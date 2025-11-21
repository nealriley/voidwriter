# VoidWriter

![VoidWriter](https://img.shields.io/badge/VoidWriter-1.0.0-purple)
![React](https://img.shields.io/badge/React-18-blue)
![Three.js](https://img.shields.io/badge/Three.js-Latest-green)

A meditative 3D typing experience optimized for CLI integration. VoidWriter serves as a temporary UI that opens when a CLI tool needs to collect user input. Users type in an immersive 3D environment, and their text is returned as JSON to the parent process.

**🎮 Current Mode:** Arcade-style space invaders game where words are destroyed by missiles as you type.

**⚠️ DISCLAIMER:** This is a demonstration project created to learn React with React Three Fiber. It should not be used in production environments as it hasn't been optimized for performance or tested across all browsers and devices.

## Features

- 🔤 Real-time 3D text rendering with Three.js
- 🎮 Arcade-style gameplay with missiles and explosions
- 💬 CLI-integrated input collection
- 📊 Session metrics and performance tracking
- 💾 Easy text export (download, copy, or return to CLI)
- 🧹 Clear text functionality
- 💿 Pre-built distribution for instant startup

## Quick Start

### For CLI Integration (Recommended)

```bash
# Install dependencies
npm install

# Run as CLI tool
node voidwriter.js "What's your approach?"

# Returns JSON:
# {"success": true, "text": "user's response", "metadata": {...}}
```

See [README-CLI-INTEGRATION.md](./README-CLI-INTEGRATION.md) for detailed integration guide.

### For Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# Opens http://localhost:5173

# Build for production/CLI
npm run build:cli
```

## Architecture

VoidWriter is designed as a **temporary UI service** for CLI tools:

```
Python/Node CLI Tool
    ↓ spawns
Node.js HTTP Server (localhost:3333)
    ↓ serves
Browser + VoidWriter App
    ↓ user types
JSON returned to CLI
```

## Usage

### Standalone Development

1. Run `npm run dev` to start the Vite dev server
2. Open http://localhost:5173 in your browser
3. Start typing on your keyboard
4. Press Ctrl+Enter or click "Submit" to complete input

### CLI Integration

```bash
# Basic usage
node voidwriter.js "Your prompt text"

# With options
node voidwriter.js \
  --prompt "Describe your approach" \
  --timeout 900 \
  --port 3333 \
  --min-words 10

# Returns JSON to stdout for parent process to capture
```

## Project Structure

```
voidwriter/
├── src/
│   ├── App.tsx              # Main game/UI component
│   ├── App.css              # Game styling
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── dist/                    # Pre-built SPA (committed)
├── server.js                # Express HTTP server
├── voidwriter.js            # CLI entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── PROMPT.md                # Architecture documentation
```

## NPM Scripts

```bash
npm run dev         # Start Vite dev server
npm run build       # Build for development
npm run build:cli   # Build for CLI distribution
npm run start       # Run as CLI tool (requires prompt argument)
npm run start:dev   # Run CLI tool with dev server
npm run lint        # Lint TypeScript/React code
npm run typecheck   # Type check TypeScript
```

## Development

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`

### Code Style

- Use TypeScript for type safety
- Follow existing patterns (functional components, hooks)
- Keep components focused and modular
- Run `npm run typecheck` to ensure type correctness
- Run `npm run lint` before committing

## Technologies Used

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Three.js](https://threejs.org/) - 3D graphics
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - React bindings for Three.js
- [React Three Drei](https://github.com/pmndrs/drei) - Utility components
- [React Spring](https://www.react-spring.dev/) - Animations
- [Express](https://expressjs.com/) - HTTP server
- [yargs](http://yargs.js.org/) - CLI argument parsing
- [open](https://github.com/sindresorhus/open) - Cross-platform browser opener

## Contributing

When adding new features:

- Keep the CLI integration in mind (ensure text can be captured)
- Add submit/complete functionality for CLI mode
- Preserve existing typing experience
- Test manual flow: `node voidwriter.js "test"`
- Commit with clear messages explaining changes

## License

MIT

