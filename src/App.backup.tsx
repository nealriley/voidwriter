/**
 * React Three Fiber Text Effect Demo
 * 
 * An interactive 3D text visualization application that allows users to type text
 * and see it appear as floating, fading 3D elements in space.
 * 
 * Key features:
 * - Real-time 3D text rendering with Three.js
 * - Interactive typing with word tracking
 * - Animations and fade effects
 * - Word counting and text management
 * - Adjustable fade speed
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';  // React Three Fiber for 3D rendering
import { Text } from '@react-three/drei';               // Helper components for 3D text
import { useSpring, animated } from '@react-spring/three'; // For animations
import * as THREE from 'three';                         // Three.js core library
import './App.css';                                     // Component styles

/**
 * FadingLetter Component
 * 
 * Renders a single 3D letter with opacity based on how recent the word is.
 * Only shows the current word and 2 previous words.
 * 
 * @param letter - The character to display
 * @param position - 3D coordinates [x, y, z] for placement
 * @param onFadeComplete - Callback function when fade animation completes
 * @param isFadingOut - Whether the letter is in fade-out mode
 * @param fontSize - Size of the text (default: 0.7)
 * @param fadeSpeedFactor - Multiplier to control fade speed (default: 1)
 * @param createdAt - Timestamp when letter was created
 * @param wordIndex - Index of the word this letter belongs to
 * @param currentWordCount - Total number of words typed so far
 */
