Awesome brief. Here’s a tight kit of free, web-safe fonts that nail the late-70s vector arcade vibe (Asteroids) through early-90s handheld (Game Boy), plus exactly how to wire them into a React + Vite app.

Fonts that feel right

Vector/arcade (Asteroids, Tempest, Defender)
	•	Orbitron — geometric, techno, great for titles and HUDs.
	•	Oxanium — rounded sci-fi sans; clean at small sizes.
	•	Audiowide — 70s/80s “arcade cabinet” logo energy.

Pixel / Game Boy (menus, score text)
	•	Press Start 2P — classic NES/arcade bitmap feel; iconic for headers.
	•	VT323 — CRT terminal/pixel mono; super legible for body text.
	•	Silkscreen — tiny UI pixel font; perfect for status/labels.
	•	Pixelify Sans — modern pixel sans with multiple weights (useful when you want a GB feel with more range).
	•	Tiny5 — blocky, “5px” vibe for ultra-retro microcopy.

All of the above are available via @fontsource (SIL Open Font License), so you can bundle them locally—no external calls in prod.

Install fonts (React + Vite)

# pick what you like from the list:
npm i @fontsource/orbitron @fontsource/oxanium @fontsource/audiowide \
      @fontsource/press-start-2p @fontsource/vt323 @fontsource/silkscreen \
      @fontsource/pixelify-sans @fontsource/tiny5

Import in your app entry

In src/main.tsx (or main.jsx) import the fonts you’ll actually use:

// Vector/arcade
import "@fontsource/orbitron/700.css";
import "@fontsource/oxanium/600.css";
import "@fontsource/audiowide"; // single weight

// Pixel/GB
import "@fontsource/press-start-2p";  // single weight
import "@fontsource/vt323";           // mono
import "@fontsource/silkscreen";      // 400/700 available
import "@fontsource/pixelify-sans/700.css";
import "@fontsource/tiny5";           // single weight

Set a tiny theme with fallbacks

Create src/styles/fonts.css:

:root{
  --font-arcade: "Orbitron", "Oxanium", "Audiowide", system-ui, sans-serif;
  --font-pixel-header: "Press Start 2P", "Pixelify Sans", "Silkscreen", monospace;
  --font-pixel-body: "VT323", "Silkscreen", "Tiny5", monospace;
}

/* Helpful crisping for pixel fonts */
.pixelated {
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: auto;
  font-smooth: never;
  letter-spacing: 0.02em; /* slight spacing for clarity at low sizes */
}

/* Suggested roles */
.hud    { font-family: var(--font-arcade); }
.gb-h1  { font-family: var(--font-pixel-header); }
.gb-txt { font-family: var(--font-pixel-body); font-size: 1.05rem; line-height: 1.1; }

Then import that CSS once (e.g., in main.tsx):

import "./styles/fonts.css";

Use in components

export default function Screen() {
  return (
    <div style={{padding: 24, background: "#0a0a0a", color: "#95ff97"}}>
      <h1 className="hud" style={{fontWeight:700, textTransform:"uppercase"}}>
        ASTEROIDS+
      </h1>

      <h2 className="gb-h1 pixelated" style={{fontSize:"1rem", marginTop:24}}>
        START ▸
      </h2>

      <p className="gb-txt pixelated" style={{maxWidth:480}}>
        SCORE&nbsp;000123  •  LIVES&nbsp;03
      </p>
    </div>
  );
}

Tips for authenticity
	•	Sizes: Pixel fonts look best at whole-number multiples (e.g., 12, 16, 20px). Avoid fractional REMs for crisp edges.
	•	Tracking: Slight positive letter-spacing (0.02–0.05em) helps at small sizes.
	•	Palette: For vector-arcade, neon on charcoal: #0b0b0c bg with #67f6ff, #95ff97, #ffd166. For Game Boy, pea-green tones: bg #0f380f, text #9bbc0f.
	•	All caps for titles with Orbitron/Audiowide; mixed case or monospaced VT323 for HUD readouts.

Quick font pairings (drop-in)
	•	Asteroids-like: Titles Orbitron 700, HUD/body VT323.
	•	Cabinet marquee: Audiowide for logo, Oxanium 600 for UI.
	•	Game Boy UI: Headings Press Start 2P, text VT323 or Silkscreen.

If you want, tell me your exact use (logo, HUD, dialog, scoreboard), and I’ll pick sizes/weights and ship a styled JSX snippet tailored to your screen layout.