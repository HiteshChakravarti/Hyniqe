import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';

interface SwipeLettersHeaderProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  direction?: 'top' | 'bottom';
  delay?: number;
  staggerDelay?: number;
  triggerOnce?: boolean;
  gradientText?: boolean;
}

export function SwipeLettersHeader({
  children,
  as: Component = 'h2',
  className = '',
  direction = 'bottom',
  delay = 0,
  staggerDelay = 0.03,
  triggerOnce = true,
  gradientText = false
}: SwipeLettersHeaderProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: triggerOnce, margin: "-100px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  // Split text into words and letters, preserving spaces
  const words = children.split(' ');
  let letterIndex = 0;

  return (
    <Component ref={ref} className={`${className} overflow-hidden`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em] last:mr-0">
          {word.split('').map((char) => {
            const currentIndex = letterIndex++;
            return (
              <span
                key={currentIndex}
                className="inline-block relative"
                style={{ 
                  height: '1.2em',
                  verticalAlign: 'top'
                }}
              >
                <motion.span
                  className={`inline-block ${gradientText ? 'text-gradient' : ''}`}
                  initial={{
                    y: direction === 'bottom' ? '100%' : '-100%',
                    opacity: 0
                  }}
                  animate={{
                    y: isInView ? 0 : (direction === 'bottom' ? '100%' : '-100%'),
                    opacity: isInView ? 1 : 0
                  }}
                  transition={{
                    duration: 0.5,
                    delay: delay + (currentIndex * staggerDelay),
                    ease: [0.33, 1, 0.68, 1]
                  }}
                >
                  {char}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </Component>
  );
}
