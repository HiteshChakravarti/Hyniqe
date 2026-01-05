import { ReactNode } from 'react';

interface PillProps {
  children: ReactNode;
  variant?: 'default' | 'accent';
  className?: string;
}

export function Pill({ children, variant = 'default', className = '' }: PillProps) {
  const variantStyles = {
    default: "bg-[#10141E] border-[#222633] text-[#A6A7B0]",
    accent: "bg-gradient-to-r from-[#F7FF5C]/10 to-[#4AF2FF]/10 border-[#F7FF5C]/20 text-[#F7FF5C]"
  };

  return (
    <span className={`
      inline-flex items-center gap-2 px-3 py-1.5 
      rounded-full border
      label-s
      ${variantStyles[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
}
