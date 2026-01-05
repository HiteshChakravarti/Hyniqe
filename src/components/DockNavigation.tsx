import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import eshaImage from 'figma:asset/b434b05361034eca13601b9d522dffa1cc5229d9.png';
import karoImage from 'figma:asset/d45ed71bf1590295ce00ae8d744117adb1ec7479.png';
import niviImage from 'figma:asset/0ad1d2f5ccad00c11a5650031ed9406df751a055.png';
import orinImage from 'figma:asset/48fba9f6f9bd14e6878f277860141b89e0a39432.png';
import turboImage from 'figma:asset/4b33d5b78096e6f6fd5a8e3c58afc35665ef97b0.png';

const aiHelpers = [
  {
    id: 'esha',
    name: 'Esha',
    role: 'AI Recruiter',
    color: '#a78bfa',
    image: eshaImage,
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success',
    color: '#fb923c',
    image: karoImage,
  },
  {
    id: 'nivi',
    name: 'Nivi',
    role: 'Social Media',
    color: '#22d3ee',
    image: niviImage,
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    color: '#34d399',
    image: orinImage,
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    color: '#ef4444',
    image: turboImage,
  },
];

interface DockItemProps {
  helper: typeof aiHelpers[0];
  mouseX: any;
  onClick: (id: string) => void;
}

function DockItem({ helper, mouseX, onClick }: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [80, 120, 80]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width }}
      onClick={() => onClick(helper.id)}
      className="relative aspect-square cursor-pointer group"
      whileHover={{ y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {/* Outer glow container - separate glassy card */}
      <div className="relative w-full h-full">
        {/* Conic Gradient Border */}
        <div className="absolute inset-0 rounded-[24px] p-[3px]" style={{
          background: `conic-gradient(from 0deg, transparent 0deg 300deg, ${helper.color} 360deg)`,
        }}>
          {/* Inner glass card */}
          <div className="relative w-full h-full rounded-[22px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 overflow-hidden shadow-2xl">
            <ImageWithFallback
              src={helper.image}
              alt={helper.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Enhanced outer glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-70 transition-opacity blur-2xl -z-10"
          style={{ backgroundColor: helper.color }}
        />
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: -10 }}
        className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur-md border border-border-soft rounded-xl whitespace-nowrap pointer-events-none shadow-xl z-50"
      >
        <p className="text-sm font-semibold text-text-primary">{helper.name}</p>
        <p className="text-xs text-text-tertiary">{helper.role}</p>
      </motion.div>
    </motion.button>
  );
}

interface DockNavigationProps {
  onNavigate?: (helperId: string) => void;
}

export function DockNavigation({ onNavigate }: DockNavigationProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="flex justify-center py-8">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-4 px-6"
      >
        {aiHelpers.map((helper) => (
          <DockItem
            key={helper.id}
            helper={helper}
            mouseX={mouseX}
            onClick={(id) => onNavigate?.(id)}
          />
        ))}
      </motion.div>
    </div>
  );
}