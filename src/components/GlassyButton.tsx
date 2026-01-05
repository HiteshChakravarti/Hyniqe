import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassyButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: 'purple' | 'orange' | 'cyan' | 'green' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const colorStyles = {
  purple: {
    primary: 'bg-[#a78bfa]/20 border-[#a78bfa]/30 hover:bg-[#a78bfa]/30 hover:border-[#a78bfa]/50 text-[#e9d5ff]',
    secondary: 'border-[#a78bfa]/30 hover:border-[#a78bfa]/50 text-[#e9d5ff] hover:bg-[#a78bfa]/10',
    ghost: 'hover:bg-[#a78bfa]/10 text-[#e9d5ff]',
  },
  orange: {
    primary: 'bg-[#fb923c]/20 border-[#fb923c]/30 hover:bg-[#fb923c]/30 hover:border-[#fb923c]/50 text-[#fed7aa]',
    secondary: 'border-[#fb923c]/30 hover:border-[#fb923c]/50 text-[#fed7aa] hover:bg-[#fb923c]/10',
    ghost: 'hover:bg-[#fb923c]/10 text-[#fed7aa]',
  },
  cyan: {
    primary: 'bg-[#22d3ee]/20 border-[#22d3ee]/30 hover:bg-[#22d3ee]/30 hover:border-[#22d3ee]/50 text-[#cffafe]',
    secondary: 'border-[#22d3ee]/30 hover:border-[#22d3ee]/50 text-[#cffafe] hover:bg-[#22d3ee]/10',
    ghost: 'hover:bg-[#22d3ee]/10 text-[#cffafe]',
  },
  green: {
    primary: 'bg-[#34d399]/20 border-[#34d399]/30 hover:bg-[#34d399]/30 hover:border-[#34d399]/50 text-[#d1fae5]',
    secondary: 'border-[#34d399]/30 hover:border-[#34d399]/50 text-[#d1fae5] hover:bg-[#34d399]/10',
    ghost: 'hover:bg-[#34d399]/10 text-[#d1fae5]',
  },
  red: {
    primary: 'bg-[#ef4444]/20 border-[#ef4444]/30 hover:bg-[#ef4444]/30 hover:border-[#ef4444]/50 text-[#fecaca]',
    secondary: 'border-[#ef4444]/30 hover:border-[#ef4444]/50 text-[#fecaca] hover:bg-[#ef4444]/10',
    ghost: 'hover:bg-[#ef4444]/10 text-[#fecaca]',
  },
  blue: {
    primary: 'bg-[#60a5fa]/20 border-[#60a5fa]/30 hover:bg-[#60a5fa]/30 hover:border-[#60a5fa]/50 text-[#dbeafe]',
    secondary: 'border-[#60a5fa]/30 hover:border-[#60a5fa]/50 text-[#dbeafe] hover:bg-[#60a5fa]/10',
    ghost: 'hover:bg-[#60a5fa]/10 text-[#dbeafe]',
  },
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-lg',
};

export function GlassyButton({
  children,
  variant = 'primary',
  color = 'purple',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  className = '',
  disabled = false,
}: GlassyButtonProps) {
  const baseStyles = 'relative rounded-full font-medium transition-all duration-300 backdrop-blur-xl border';
  
  const variantStyles = variant === 'ghost' 
    ? colorStyles[color].ghost 
    : variant === 'secondary' 
    ? colorStyles[color].secondary 
    : colorStyles[color].primary;

  const borderStyle = variant === 'ghost' ? 'border-transparent' : '';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles}
        ${borderStyle}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
      </span>
    </motion.button>
  );
}
