import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import './App.css';

interface Word {
  id: number;
  text: string;
  row: number;
  col: number;
  targetRow: number;
  targetCol: number;
  isMoving: boolean;
  isDestroying: boolean;
}

interface Missile {
  id: number;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  wordId: number;
}

interface Explosion {
  id: number;
  position: [number, number, number];
}

interface ScorePopup {
  id: number;
  score: number;
  position: [number, number, number];
}

interface TypingParticle {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
}

type PerformanceRating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

interface TypingPerformance {
  lastTypeTime: number;
  averageInterval: number;
  combo: number;
  rating: PerformanceRating;
}

const COLS_PER_ROW = 3;
const ROW_HEIGHT = 1.8;
const COL_WIDTH = 4.5;
const MISSILE_SPEED = 1.2;
const MISSILE_DELAY = 0.3;


function MissileProjectile({ 
  missile, 
  onHit,
  words 
}: { 
  missile: Missile;
  onHit: (wordId: number) => void;
  words: Word[];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const [progress, setProgress] = useState(0);
  const { viewport } = useThree();
  const startY = viewport.height / 2 - 2;

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const newProgress = Math.min(elapsed / MISSILE_SPEED, 1);
    setProgress(newProgress);
    
    if (newProgress >= 0.98 && progress < 0.98) {
      onHit(missile.wordId);
    }
  });

  // Find the current target word and calculate its actual position
  const targetWord = words.find(w => w.id === missile.wordId);
  let targetPos: [number, number, number] = missile.targetPos;
  
  if (targetWord) {
    // Calculate the actual current position of the word (with 10% shift down)
    const adjustedStartY = startY - (viewport.height * 0.1);
    const targetX = (targetWord.targetCol - COLS_PER_ROW / 2 + 0.5) * COL_WIDTH;
    const targetY = adjustedStartY - targetWord.targetRow * ROW_HEIGHT;
    targetPos = [targetX, targetY, 0];
  }

  // Smoothly interpolate to the moving target
  const currentPos: [number, number, number] = [
    missile.startPos[0] + (targetPos[0] - missile.startPos[0]) * progress,
    missile.startPos[1] + (targetPos[1] - missile.startPos[1]) * progress,
    missile.startPos[2] + (targetPos[2] - missile.startPos[2]) * progress,
  ];

  // Calculate rotation to point at target
  const direction = new THREE.Vector3(
    targetPos[0] - currentPos[0],
    targetPos[1] - currentPos[1],
    targetPos[2] - currentPos[2]
  ).normalize();
  
  const rotationZ = Math.atan2(direction.y, direction.x) - Math.PI / 2;

  return (
    <group position={currentPos} rotation={[0, 0, rotationZ]}>
      <mesh ref={meshRef}>
        <coneGeometry args={[0.1, 0.4, 4]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      <pointLight color="#00ff00" intensity={2} distance={2} />
    </group>
  );
}

