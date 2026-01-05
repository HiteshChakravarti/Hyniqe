import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface RollingTextProps {
  children: string | ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  blur?: boolean;
}

export function RollingText({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '',
  blur = true 
}: RollingTextProps) {
  const text = typeof children === 'string' ? children : '';
  
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  const letters = text.split('');

  return (
    <span className={`inline-block ${className}`}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ 
            y: 50, 
            opacity: 0,
            filter: blur ? 'blur(10px)' : 'blur(0px)'
          }}
          animate={{ 
            y: 0, 
            opacity: 1,
            filter: 'blur(0px)'
          }}
          transition={{
            duration: duration,
            delay: delay + (index * 0.03),
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{
            display: letter === ' ' ? 'inline' : 'inline-block',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

// Continuous rolling effect variant
export function RollingTextContinuous({ 
  children, 
  className = '' 
}: { children: string; className?: string }) {
  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: [20, 0, 0, -20],
        opacity: [0, 1, 1, 0]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.span>
  );
}
