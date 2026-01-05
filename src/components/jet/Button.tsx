import { ReactNode, useState } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  rolling?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  rolling = false, 
  onClick, 
  className = '',
  disabled = false
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = "px-6 py-3 rounded-lg transition-all duration-200 relative overflow-hidden group";
  
  const variantStyles = {
    primary: "bg-[#F7FF5C] text-[#050509] hover:bg-[#FFFF8F] shadow-lg shadow-[#F7FF5C]/20 hover:shadow-[#F7FF5C]/40",
    secondary: "bg-[#4AF2FF] text-[#050509] hover:bg-[#6FF5FF] shadow-lg shadow-[#4AF2FF]/20 hover:shadow-[#4AF2FF]/40",
    ghost: "border border-[#222633] text-white hover:border-[#F7FF5C] hover:bg-[#F7FF5C]/5"
  };

  if (rolling) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="relative block overflow-hidden h-6">
          <span 
            className={`block transition-transform duration-200 ease-out ${
              isHovered ? '-translate-y-6' : 'translate-y-0'
            }`}
          >
            <span className="block h-6 flex items-center justify-center font-medium">
              {children}
            </span>
            <span className="block h-6 flex items-center justify-center font-medium">
              {children}
            </span>
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} font-medium`}
    >
      {children}
    </button>
  );
}