function ExplosionEffect({ position, onComplete }: { 
  position: [number, number, number];
  onComplete: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    setScale(1 + elapsed * 4);
    setOpacity(Math.max(0, 1 - elapsed * 2));
    
    if (elapsed > 0.5) {
      onComplete();
    }
  });

  // Create multiple explosion fragments
  const fragments = useMemo(() => {
    const frags = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      frags.push({
        x: Math.cos(angle) * 0.3,
        y: Math.sin(angle) * 0.3,
        z: (Math.random() - 0.5) * 0.2
      });
    }
    return frags;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {fragments.map((frag, i) => (
        <mesh key={i} position={[frag.x, frag.y, frag.z]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial 
            color="#ff6600" 
            transparent 
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

function WordInGrid({ 
  word,
  onPositionUpdate
}: { 
  word: Word;
  onPositionUpdate: (id: number) => void;
}) {
  const { viewport } = useThree();
  const startY = viewport.height / 2 - 2 - (viewport.height * 0.1); // Move down by 10%
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const targetX = (word.targetCol - COLS_PER_ROW / 2 + 0.5) * COL_WIDTH;
  const targetY = startY - word.targetRow * ROW_HEIGHT;
  
  const springProps = useSpring({
    from: hasInitialized ? undefined : { 
      x: 0, 
      y: -viewport.height / 2 + 1,
      scale: 0.5
    },
    to: { 
      x: targetX, 
      y: targetY,
      scale: word.isDestroying ? 0 : 1
    },
    config: word.isMoving ? { ...config.wobbly, tension: 300, friction: 20 } : config.default,
    onRest: () => {
      if (!hasInitialized) setHasInitialized(true);
      onPositionUpdate(word.id);
    }
  });

  // Simple green color system
  const color = word.isDestroying ? "#ff0000" : "#00ff00";

  return (
    <animated.group 
      position-x={springProps.x} 
      position-y={springProps.y}
      scale={springProps.scale}
    >
      <Text
        fontSize={0.6}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={color}
      >
        {word.text}
      </Text>
    </animated.group>
  );
}

function CurrentTypingWord({ word }: { word: string }) {
  const { viewport } = useThree();
  const bottomY = -viewport.height / 2 + 1;
  
  return (
    <group position={[0, bottomY, 0]}>
      <Text
        fontSize={0.8}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#00ff00"
      >
        {word || '_'}
      </Text>
    </group>
  );
}

function BreathingVoid({ pulseIntensity }: { pulseIntensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const [glowAmount, setGlowAmount] = useState(0);
  
  useEffect(() => {
    // Pulse effect when missile fires or hits
    if (pulseIntensity > 0) {
      setGlowAmount(pulseIntensity);
      const timer = setTimeout(() => setGlowAmount(0), 300);
      return () => clearTimeout(timer);
    }
  }, [pulseIntensity]);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const breathingScale = 1 + Math.sin(clock.elapsedTime * 0.3) * 0.02;
      meshRef.current.scale.set(breathingScale, breathingScale, 1);
      
      // Subtle rotation for organic feel
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.01;
      
      // Very subtle color shift - only go from #000800 to #001100
      const greenIntensity = Math.floor(8 + glowAmount * 9); // 8-17 (very dark green range)
      const color = `#00${greenIntensity.toString(16).padStart(2, '0')}00`;
      (meshRef.current.material as THREE.MeshBasicMaterial).color.set(color);
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <meshBasicMaterial 
        color="#000800"
        transparent 
        opacity={0.95}
      />
    </mesh>
  );
}

function TypingParticleEffect({ particle }: { particle: TypingParticle }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState(0.6);
  const [currentPos, setCurrentPos] = useState(particle.position);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      // Update position based on velocity
      const newPos: [number, number, number] = [
        currentPos[0] + particle.velocity[0] * delta,
        currentPos[1] + particle.velocity[1] * delta,
        currentPos[2] + particle.velocity[2] * delta
      ];
      setCurrentPos(newPos);
      
      // Fade out over lifetime (slower fade)
      const newOpacity = Math.max(0, opacity - delta * 0.3);
      setOpacity(newOpacity);
      
      // Subtle rotation
      meshRef.current.rotation.z += delta * 3;
    }
  });
  
  return (
    <mesh ref={meshRef} position={currentPos}>
      <boxGeometry args={[0.02, 0.02, 0.02]} />
      <meshBasicMaterial 
        color="#00ff00" 
        transparent 
        opacity={opacity * 0.5}
      />
    </mesh>
  );
}

function ScorePopupEffect({ 
  popup, 
  onComplete 
}: { 
  popup: ScorePopup;
  onComplete: () => void;
}) {
  const startTime = useRef(Date.now());
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [yOffset, setYOffset] = useState(0);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    if (elapsed < 0.15) {
      // Quick fade in
      setOpacity(elapsed / 0.15);
      setScale(0.5 + (elapsed / 0.15) * 0.3);
    } else if (elapsed < 1.0) {
      // Brief hold
      setOpacity(1);
      setScale(0.8);
      setYOffset((elapsed - 0.15) * 0.4); // Gentle float up
    } else if (elapsed < 1.3) {
      // Quick fade out
      const fadeProgress = (elapsed - 1.0) / 0.3;
      setOpacity(1 - fadeProgress);
      setScale(0.8 - fadeProgress * 0.3);
      setYOffset(0.35 + (elapsed - 1.0) * 0.4);
    } else {
      onComplete();
    }
  });

  return (
    <group position={[popup.position[0], popup.position[1] + yOffset, popup.position[2]]}>
      <Text
        fontSize={0.85}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.035}
        outlineColor="#009900"
        fillOpacity={opacity * 0.85}
        outlineOpacity={opacity * 0.85}
        scale={scale}
      >
        {`+${popup.score}`}
      </Text>
    </group>
  );
}


