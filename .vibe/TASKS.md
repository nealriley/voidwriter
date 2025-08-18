# VoidWriter Implementation Tasks

## Current Sprint: Distraction-Free Writing Core

### Phase 1: Foundation (Active)
- [x] Create TASKS.md for tracking implementation
- [x] ~~Implement River Flow positioning system~~ (Too many words disappear)
- [x] ~~Add graduated opacity/blur system based on word age~~ (Reworking)
- [x] Remove random positioning entirely
- [x] ~~Implement Typewriter positioning~~ (Words go off screen)

### Phase 1.5: Space Invaders Mode v2 (Active)
- [x] Create bottom "typing zone" for current word buffer
- [x] Implement "shoot up" animation when word is completed
- [x] Queue-based word management (no instant clearing)
- [x] Smooth transitions for all word movements
- [x] Delayed missile system (1-2 second shots)
- [x] Multiple rows when typing faster than destroying (6 columns grid)
- [x] Sequential destruction with proper timing
- [x] Hit box detection for word destruction
- [x] Maintain word flow during rapid typing
- [x] Dynamic missile tracking (follows moving targets)
- [x] FIFO destruction (oldest words destroyed first)
- [x] Score system (displays every 10 words)

### Phase 2: Focus Enhancement (COMPLETED)
- [x] Hide all UI elements when typing starts (auto-hide command console)
- [x] Implement breathing void with subtle expansion/contraction
- [x] Add typing rhythm particles (minimal, 10-20 max)
- [x] Create smooth fade-out system for completed words
- [x] Implement depth of field post-processing (simplified without extra deps)

### Phase 3: Flow State Features (COMPLETED)
- [x] Add flow detection based on typing consistency
- [x] DDR-style color feedback system (Perfect/Great/Good/Miss)
- [x] Implement vibrant environment response to typing rhythm
- [x] Add momentum trails for fast typing with color gradients
- [x] Dynamic background color shifts based on performance
- [x] Combo counter with color intensity rewards
- [x] Beat indicators that pulse with typing rhythm

### Phase 4: Polish & Testing (COMPLETED)
- [x] Optimize performance (simplified rendering)
- [x] Add emergency save gesture (triple-tap ESC)
- [x] Implement session recording (tracks all words)
- [x] Create post-session summary view (on clear)
- [x] Auto-cleanup last word after 3 seconds of inactivity
- [ ] Test with actual writers for flow state achievement

## Design Principles (from VISION.md)
- **Minimal**: Remove all distractions
- **Predictable**: No sudden movements or changes
- **Organic**: Natural, flowing animations only
- **Focused**: Current text sharp, old text fades
- **Silent**: No metrics or UI during writing

## Current Focus
Starting with River Flow positioning to replace random placement. This creates a predictable, meditative flow where words drift away naturally.