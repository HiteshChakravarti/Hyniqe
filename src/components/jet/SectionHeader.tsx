import { ReactNode } from 'react';

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({ 
  overline, 
  title, 
  description, 
  centered = false,
  className = '' 
}: SectionHeaderProps) {
  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`}>
      {overline && (
        <p className="label-s text-[#4AF2FF] mb-4">{overline}</p>
      )}
      <h2 className="heading-h2 text-white mb-4">{title}</h2>
      {description && (
        <p className={`body-l text-[#A6A7B0] max-w-2xl ${centered ? 'mx-auto' : ''}`}>{description}</p>
      )}
    </div>
  );
}