function FadingLetter({ 
  letter, 
  position, 
  onFadeComplete, 
  isFadingOut = false,
  fontSize = 0.7,
  fadeSpeedFactor = 1,
  createdAt = Date.now(),
  wordIndex = 0,
  currentWordCount = 0
}: { 
  letter: string; 
  position: [number, number, number]; 
  onFadeComplete: () => void; 
  isFadingOut?: boolean;
  fontSize?: number;
  fadeSpeedFactor?: number;
  createdAt?: number;
  wordIndex?: number;
  currentWordCount?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [shouldRemove, setShouldRemove] = useState(false);
  
  // Calculate opacity based on word position - only show last 3 words
  const calculateOpacity = useCallback((currentWordCount: number) => {
    // How many words ago was this word typed?
    const wordsAgo = currentWordCount - wordIndex - 1;
    
    if (isFadingOut) {
      // When marked for fading, quickly fade out
      return 0;
    }
    
    // Only show the current word and 2 previous words
    if (wordsAgo === 0) return 1.0;      // Current word: 100% opacity
    if (wordsAgo === 1) return 0.5;      // Previous word: 50% opacity
    if (wordsAgo === 2) return 0.2;      // Two words ago: 20% opacity
    return 0;                             // Older words: invisible
  }, [wordIndex, isFadingOut]);
  
  // Calculate scale based on word index - newer words are larger
  const calculateScale = useCallback(() => {
    // Subtle scale reduction for older words
    const scaleReduction = Math.max(0.5, 1 - wordIndex * 0.03);
    return fontSize * scaleReduction;
  }, [wordIndex, fontSize]);
  
  // Simple, predictable color - monochromatic for focus
  const color = useMemo(() => {
    // Pure white to light gray gradient based on age
    const age = (Date.now() - createdAt) / 1000;
    const brightness = Math.max(150, 255 - age * 2);
    return `rgb(${brightness},${brightness},${brightness})`;
  }, [createdAt]);
  
  // Update opacity and check for removal
  useFrame(() => {
    if (meshRef.current) {
      const opacity = calculateOpacity(currentWordCount);
      
      // Update material opacity
      if (meshRef.current.material) {
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * fadeSpeedFactor;
      }
      
      // Remove when completely faded (older than 3 words)
      if (opacity <= 0 && !shouldRemove) {
        setShouldRemove(true);
        onFadeComplete();
      }
      
      // Very subtle breathing animation - no chaotic movement
      const breathingOffset = Math.sin(Date.now() * 0.001) * 0.001;
      meshRef.current.position.y = position[1] + breathingOffset;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <Text
        fontSize={calculateScale()}
        color={color}
        anchorX="center"
        anchorY="middle"
        material-transparent={true}
        material-opacity={calculateOpacity(currentWordCount)}
      >
        {letter}
      </Text>
    </mesh>
  );
}


/**
 * Main App Component
 * 
 * This is the primary component that manages the application state 
 * and orchestrates the 3D text effects.
 */
function App() {
  // Current word being typed before it's displayed
  const [currentWord, setCurrentWord] = useState('');
  
  // Collection of all letters currently displayed in the 3D scene
  const [displayedLetters, setDisplayedLetters] = useState<{ 
    id: number;               // Unique identifier for each letter
    text: string;             // The letter character
    position: [number, number, number]; // 3D position coordinates
    isFadingOut?: boolean;    // Whether letter is in fade-out state
    fontSize?: number;        // Size of this specific letter
    wordIndex?: number;       // Which word this letter belongs to (for flow positioning)
    createdAt?: number;       // Timestamp when letter was created (for age-based effects)
  }[]>([]);
  
  // Counter for generating unique IDs for letters
  const [nextId, setNextId] = useState(1);
  
  // Track the total number of words created (for river flow positioning)
  const [wordCount, setWordCount] = useState(0);
  
  // Storage for completed words
  const [textBuffer, setTextBuffer] = useState<string[]>([]);
  
  // Track if there's any text in the buffer
  const [hasText, setHasText] = useState(false);
  
  // Controls visibility of the typing panel
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  
  // Controls how quickly letters fade out (user adjustable)
  const [fadeSpeedFactor, setFadeSpeedFactor] = useState(1); // Default speed factor
  
  /**
   * Finalize the current word and add it to the text buffer
   * Called when a word is completed (space/enter pressed)
   */
  const startNewWord = useCallback(() => {
    if (currentWord.trim()) {
      // Add word to text buffer for history/download/copy
      setTextBuffer(prev => [...prev, currentWord]);
      setHasText(true);
      
      // Reset current word to start fresh
      setCurrentWord('');
    }
  }, [currentWord]);

  /**
   * Calculate 3D positions for typewriter-style word placement
   * Words appear left to right, only showing current + 2 previous
   * 
   * @param word - The word to position in 3D space
   * @param wordIndex - The index of this word in the session
   * @returns Array of letter objects with position and font size
   */
  const updateLetterPositions = useCallback((word: string, wordIndex: number) => {
    const wordLength = word.length;
    const currentTime = Date.now();
    
    // Base font size - current word larger, older words smaller
    const baseFontSize = 0.8;
    
    // Calculate total width of the word with proper spacing
    const letterWidth = 0.4;  // Horizontal space for each letter
    const letterSpacing = 0.05; // Gap between letters (typewriter look)
    const wordSpacing = 0.8; // Space between words
    const totalWordWidth = wordLength * (letterWidth + letterSpacing);
    
    // Typewriter positioning - left to right, single line
    // Only position the last 3 words in view
    const wordsPerLine = 8; // After this many words, loop back
    const positionInLine = wordIndex % wordsPerLine;
    
    // Calculate X position for the word
    // Start from left side of screen
    const lineStartX = -4; // Start position on left
    const wordX = lineStartX + (positionInLine * (2.5 + wordSpacing));
    
    // Y position stays constant (single line)
    const wordY = 0;
    
    // Z position - current word forward, older words slightly back
    // We'll handle relative positioning in the display logic
    const wordZ = 0; // Keep all words on same Z plane for now
    
    // Calculate start position for letters in the word
    const startX = wordX - totalWordWidth / 2 + letterWidth / 2;
    
    // Map each letter to an object with position and styling
    return Array.from(word).map((letter, index) => {
      return {
        text: letter,
        position: [
          startX + index * (letterWidth + letterSpacing),
          wordY,
          wordZ
        ] as [number, number, number],
        fontSize: baseFontSize,
        wordIndex: wordIndex,
        createdAt: currentTime
      };
    });
  }, []);
  
  /**
   * Handle keyboard input for typing and word completion
   * Manages different key types: letters, backspace, space/enter, punctuation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle letter keys (a-z, A-Z)
    if (/^[a-zA-Z]$/.test(event.key)) {
      // Add letter to current word (only shown in preview panel for now)
      const newLetter = event.key;
      const newWord = currentWord + newLetter;
      setCurrentWord(newWord);
      
    // Handle backspace for editing the current word
    } else if (event.key === 'Backspace') {
      // Remove last character from current word if it's not empty
      if (currentWord.length > 0) {
        const newWord = currentWord.slice(0, -1);
        setCurrentWord(newWord);
      }
      
    // Handle space or enter to complete a word
    } else if (event.key === ' ' || event.key === 'Enter') {
      // Only process if there's actual text (not just whitespace)
      if (currentWord.trim()) {
        // Calculate 3D positions for all letters in the word using River Flow
        const newLetterPositions = updateLetterPositions(currentWord, wordCount);
        
        // Update displayed letters with new positions
        setDisplayedLetters(prev => {
          // Mark all previous active letters to start fading out
          const updatedPrev = prev.map(letter => 
            letter.isFadingOut ? letter : { ...letter, isFadingOut: true }
          );
          
          // Add new word letters with fresh IDs and positions
          return [
            ...updatedPrev,
            ...newLetterPositions.map((letterInfo, index) => ({
              id: nextId + index,
              text: letterInfo.text,
              position: letterInfo.position,
              fontSize: letterInfo.fontSize,
              wordIndex: letterInfo.wordIndex,
              createdAt: letterInfo.createdAt,
              isFadingOut: false  // New letters are fully visible
            }))
          ];
        });
        
        // Update counters
        setNextId(prev => prev + currentWord.length);
        setWordCount(prev => prev + 1);
        
        // Finalize the word (add to buffer, reset current word)
        startNewWord();
      }
    // Handle punctuation keys to complete a word with punctuation
    } else if (/[.,!?;:]/.test(event.key)) {
      // Only process if there's a current word
      if (currentWord) {
        // Add punctuation to current word
        const newWord = currentWord + event.key;
        setCurrentWord(newWord);
        
        // Calculate positions including the punctuation mark using River Flow
        const newLetterPositions = updateLetterPositions(newWord, wordCount);
        
        // Update displayed letters with new positions
        setDisplayedLetters(prev => {
          // Mark all previous active letters to start fading out
          const updatedPrev = prev.map(letter => 
            letter.isFadingOut ? letter : { ...letter, isFadingOut: true }
          );
          
          // Add new word letters with the punctuation
          return [
            ...updatedPrev,
            ...newLetterPositions.map((letterInfo, index) => ({
              id: nextId + index,
              text: letterInfo.text,
              position: letterInfo.position,
              fontSize: letterInfo.fontSize,
              wordIndex: letterInfo.wordIndex,
              createdAt: letterInfo.createdAt,
              isFadingOut: false
            }))
          ];
        });
        
        // Update counters
        setNextId(prev => prev + newWord.length);
        setWordCount(prev => prev + 1);
        
        // Small delay before finalizing the word (feels more natural)
        setTimeout(() => {
          startNewWord();
        }, 200);
      }
    }
  }, [currentWord, nextId, wordCount, startNewWord, updateLetterPositions]);

  /**
   * Remove a letter from the display when its fade animation completes
   * @param id - The unique ID of the letter to remove
   */
  const handleFadeComplete = useCallback((id: number) => {
    setDisplayedLetters(prev => prev.filter(letter => letter.id !== id));
  }, []);

  /**
   * Get the full text content as a space-separated string
   * Used for download and clipboard functionality
   */
  const getTextContent = useCallback(() => {
    return textBuffer.join(' ');
  }, [textBuffer]);
  
  /**
   * Count the total number of words in the buffer + current word
   * Handles punctuation appropriately
   */
  const getWordCount = useCallback(() => {
    // Count words in buffer, filtering out punctuation-only entries
    const bufferWordCount = textBuffer.reduce((count, word) => {
      // Remove punctuation, check if there's actual text
      const cleanWord = word.replace(/[.,!?;:]/g, '').trim();
      return cleanWord ? count + 1 : count;
    }, 0);
    
    // Add current word to count if it's not empty
    const currentWordCount = currentWord.trim() ? 1 : 0;
    
    return bufferWordCount + currentWordCount;
  }, [textBuffer, currentWord]);
  
  /**
   * Clear just the text buffer (history)
   * Called after download or copy operations
   */
  const clearTextBuffer = useCallback(() => {
    setTextBuffer([]);
    setHasText(false);
  }, []);
  
  /**
   * Clear all text content completely (buffer + current + display)
   * This gives the user a fresh start
   */
  const clearAllText = useCallback(() => {
    // Clear the text buffer (stored history)
    setTextBuffer([]);
    setHasText(false);
    
    // Clear the word currently being typed
    setCurrentWord('');
    
    // Remove all letters from the 3D display
    setDisplayedLetters([]);
    
    // Reset word count
    setWordCount(0);
  }, []);
  
  /**
   * Download the typed text as a text file
   * Formats text and generates a timestamped filename
   */
  const handleDownload = useCallback(() => {
    if (textBuffer.length === 0) return;
    
    // Get formatted text content
    const content = getTextContent();
    
    // Create a blob for the file
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Set up the download mechanism
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Create filename with current date (YYYY-MM-DD)
    link.download = `typed-text-${new Date().toISOString().slice(0, 10)}.txt`;
    
    // Trigger browser download UI
    document.body.appendChild(link);
    link.click();
    
    // Clean up resources
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Reset after download
    clearTextBuffer();
  }, [textBuffer, getTextContent, clearTextBuffer]);
  
  /**
   * Copy the typed text to clipboard
   */
  const handleCopy = useCallback(() => {
    if (textBuffer.length === 0) return;
    
    // Use the Clipboard API to copy text
    navigator.clipboard.writeText(getTextContent())
      .then(() => {
        // Reset after successful copy
        clearTextBuffer();
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }, [textBuffer, getTextContent, clearTextBuffer]);

  /**
   * Set up keyboard event listener for typing
   */
  useEffect(() => {
    // Add global keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**
   * Toggle visibility of the typing preview panel
   */
  const togglePanel = useCallback(() => {
    setIsPanelVisible(prev => !prev);
  }, []);

  return (
    <div className="app">
      {/* Typing preview panel - shows current word and controls */}
      <div className={`typing-preview ${isPanelVisible ? '' : 'hidden'}`}>
        {/* Current word display */}
        <div className="typing-label">Currently typing:</div>
        <div className="typing-content">
          {currentWord || <span className="empty-prompt"></span>}
        </div>
        
        {/* Word count display */}
        <div className="word-count">
          <span>Word Count:</span>
          <span>{getWordCount()}</span>
        </div>
        
        {/* Fade speed adjustment slider */}
        <div className="fade-speed-control">
          <div className="fade-speed-label">
            <span>Fade Speed</span>
            <span>{fadeSpeedFactor.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            value={fadeSpeedFactor} 
            onChange={(e) => setFadeSpeedFactor(parseFloat(e.target.value))} 
            className="fade-speed-slider" 
          />
        </div>
      </div>
      
      {/* Sidebar with action buttons */}
      <div className="sidebar">
        {/* Text management buttons - only shown when there's text */}
        {hasText && (
          <>
            <button className="button download-button button-tooltip" onClick={handleDownload} data-tooltip="Download Text">
              <i className="fas fa-download"></i>
            </button>
            <button className="button copy-button button-tooltip" onClick={handleCopy} data-tooltip="Copy to Clipboard">
              <i className="fas fa-copy"></i>
            </button>
          </>
        )}
        
        {/* Clear button - shown when there's any content */}
        {(hasText || displayedLetters.length > 0 || currentWord) && (
          <button className="button clear-button button-tooltip" onClick={clearAllText} data-tooltip="Clear All Text">
            <i className="fas fa-trash"></i>
          </button>
        )}
        
        {/* Panel visibility toggle button - always shown */}
        <button 
          className="button toggle-button button-tooltip" 
          onClick={togglePanel}
          data-tooltip={isPanelVisible ? "Hide Panel" : "Show Panel"}
        >
          <i className={isPanelVisible ? "fas fa-eye-slash" : "fas fa-eye"}></i>
        </button>
      </div>
      
      {/* 3D canvas for text visualization */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        {/* Scene lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Render all active letters in 3D space */}
        {displayedLetters.map(letter => (
          <FadingLetter
            key={letter.id}
            letter={letter.text}
            position={letter.position}
            fontSize={letter.fontSize}
            isFadingOut={!!letter.isFadingOut}
            fadeSpeedFactor={fadeSpeedFactor}
            createdAt={letter.createdAt}
            wordIndex={letter.wordIndex}
            currentWordCount={wordCount}
            onFadeComplete={() => handleFadeComplete(letter.id)}
          />
        ))}
      </Canvas>
    </div>
  );
}

export default App;