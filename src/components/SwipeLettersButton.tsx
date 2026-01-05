import { useState } from 'react';
import { motion } from 'motion/react';

interface SwipeLettersButtonProps {
  children: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  direction?: 'top' | 'bottom';
}

export function SwipeLettersButton({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  className = '',
  icon,
  direction = 'bottom'
}: SwipeLettersButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Split text into letters, preserving spaces
  const letters = children.split('').map((char, index) => ({
    char,
    index,
    isSpace: char === ' '
  }));

  // Variant styles
  const variantStyles = {
    primary: 'glass-card bg-gradient-to-r from-accent-primary/90 to-accent-tertiary/90 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white border border-white/20 shadow-xl hover:shadow-2xl',
    secondary: 'glass-card bg-white/80 backdrop-blur-xl hover:bg-white border border-white/50 text-text-primary shadow-lg hover:shadow-xl',
    outline: 'glass-card bg-transparent backdrop-blur-xl hover:bg-white/10 border-2 border-accent-primary text-accent-primary shadow-md hover:shadow-lg'
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-6 py-2.5 text-sm',
    md: 'px-8 py-3.5 text-base',
    lg: 'px-10 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-full
        transition-all
        duration-300
        hover:scale-105
        flex
        items-center
        gap-3
        overflow-hidden
        relative
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <span className="relative z-10">
          {icon}
        </span>
      )}

      {/* Animated Letters */}
      <span className="relative inline-flex overflow-hidden" style={{ height: '1.2em' }}>
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
                    duration: 0.3,
                    delay: index * 0.03,
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
                    duration: 0.3,
                    delay: index * 0.03,
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
    </button>
  );
}
