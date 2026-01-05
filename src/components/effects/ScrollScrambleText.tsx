import { useState, useEffect, useRef } from 'react';

interface ScrollScrambleTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span';
  speed?: number;
  iterations?: number;
  threshold?: number; // How much of element must be visible (0-1)
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export function ScrollScrambleText({ 
  text, 
  className = '', 
  as: Component = 'h1',
  speed = 50,
  iterations = 8,
  threshold = 0.5
}: ScrollScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            scramble();
            setHasAnimated(true);
          }
        });
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasAnimated]);

  const scramble = () => {
    let currentIteration = 0;
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        return;
      }

      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '; // Preserve spaces
            
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

  return (
    <Component 
      ref={elementRef as any}
      className={className}
    >
      {displayText}
    </Component>
  );
}
