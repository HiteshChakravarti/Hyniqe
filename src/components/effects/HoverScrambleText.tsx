import { useState, useEffect } from 'react';

interface HoverScrambleTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'button';
  speed?: number; // milliseconds per iteration
  iterations?: number; // how many times to scramble before resolving
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export function HoverScrambleText({ 
  text, 
  className = '', 
  as: Component = 'span',
  speed = 30, // Faster! Changed from 50 to 30
  iterations = 6 // Less iterations for snappier effect
}: HoverScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  const scramble = () => {
    if (isScrambling) return;
    
    setIsScrambling(true);
    let currentIteration = 0;
    let currentIndex = 0;

    const interval = setInterval(() => {
      // Add random glitch offset
      if (Math.random() > 0.7) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        });
      } else {
        setGlitchOffset({ x: 0, y: 0 });
      }

      if (currentIndex >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
        setGlitchOffset({ x: 0, y: 0 });
        return;
      }

      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            // Already revealed characters
            if (index < currentIndex) {
              return text[index];
            }
            // Currently revealing character
            if (index === currentIndex) {
              return currentIteration < iterations 
                ? chars[Math.floor(Math.random() * chars.length)]
                : text[index];
            }
            // Future characters - show random
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      currentIteration++;

      if (currentIteration >= iterations) {
        currentIteration = 0;
        currentIndex++;
      }
    }, speed);
  };

  const handleMouseEnter = () => {
    scramble();
  };

  return (
    <Component 
      className={`${className} ${isScrambling ? 'glitch-text' : ''}`}
      onMouseEnter={handleMouseEnter}
      data-text={displayText}
      style={{ 
        cursor: 'default', 
        display: 'inline-block',
        position: 'relative',
        transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)`,
        transition: 'transform 0.05s'
      }}
    >
      {displayText}
    </Component>
  );
}