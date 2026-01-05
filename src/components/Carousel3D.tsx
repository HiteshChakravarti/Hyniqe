import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedNumber, AnimatedPercentage } from './AnimatedNumber';

interface CarouselItem {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  gradient: string;
  stats: { tasks: number; accuracy: string; status: string };
  image: string;
}

interface Carousel3DProps {
  items: CarouselItem[];
  onNavigate?: (itemId: string) => void;
}

// Color mapping for glow effects
const colorMap: { [key: string]: { rgb: string; hex: string; light: string } } = {
  purple: { rgb: '167, 139, 250', hex: '#a78bfa', light: '#c084fc' },
  orange: { rgb: '251, 146, 60', hex: '#fb923c', light: '#fdba74' },
  cyan: { rgb: '34, 211, 238', hex: '#22d3ee', light: '#67e8f9' },
  green: { rgb: '52, 211, 153', hex: '#34d399', light: '#6ee7b7' },
};

export function Carousel3D({ items, onNavigate }: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [items.length, isHovered]);

  const navigate = (newIndex: number) => {
    setActiveIndex(newIndex);
  };

  const getCardStyle = (index: number) => {
    const total = items.length;
    const diff = (index - activeIndex + total) % total;
    
    // Center card - Elevated and prominent
    if (diff === 0) {
      return {
        x: 0,
        y: -20, // Slightly elevated
        z: 100,
        scale: 1,
        opacity: 1,
        rotateY: 0,
        zIndex: 50,
      };
    }
    
    // Right position 1
    if (diff === 1) {
      return {
        x: '75%',
        y: 10,
        z: -100,
        scale: 0.85,
        opacity: 0.7,
        rotateY: -20,
        zIndex: 40,
      };
    }
    
    // Right position 2
    if (diff === 2) {
      return {
        x: '110%',
        y: 30,
        z: -200,
        scale: 0.7,
        opacity: 0.4,
        rotateY: -35,
        zIndex: 30,
      };
    }
    
    // Left position 1
    if (diff === total - 1) {
      return {
        x: '-75%',
        y: 10,
        z: -100,
        scale: 0.85,
        opacity: 0.7,
        rotateY: 20,
        zIndex: 40,
      };
    }
    
    // Left position 2
    if (diff === total - 2) {
      return {
        x: '-110%',
        y: 30,
        z: -200,
        scale: 0.7,
        opacity: 0.4,
        rotateY: 35,
        zIndex: 30,
      };
    }
    
    // Hidden cards
    return {
      x: diff < total / 2 ? '140%' : '-140%',
      y: 50,
      z: -300,
      scale: 0.5,
      opacity: 0,
      rotateY: diff < total / 2 ? -50 : 50,
      zIndex: 10,
    };
  };

  const activeItem = items[activeIndex];
  const activeColor = colorMap[activeItem.color] || colorMap.purple;

  return (
    <div className="relative w-full">
      {/* Floating carousel section - transparent background */}
      <div className="relative -mx-4 lg:-mx-0 py-16 lg:py-24 px-4 lg:px-8 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, rgba(${activeColor.rgb}, 0.08) 0%, transparent 70%)`,
          }}
        />

        {/* 3D Carousel Container */}
        <div 
          className="relative h-[750px] lg:h-[800px]"
          style={{ perspective: '2000px' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 3D Portrait Cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {items.map((item, index) => {
              const style = getCardStyle(index);
              const isActive = index === activeIndex;
              const itemColor = colorMap[item.color] || colorMap.purple;
              
              return (
                <motion.div
                  key={item.id}
                  initial={false}
                  animate={{
                    x: style.x,
                    y: style.y,
                    z: style.z,
                    scale: style.scale,
                    opacity: style.opacity,
                    rotateY: style.rotateY,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  style={{
                    position: 'absolute',
                    transformStyle: 'preserve-3d',
                    zIndex: style.zIndex,
                    cursor: !isActive ? 'pointer' : 'default',
                  }}
                  onClick={() => !isActive && navigate(index)}
                  className="w-[320px] lg:w-[400px]"
                >
                  {/* Portrait Card */}
                  <div 
                    className="relative bg-white rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                      boxShadow: isActive 
                        ? `0 30px 60px -12px rgba(${itemColor.rgb}, 0.4), 0 0 40px rgba(${itemColor.rgb}, 0.3)`
                        : '0 20px 40px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Colored Glow Border for Active Card */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -inset-[2px] rounded-3xl z-0"
                        style={{
                          background: `linear-gradient(135deg, ${itemColor.hex}, ${itemColor.light})`,
                          filter: 'blur(8px)',
                        }}
                      />
                    )}

                    {/* Card Content */}
                    <div className="relative bg-white rounded-3xl overflow-hidden">
                      {/* Photo Section - 70% */}
                      <div className="relative h-[420px] lg:h-[520px] bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                        {/* Photo with subtle vignette */}
                        <div className="absolute inset-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain drop-shadow-2xl"
                          />
                          {/* Subtle vignette overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                        </div>

                        {/* Floating Status Badge */}
                        <motion.div
                          animate={isActive ? { y: [0, -5, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute top-4 right-4 backdrop-blur-xl bg-white/10 border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl"
                        >
                          <div 
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: itemColor.hex }}
                          />
                          <span className="text-xs text-white font-medium font-tech">{item.stats.status.toUpperCase()}</span>
                        </motion.div>

                        {/* Colored accent line at bottom of photo */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{
                            background: `linear-gradient(90deg, ${itemColor.hex}, ${itemColor.light})`,
                          }}
                        />
                      </div>

                      {/* Info Section - 30% White Background */}
                      <div className="relative bg-white p-6 lg:p-8">
                        {/* Subtle top border glow */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${itemColor.hex}, transparent)`,
                          }}
                        />

                        <div className="text-center">
                          {/* Name with gradient */}
                          <h3 
                            className="text-2xl lg:text-3xl mb-2 font-tech tracking-tight"
                            style={{
                              background: `linear-gradient(135deg, ${itemColor.hex}, ${itemColor.light})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >
                            {item.name}
                          </h3>
                          <div className="text-base lg:text-lg text-gray-600 font-medium">{item.role}</div>
                          
                          {/* Small color indicator dot */}
                          <div className="flex justify-center mt-3">
                            <div 
                              className="w-8 h-1 rounded-full"
                              style={{ backgroundColor: itemColor.hex }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stats & Description - Only for Active Card */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mt-6"
                      >
                        {/* Description */}
                        <div className="glass-card bg-white/90 backdrop-blur-xl p-6 mb-4 border border-white/50 shadow-xl">
                          <p className="text-gray-700 text-center leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <motion.div 
                            className="glass-card bg-white/90 backdrop-blur-xl p-5 text-center border border-white/50 shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div 
                              className="text-3xl font-bold mb-1 font-tech"
                              style={{ color: itemColor.hex }}
                            >
                              <AnimatedNumber value={item.stats.tasks} />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Tasks Today</div>
                          </motion.div>
                          
                          <motion.div 
                            className="glass-card bg-white/90 backdrop-blur-xl p-5 text-center border border-white/50 shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div 
                              className="text-3xl font-bold mb-1 font-tech"
                              style={{ color: itemColor.hex }}
                            >
                              <AnimatedPercentage value={parseFloat(item.stats.accuracy)} />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Accuracy</div>
                          </motion.div>
                        </div>

                        {/* CTA Button */}
                        <motion.button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigate) {
                              onNavigate('auth');
                            }
                          }}
                          className="w-full px-6 py-4 text-white rounded-full flex items-center justify-center gap-2 shadow-xl font-tech text-lg relative overflow-hidden group pointer-events-auto cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${itemColor.hex}, ${itemColor.light})`,
                            zIndex: 1000,
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              style={{
                                transform: 'translateX(-100%)',
                                animation: 'shine 2s infinite',
                              }}
                            />
                          </div>
                          
                          <MessageCircle className="w-5 h-5 relative z-10" />
                          <span className="relative z-10">Chat with {item.name}</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => navigate((activeIndex - 1 + items.length) % items.length)}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 backdrop-blur-xl bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white transition-all z-[100] shadow-xl"
            style={{
              boxShadow: `0 8px 32px rgba(${activeColor.rgb}, 0.3)`,
            }}
          >
            <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-gray-700" />
          </button>
          <button
            onClick={() => navigate((activeIndex + 1) % items.length)}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 backdrop-blur-xl bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white transition-all z-[100] shadow-xl"
            style={{
              boxShadow: `0 8px 32px rgba(${activeColor.rgb}, 0.3)`,
            }}
          >
            <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-gray-700" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {items.map((item, index) => {
            const itemColor = colorMap[item.color] || colorMap.purple;
            return (
              <button
                key={item.id}
                onClick={() => navigate(index)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: index === activeIndex ? '32px' : '8px',
                  height: '8px',
                  backgroundColor: index === activeIndex ? itemColor.hex : '#3f3f46',
                  boxShadow: index === activeIndex ? `0 0 16px rgba(${itemColor.rgb}, 0.6)` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}