interface StepCardProps {
  stepNumber: string;
  stepLabel: string;
  title: string;
  description: string;
  isActive?: boolean;
}

export function StepCard({ stepNumber, stepLabel, title, description, isActive = false }: StepCardProps) {
  return (
    <div className={`
      bg-[#0B0E13] border rounded-3xl p-8
      transition-all duration-300
      ${isActive ? 'border-[#F7FF5C] shadow-lg shadow-[#F7FF5C]/20' : 'border-[#222633]'}
    `}>
      {/* Step number */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center
          label-s
          ${isActive 
            ? 'bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF] text-[#050509]' 
            : 'bg-[#10141E] border border-[#222633] text-[#A6A7B0]'
          }
        `}>
          {stepNumber}
        </div>
        <span className="label-s text-[#A6A7B0]">{stepLabel}</span>
      </div>

      {/* Title */}
      <h3 className="heading-h3 text-white mb-3">{title}</h3>

      {/* Description */}
      <p className="body-m text-[#A6A7B0]">{description}</p>
    </div>
  );
}
