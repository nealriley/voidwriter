# VoidWriter Arcade Cabinet Mode - Task Tracker

## Current Vision
Transform VoidWriter into an arcade cabinet experience where:
- The screen appears as an arcade game display
- Visible hands operate a joystick as you type
- Words float up like Space Invaders being shot down
- Session goals and progress tracking like an arcade game
- Inspired by Chrome's dinosaur game and other playful tech interactions

## Phase 1: Arcade Cabinet Frame (Active)
- [x] Create arcade cabinet bezel/frame overlay
- [x] Add scanlines or CRT effect for retro feel
- [x] Position game view within cabinet screen
- [ ] Add cabinet-style UI elements (score, lives, etc.)

## Phase 2: Player Hands & Joystick
- [x] Create 3D joystick model
- [x] Create simple 3D hands (low-poly style)
- [x] Position hands at bottom of screen holding joystick
- [x] Animate joystick movement when typing
- [x] Animate button presses on space/punctuation
- [x] Switch to MST3K-style 2D silhouette overlay
- [x] Make joystick point toward missile targets

## Phase 3: Typing Feedback Animations
- [ ] Link hand movements to typing rhythm
- [ ] Joystick moves left/right with word positioning
- [ ] Button mash animation for rapid typing
- [ ] Idle animation when not typing
- [ ] Excitement animation at milestones

## Phase 4: Goal & Progress System
- [ ] Daily word count targets
- [ ] Session goals (start small: 50, 100, 200 words)
- [ ] Progress bar arcade-style
- [ ] "Level up" celebrations
- [ ] High score tracking

## Phase 5: Polish & Effects
- [ ] Arcade sound effects (optional/muted by default)
- [ ] Cabinet lighting effects
- [ ] "Insert Coin" start screen
- [ ] Game over/victory screens
- [ ] Leaderboard for personal bests

## Design Principles
- **Playful**: Make writing feel like playing a game
- **Motivating**: Clear goals and progress tracking
- **Non-intrusive**: Animations shouldn't distract from writing
- **Retro-aesthetic**: Classic arcade cabinet feel
- **Responsive**: React to user's typing patterns

## Technical Approach
1. Use React Three Fiber for 3D elements
2. CSS for cabinet frame overlay
3. Simple geometry for hands/joystick
4. localStorage for progress tracking
5. Subtle animations that don't impact performance

## Current Status
Simplified Game Boy Aesthetic Implementation:
- ✅ Clean green outline arcade frame
- ✅ Removed complex joystick code
- ✅ Pixelated Game Boy style D-pad and buttons
- ✅ Press Start 2P pixel font for UI
- ✅ Simplified bottom layout with INPUT/BUFFER on left, SCORE on right

Next: Add interactivity to pixel controls and goal system