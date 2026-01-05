import { ReactNode, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, bullets, className = '' }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group
        bg-[#0B0E13] border border-[#222633]
        rounded-3xl p-8
        transition-all duration-300 ease-out
        ${isHovered ? 'border-[#F7FF5C]/30 -translate-y-1' : ''}
        ${className}
      `}
      style={{
        boxShadow: isHovered 
          ? '0 24px 60px rgba(0, 0, 0, 0.3), 0 0 60px rgba(247, 255, 92, 0.1)' 
          : '0 24px 60px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#F7FF5C]/5 to-[#4AF2FF]/5 pointer-events-none" />
      )}

      <div className="relative">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F7FF5C]/20 to-[#4AF2FF]/20 flex items-center justify-center mb-6 border border-[#F7FF5C]/20">
          <Icon className="w-7 h-7 text-[#F7FF5C]" />
        </div>

        {/* Title */}
        <h3 className="heading-h3 text-white mb-3">{title}</h3>

        {/* Description */}
        <p className="body-m text-[#A6A7B0] mb-6">{description}</p>

        {/* Bullets */}
        {bullets && bullets.length > 0 && (
          <div className="space-y-3">
            {bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4AF2FF] mt-2 flex-shrink-0" />
                <p className="body-m text-[#A6A7B0]">{bullet}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