function SpaceInvadersApp() {
  const [currentWord, setCurrentWord] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [typingParticles, setTypingParticles] = useState<TypingParticle[]>([]);
  const [textBuffer, setTextBuffer] = useState<string[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [nextWordId, setNextWordId] = useState(1);
  const [performance, setPerformance] = useState<TypingPerformance>({
    lastTypeTime: Date.now(),
    averageInterval: 0,
    combo: 0,
    rating: 'GOOD'
  });
  const [backgroundPulse, setBackgroundPulse] = useState(0);
  const missileQueueRef = useRef<number[]>([]);
  const lastMissileTimeRef = useRef(0);
  const nextMissileIdRef = useRef(1);
  const wordsRef = useRef<Word[]>([]);
  const lastScoreRef = useRef(0);
  const nextParticleIdRef = useRef(1);
  const typingIntervalsRef = useRef<number[]>([]);
  const escPressesRef = useRef<number[]>([]);
  const emergencySaveTriggeredRef = useRef(false);
  const lastWordAddedTimeRef = useRef(Date.now());
  const autoCleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  const findNextPosition = useCallback((existingWords: Word[]) => {
    const occupied = new Set(
      existingWords
        .filter(w => !w.isDestroying)
        .map(w => `${w.targetRow},${w.targetCol}`)
    );
    
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < COLS_PER_ROW; col++) {
        if (!occupied.has(`${row},${col}`)) {
          return { row, col };
        }
      }
    }
    return { row: 0, col: 0 };
  }, []);

  const addWord = useCallback((text: string) => {
    console.log(`Adding word: "${text}", Next ID: ${nextWordId}`);
    
    // Track when this word was added
    lastWordAddedTimeRef.current = Date.now();
    
    // Clear any existing auto-cleanup timer
    if (autoCleanupTimerRef.current) {
      clearTimeout(autoCleanupTimerRef.current);
      autoCleanupTimerRef.current = null;
    }
    
    setWords(prev => {
      console.log('Previous words:', prev.map(w => ({ id: w.id, text: w.text, destroying: w.isDestroying })));
      
      const pos = findNextPosition(prev);
      console.log(`Next position for word "${text}": row=${pos.row}, col=${pos.col}`);
      
      const newWord: Word = {
        id: nextWordId,
        text,
        row: -1,
        col: 0,
        targetRow: pos.row,
        targetCol: pos.col,
        isMoving: true,
        isDestroying: false
      };
      
      const updatedWords = [...prev, newWord];
      
      // When we have more than 1 word, mark ALL previous words for destruction
      if (updatedWords.length > 1) {
        // Queue all words except the newest one for destruction
        const wordsToDestroy = updatedWords
          .slice(0, -1) // All except the last (newest) word
          .filter(w => !w.isDestroying && !missileQueueRef.current.includes(w.id));
        
        wordsToDestroy.forEach(word => {
          console.log(`Queueing word (ID ${word.id}, "${word.text}") for destruction`);
          missileQueueRef.current.push(word.id);
        });
        
        console.log(`Queued ${wordsToDestroy.length} words for destruction. Total in queue: ${missileQueueRef.current.length}`);
      }
      
      console.log('Updated words:', updatedWords.map(w => ({ id: w.id, text: w.text })));
      wordsRef.current = updatedWords; // Keep ref in sync
      return updatedWords;
    });
    
    setTextBuffer(prev => {
      const newBuffer = [...prev, text];
      
      // Check if we've hit a milestone (every 10 words)
      if (newBuffer.length % 10 === 0 && newBuffer.length > lastScoreRef.current) {
        lastScoreRef.current = newBuffer.length;
        
        // Create a score popup in the upper corners (less intrusive)
        const side = Math.random() > 0.5 ? 1 : -1;
        const randomX = side * (4 + Math.random() * 2); // Far left or right
        const randomY = 3 + Math.random(); // Upper area
        
        setScorePopups(prevPopups => [...prevPopups, {
          id: Date.now(),
          score: newBuffer.length,
          position: [randomX, randomY, 0]
        }]);
        
        console.log(`Score milestone reached: ${newBuffer.length} words!`);
      }
      
      return newBuffer;
    });
    setNextWordId(prev => prev + 1);
  }, [nextWordId, findNextPosition]);

  const completeWord = useCallback(() => {
    if (currentWord.trim()) {
      addWord(currentWord);
      setCurrentWord('');
      // Subtle pulse background on word completion (missile fire)
      setBackgroundPulse(0.3);
      setTimeout(() => setBackgroundPulse(0), 300);
    }
  }, [currentWord, addWord]);

  const handleWordPositioned = useCallback((wordId: number) => {
    setWords(prev => {
      const updated = prev.map(w => 
        w.id === wordId ? { ...w, isMoving: false } : w
      );
      wordsRef.current = updated; // Keep ref in sync
      return updated;
    });
  }, []);

  const handleMissileHit = useCallback((wordId: number) => {
    console.log(`Missile hit word ID: ${wordId}`);
    
    // Subtle pulse background on missile hit
    setBackgroundPulse(0.6);
    setTimeout(() => setBackgroundPulse(0), 400);
    
    // Get the word's actual current position for the explosion
    const word = wordsRef.current.find(w => w.id === wordId);
    if (word) {
      // Use actual viewport dimensions - these should match what's used in WordInGrid
      const viewportHeight = 10; // This is approximate, but matches our missile calculations
      const startY = viewportHeight / 2 - 2 - viewportHeight * 0.1; // Include 10% shift
      const targetX = (word.targetCol - COLS_PER_ROW / 2 + 0.5) * COL_WIDTH;
      const targetY = startY - word.targetRow * ROW_HEIGHT;
      
      console.log(`Creating explosion at position: [${targetX}, ${targetY}, 0]`);
      
      setExplosions(prevExplosions => [...prevExplosions, {
        id: Date.now(),
        position: [targetX, targetY, 0]
      }]);
    }
    
    setWords(prev => {
      const updated = prev.map(w => 
        w.id === wordId ? { ...w, isDestroying: true } : w
      );
      wordsRef.current = updated; // Keep ref in sync
      return updated;
    });
    
    setTimeout(() => {
      console.log(`Removing word ID ${wordId} from list`);
      setWords(prev => {
        const filtered = prev.filter(w => w.id !== wordId);
        wordsRef.current = filtered; // Keep ref in sync
        return filtered;
      });
    }, 500);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Process multiple missiles if enough time has passed
      while (missileQueueRef.current.length > 0 && 
             now - lastMissileTimeRef.current > MISSILE_DELAY * 1000) {
        
        console.log('Missile queue:', missileQueueRef.current);
        const targetWordId = missileQueueRef.current.shift();
        
        if (targetWordId) {
          console.log(`Processing missile for word ID: ${targetWordId}`);
          // Use the ref instead of state to get the most current words
          const targetWord = wordsRef.current.find(w => w.id === targetWordId);
          console.log('Target word from ref:', targetWord);
          
          if (targetWord && !targetWord.isDestroying) {
            const viewport = { height: 10, width: 16 };
            const startY = viewport.height / 2 - 2 - viewport.height * 0.1; // Include 10% shift
            const targetX = (targetWord.targetCol - COLS_PER_ROW / 2 + 0.5) * COL_WIDTH;
            const targetY = startY - targetWord.targetRow * ROW_HEIGHT;
            
            const missile: Missile = {
              id: nextMissileIdRef.current++,
              startPos: [0, -viewport.height / 2 + 1, 0],
              targetPos: [targetX, targetY, 0],
              wordId: targetWordId
            };
            
            console.log('Creating missile:', missile);
            setMissiles(prev => [...prev, missile]);
            lastMissileTimeRef.current = now;
            
            // Only process one missile per interval to maintain spacing
            break;
          } else {
            console.log('Word not found or already destroying, skipping missile');
            // Continue to next word in queue without updating timer
          }
        }
      }
    }, 50); // Check more frequently for smoother missile launches
    
    return () => clearInterval(interval);
  }, []);

  const createTypingParticle = useCallback(() => {
    // Clean up old particles (keep max 10 for subtlety)
    setTypingParticles(prev => {
      const filtered = prev.filter(p => p.life > 0);
      if (filtered.length >= 10) {
        return filtered.slice(-9); // Keep last 9 to add 1 new
      }
      return filtered;
    });
    
    // Create new particle that emanates from the typing area at the bottom
    const particle: TypingParticle = {
      id: nextParticleIdRef.current++,
      position: [(Math.random() - 0.5) * 2, -4.5, 0], // Start at bottom near typing word
      velocity: [
        (Math.random() - 0.5) * 1, // Slower horizontal spread
        Math.random() * 0.5 + 0.3, // Gentle upward float
        0 // No Z movement for cleaner look
      ],
      life: 1
    };
    
    setTypingParticles(prev => [...prev, particle]);
  }, []);

  const calculatePerformanceRating = useCallback((interval: number): PerformanceRating => {
    // DDR-style timing windows (in milliseconds)
    if (interval < 150) return 'PERFECT';  // Very fast, consistent
    if (interval < 300) return 'GREAT';    // Fast typing
    if (interval < 500) return 'GOOD';     // Normal typing
    return 'MISS';                         // Slow or after pause
  }, []);

  const updateTypingPerformance = useCallback(() => {
    const now = Date.now();
    const interval = now - performance.lastTypeTime;
    
    // Add to intervals for averaging (keep last 10)
    typingIntervalsRef.current.push(interval);
    if (typingIntervalsRef.current.length > 10) {
      typingIntervalsRef.current.shift();
    }
    
    // Calculate average interval
    const avgInterval = typingIntervalsRef.current.reduce((a, b) => a + b, 0) / typingIntervalsRef.current.length;
    const rating = calculatePerformanceRating(interval);
    
    // Update combo
    const newCombo = rating === 'PERFECT' || rating === 'GREAT' 
      ? performance.combo + 1 
      : rating === 'GOOD' 
        ? performance.combo 
        : 0;
    
    setPerformance({
      lastTypeTime: now,
      averageInterval: avgInterval,
      combo: newCombo,
      rating
    });
    
    // Show combo popup every 10 combo
    if (newCombo > 0 && newCombo % 10 === 0) {
      // Place combo popups at the top edges
      const side = Math.random() > 0.5 ? 1 : -1;
      const randomX = side * (5 + Math.random()); // Far edges
      const randomY = 4; // Top of screen
      
      setScorePopups(prev => [...prev, {
        id: Date.now(),
        score: newCombo,
        position: [randomX, randomY, 0]
      }]);
    }
  }, [performance, calculatePerformanceRating]);

  const triggerEmergencySave = useCallback(() => {
    if (emergencySaveTriggeredRef.current) return;
    
    emergencySaveTriggeredRef.current = true;
    const content = textBuffer.join(' ');
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `emergency-save-${timestamp}.txt`;
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    // Visual feedback - flash the screen
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = '#00ff00';
    flash.style.opacity = '0.3';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '9999';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      document.body.removeChild(flash);
      emergencySaveTriggeredRef.current = false;
    }, 300);
    
    console.log(`Emergency save: ${filename}`);
  }, [textBuffer]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      
      // Track ESC presses for emergency save
      const now = Date.now();
      escPressesRef.current.push(now);
      
      // Keep only presses within last 500ms
      escPressesRef.current = escPressesRef.current.filter(t => now - t < 500);
      
      // Triple-tap detected
      if (escPressesRef.current.length >= 3) {
        triggerEmergencySave();
        escPressesRef.current = [];
      }
      
      return;
    }
    
    if (/^[a-zA-Z]$/.test(event.key)) {
      setCurrentWord(prev => prev + event.key);
      // Auto-hide the panel when user starts typing
      if (isPanelVisible) {
        setIsPanelVisible(false);
      }
      // Update typing performance
      updateTypingPerformance();
      // Optionally create typing particle for visual feedback
      // Commented out as it might be distracting
      // createTypingParticle();
    } else if (event.key === 'Backspace') {
      setCurrentWord(prev => prev.slice(0, -1));
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      completeWord();
    } else if (/[.!?,;:]/.test(event.key)) {
      // For punctuation: add it to current word, then complete the word
      const wordWithPunctuation = currentWord + event.key;
      if (wordWithPunctuation.trim()) {
        addWord(wordWithPunctuation);
        setCurrentWord('');
      }
    }
  }, [completeWord, addWord, currentWord, isPanelVisible, createTypingParticle, updateTypingPerformance, triggerEmergencySave]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Keep wordsRef in sync with words state
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  // Auto-cleanup last word after 3 seconds of inactivity
  useEffect(() => {
    // Count non-destroying words
    const activeWords = words.filter(w => !w.isDestroying);
    
    if (activeWords.length === 1) {
      // Clear any existing timer
      if (autoCleanupTimerRef.current) {
        clearTimeout(autoCleanupTimerRef.current);
      }
      
      // Set up new timer to destroy the last word
      autoCleanupTimerRef.current = setTimeout(() => {
        const timeSinceLastWord = Date.now() - lastWordAddedTimeRef.current;
        
        // Only destroy if it's been 3 seconds since last word was added
        if (timeSinceLastWord >= 3000) {
          const lastWord = activeWords[0];
          if (lastWord && !missileQueueRef.current.includes(lastWord.id)) {
            console.log(`Auto-cleanup: Queueing last word (ID ${lastWord.id}) for destruction`);
            missileQueueRef.current.push(lastWord.id);
          }
        }
      }, 3000);
    } else {
      // Clear timer if we don't have exactly 1 word
      if (autoCleanupTimerRef.current) {
        clearTimeout(autoCleanupTimerRef.current);
        autoCleanupTimerRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (autoCleanupTimerRef.current) {
        clearTimeout(autoCleanupTimerRef.current);
      }
    };
  }, [words]);

  // Clean up particles that have faded out
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingParticles(prev => prev.filter(p => p.life > 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearAll = useCallback(() => {
    // Clear auto-cleanup timer
    if (autoCleanupTimerRef.current) {
      clearTimeout(autoCleanupTimerRef.current);
      autoCleanupTimerRef.current = null;
    }
    
    // Show session summary before clearing
    if (textBuffer.length > 0) {
      const avgInterval = typingIntervalsRef.current.length > 0
        ? typingIntervalsRef.current.reduce((a, b) => a + b, 0) / typingIntervalsRef.current.length
        : 0;
      const wpm = avgInterval > 0 ? Math.round(60000 / (avgInterval * 5)) : 0; // Rough WPM estimate
      
      // Create summary popup
      setScorePopups(prev => [...prev, {
        id: Date.now(),
        score: textBuffer.length * 10, // Total "score"
        position: [0, 0, 0]
      }]);
      
      console.log(`Session Summary:
        Words: ${textBuffer.length}
        Best Combo: ${performance.combo}
        Avg Speed: ~${wpm} WPM
        Performance: ${performance.rating}`);
    }
    
    setCurrentWord('');
    setWords([]);
    wordsRef.current = []; // Clear the ref too
    setMissiles([]);
    setExplosions([]);
    setScorePopups([]);
    setTypingParticles([]);
    setTextBuffer([]);
    missileQueueRef.current = [];
    lastScoreRef.current = 0; // Reset score tracking
    typingIntervalsRef.current = []; // Reset intervals
    lastWordAddedTimeRef.current = Date.now(); // Reset last word time
    setPerformance({
      lastTypeTime: Date.now(),
      averageInterval: 0,
      combo: 0,
      rating: 'GOOD'
    });
  }, [textBuffer, performance]);

  const handleDownload = useCallback(() => {
    const content = textBuffer.join(' ');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `space-text-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [textBuffer]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textBuffer.join(' '));
  }, [textBuffer]);

  return (
    <div className="app" style={{ background: '#000' }}>
      <div className={`typing-preview ${isPanelVisible ? '' : 'hidden'}`} 
           style={{ background: '#111', color: '#0f0' }}>
        <div className="typing-label">COMMAND:</div>
        <div className="typing-content" style={{ fontFamily: 'monospace' }}>
          {currentWord || <span className="empty-prompt">_</span>}
        </div>
        <div className="word-count">
          <span>WORDS:</span>
          <span>{textBuffer.length}</span>
        </div>
        {performance.combo > 0 && (
          <div className="combo-display" style={{ 
            color: '#00ff00',
            fontSize: '14px',
            marginTop: '10px'
          }}>
            <span>COMBO: {performance.combo}x</span>
          </div>
        )}
      </div>
      
      {/* Word count in bottom-right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        color: '#00ff00',
        fontSize: '16px',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #00ff00',
        zIndex: 100
      }}>
        Count: {textBuffer.length}
      </div>
      
      <div className="sidebar">
        {textBuffer.length > 0 && (
          <>
            <button className="button download-button" onClick={handleDownload}>
              <i className="fas fa-download"></i>
            </button>
            <button className="button copy-button" onClick={handleCopy}>
              <i className="fas fa-copy"></i>
            </button>
          </>
        )}
        {(words.length > 0 || currentWord || textBuffer.length > 0) && (
          <button className="button clear-button" onClick={clearAll}>
            <i className="fas fa-trash"></i>
          </button>
        )}
        <button className="button toggle-button" 
                onClick={() => setIsPanelVisible(prev => !prev)}>
          <i className={isPanelVisible ? "fas fa-eye-slash" : "fas fa-eye"}></i>
        </button>
      </div>
      
      <Canvas camera={{ position: [0, 0, 15] }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 10]} intensity={0.3} />
        
        <BreathingVoid pulseIntensity={backgroundPulse} />
        
        <gridHelper 
          args={[20, 20, '#003300', '#001100']} 
          rotation={[Math.PI / 2, 0, 0]} 
        />
        
        <CurrentTypingWord word={currentWord} />
        
        {typingParticles.map(particle => (
          <TypingParticleEffect
            key={particle.id}
            particle={particle}
          />
        ))}
        
        {words.map(word => (
          <WordInGrid
            key={word.id}
            word={word}
            onPositionUpdate={handleWordPositioned}
          />
        ))}
        
        {missiles.map(missile => (
          <MissileProjectile
            key={missile.id}
            missile={missile}
            words={words}
            onHit={(wordId) => {
              handleMissileHit(wordId);
              setMissiles(prev => prev.filter(m => m.id !== missile.id));
            }}
          />
        ))}
        
        {explosions.map(explosion => (
          <ExplosionEffect
            key={explosion.id}
            position={explosion.position}
            onComplete={() => {
              setExplosions(prev => prev.filter(e => e.id !== explosion.id));
            }}
          />
        ))}
        
        {scorePopups.map(popup => (
          <ScorePopupEffect
            key={popup.id}
            popup={popup}
            onComplete={() => {
              setScorePopups(prev => prev.filter(p => p.id !== popup.id));
            }}
          />
        ))}
      </Canvas>
    </div>
  );
}

export default SpaceInvadersApp;