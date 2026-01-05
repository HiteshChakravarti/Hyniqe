import { useState } from 'react';
import { motion } from 'motion/react';

interface SwipeLettersNavProps {
  text: string;
  direction?: 'top' | 'bottom';
}

export function SwipeLettersNav({
  text,
  direction = 'bottom'
}: SwipeLettersNavProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Split text into letters, preserving spaces
  const letters = text.split('').map((char, index) => ({
    char,
    index,
    isSpace: char === ' '
  }));

  return (
    <span 
      className="relative inline-flex overflow-hidden"
      style={{ height: '1.2em' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="relative inline-block"
          style={{
            width: letter.isSpace ? '0.25em' : 'auto',
            minWidth: letter.isSpace ? '0.25em' : undefined
          }}
        >
          {!letter.isSpace && (
            <>
              {/* Original letter - slides out */}
              <motion.span
                className="inline-block"
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: isHovered ? (direction === 'bottom' ? '-100%' : '100%') : 0,
                  opacity: isHovered ? 0 : 1
                }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.02,
                  ease: [0.33, 1, 0.68, 1]
                }}
              >
                {letter.char}
              </motion.span>

              {/* Duplicate letter - slides in */}
              <motion.span
                className="inline-block absolute left-0"
                initial={{
                  y: direction === 'bottom' ? '100%' : '-100%',
                  opacity: 0
                }}
                animate={{
                  y: isHovered ? 0 : (direction === 'bottom' ? '100%' : '-100%'),
                  opacity: isHovered ? 1 : 0
                }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.02,
                  ease: [0.33, 1, 0.68, 1]
                }}
              >
                {letter.char}
              </motion.span>
            </>
          )}
        </span>
      ))}
    </span>
  );
}
