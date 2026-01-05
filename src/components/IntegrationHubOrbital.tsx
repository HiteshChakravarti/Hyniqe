import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Linkedin,
  Calendar,
  Facebook,
  Instagram,
  FileText,
  Database,
  Chrome,
  Slack,
  BarChart,
  Calculator,
  Github,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  helperColor: string;
  description: string;
  position: { x: number; y: number }; // Direct percentage position
}

export function IntegrationHubOrbital() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 12 integrations positioned along spiral paths - more spread out
  const integrations: Integration[] = [
    // Spiral 1 - Top right quadrant
    { 
      id: 'github', 
      name: 'GitHub', 
      icon: <Github className="w-6 h-6" />, 
      color: '#181717', 
      helperColor: '#a78bfa',
      description: 'Code repository',
      position: { x: 70, y: 15 }
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: <BarChart className="w-6 h-6" />, 
      color: '#E37400', 
      helperColor: '#fb923c',
      description: 'Data insights',
      position: { x: 65, y: 25 }
    },
    { 
      id: 'gmail', 
      name: 'Gmail', 
      icon: <Mail className="w-6 h-6" />, 
      color: '#EA4335', 
      helperColor: '#ef4444',
      description: 'Email automation',
      position: { x: 68, y: 38 }
    },
    
    // Spiral 2 - Right side
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <Instagram className="w-6 h-6" />, 
      color: '#E4405F', 
      helperColor: '#ec4899',
      description: 'Visual content',
      position: { x: 85, y: 60 }
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <Linkedin className="w-6 h-6" />, 
      color: '#0A66C2', 
      helperColor: '#3b82f6',
      description: 'Professional network',
      position: { x: 70, y: 65 }
    },
    
    // Spiral 3 - Bottom right
    { 
      id: 'calendar', 
      name: 'Calendar', 
      icon: <Calendar className="w-6 h-6" />, 
      color: '#4285F4', 
      helperColor: '#3b82f6',
      description: 'Schedule management',
      position: { x: 58, y: 68 }
    },
    
    // Spiral 4 - Bottom left
    { 
      id: 'microsoft', 
      name: 'Microsoft', 
      icon: <Chrome className="w-6 h-6" />, 
      color: '#00A4EF', 
      helperColor: '#22d3ee',
      description: 'Office suite',
      position: { x: 38, y: 75 }
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <Facebook className="w-6 h-6" />, 
      color: '#1877F2', 
      helperColor: '#3b82f6',
      description: 'Social engagement',
      position: { x: 28, y: 65 }
    },
    
    // Spiral 5 - Left side
    { 
      id: 'slack', 
      name: 'Slack', 
      icon: <Slack className="w-6 h-6" />, 
      color: '#4A154B', 
      helperColor: '#a78bfa',
      description: 'Team communication',
      position: { x: 22, y: 48 }
    },
    
    // Spiral 6 - Top left
    { 
      id: 'gdrive', 
      name: 'Google Drive', 
      icon: <Database className="w-6 h-6" />, 
      color: '#34A853', 
      helperColor: '#34d399',
      description: 'File storage',
      position: { x: 28, y: 32 }
    },
    { 
      id: 'notion', 
      name: 'Notion', 
      icon: <FileText className="w-6 h-6" />, 
      color: '#000000', 
      helperColor: '#71717a',
      description: 'Documentation hub',
      position: { x: 35, y: 25 }
    },
    { 
      id: 'quickbooks', 
      name: 'QuickBooks', 
      icon: <Calculator className="w-6 h-6" />, 
      color: '#2CA01C', 
      helperColor: '#34d399',
      description: 'Financial tracking',
      position: { x: 18, y: 28 }
    },
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Generate spiral path for SVG
  const generateSpiralPath = (startAngle: number, turns: number, startRadius: number, endRadius: number) => {
    const points: string[] = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const angle = startAngle + (turns * 360 * progress);
      const radius = startRadius + (endRadius - startRadius) * progress;
      const radians = (angle * Math.PI) / 180;
      
      const x = 50 + radius * Math.cos(radians);
      const y = 50 + radius * Math.sin(radians);
      
      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    
    return points.join(' ');
  };

  return (
    <div className="relative w-full py-20 overflow-hidden bg-white">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white to-cyan-50/30" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-emerald-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="relative w-full px-4">
        <div 
          ref={containerRef}
          className="relative mx-auto"
          style={{ height: '900px', maxWidth: '1400px' }}
        >
          {/* SVG Layer for spiral paths */}
          <svg 
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Glow filter */}
              <filter id="spiral-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Gradient for spirals */}
              <linearGradient id="spiral-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 0.2 }} />
              </linearGradient>
              
              <linearGradient id="spiral-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 0.2 }} />
              </linearGradient>
              
              <linearGradient id="spiral-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.2 }} />
              </linearGradient>
            </defs>

            {/* Multiple spiral paths */}
            <motion.path
              d={generateSpiralPath(0, 2.5, 5, 35)}
              fill="none"
              stroke="url(#spiral-gradient-1)"
              strokeWidth={0.15}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2, delay: 0.2 }}
              filter="url(#spiral-glow)"
            />
            
            <motion.path
              d={generateSpiralPath(120, 2.5, 5, 35)}
              fill="none"
              stroke="url(#spiral-gradient-2)"
              strokeWidth={0.15}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2, delay: 0.4 }}
              filter="url(#spiral-glow)"
            />
            
            <motion.path
              d={generateSpiralPath(240, 2.5, 5, 35)}
              fill="none"
              stroke="url(#spiral-gradient-3)"
              strokeWidth={0.15}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2, delay: 0.6 }}
              filter="url(#spiral-glow)"
            />
            
            {/* Additional decorative spirals */}
            <motion.path
              d={generateSpiralPath(60, 2, 8, 30)}
              fill="none"
              stroke="url(#spiral-gradient-1)"
              strokeWidth={0.1}
              strokeOpacity={0.3}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2.5, delay: 0.8 }}
              filter="url(#spiral-glow)"
            />
            
            <motion.path
              d={generateSpiralPath(180, 2, 8, 30)}
              fill="none"
              stroke="url(#spiral-gradient-2)"
              strokeWidth={0.1}
              strokeOpacity={0.3}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2.5, delay: 1 }}
              filter="url(#spiral-glow)"
            />
            
            <motion.path
              d={generateSpiralPath(300, 2, 8, 30)}
              fill="none"
              stroke="url(#spiral-gradient-3)"
              strokeWidth={0.1}
              strokeOpacity={0.3}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 2.5, delay: 1.2 }}
              filter="url(#spiral-glow)"
            />

            {/* Connection lines from center to hovered integration */}
            {integrations.map((integration) => {
              if (hoveredId !== integration.id) return null;
              
              return (
                <motion.line
                  key={`line-${integration.id}`}
                  x1={50}
                  y1={50}
                  x2={integration.position.x}
                  y2={integration.position.y}
                  stroke={integration.helperColor}
                  strokeWidth={0.25}
                  strokeOpacity={0.8}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4 }}
                  filter="url(#spiral-glow)"
                />
              );
            })}
          </svg>

          {/* Content Layer */}
          <div className="relative w-full h-full">
            {/* Center Brand - Always Clear */}
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="text-center">
                <motion.h2 
                  className="text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight bg-gradient-to-r from-[#22d3ee] via-[#34d399] to-[#22d3ee] bg-clip-text text-transparent leading-none"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                >
                  HYNÍQÉ
                </motion.h2>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isVisible ? { scaleX: 1 } : {}}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-1 rounded-full mt-4 mx-auto"
                  style={{
                    background: 'linear-gradient(90deg, #22d3ee, #34d399, #22d3ee)',
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
                    width: '70%',
                  }}
                />
                
                <p className="text-[#71717a] mt-6 text-lg font-medium">
                  12 Seamless Integrations
                </p>
              </div>
            </motion.div>

            {/* Integrations with Cursor Mask Reveal Effect */}
            {integrations.map((integration, index) => {
              const isHovered = hoveredId === integration.id;
              const isBlurred = hoveredId !== null && !isHovered;
              
              return (
                <motion.div
                  key={integration.id}
                  className="absolute z-10"
                  style={{
                    left: `${integration.position.x}%`,
                    top: `${integration.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isVisible ? { 
                    opacity: 1, 
                    scale: 1,
                  } : {}}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1 + 1.5,
                    type: 'spring',
                    stiffness: 150,
                  }}
                  onMouseEnter={() => setHoveredId(integration.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <motion.div
                    className="relative cursor-pointer"
                    animate={{
                      scale: isHovered ? 1.2 : 1,
                      filter: isBlurred ? 'blur(8px)' : 'blur(0px)',
                      opacity: isBlurred ? 0.3 : 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                  >
                    {/* Glow ring on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <>
                          {/* Pulsing rings */}
                          {[0, 0.3, 0.6].map((delay) => (
                            <motion.div
                              key={`ring-${delay}`}
                              className="absolute inset-0 rounded-full"
                              initial={{ scale: 1, opacity: 0.6 }}
                              animate={{ scale: 2, opacity: 0 }}
                              exit={{ scale: 1, opacity: 0 }}
                              transition={{
                                duration: 1.5,
                                delay: delay,
                                repeat: Infinity,
                                ease: 'easeOut',
                              }}
                              style={{
                                border: `3px solid ${integration.helperColor}`,
                                boxShadow: `0 0 30px ${integration.helperColor}`,
                              }}
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                    
                    {/* Integration icon container */}
                    <motion.div 
                      className={`
                        relative flex items-center justify-center w-20 h-20 rounded-full
                        transition-all duration-300
                        ${isHovered 
                          ? 'bg-white/90 backdrop-blur-xl border-2 shadow-2xl' 
                          : 'bg-white/70 backdrop-blur-md border border-gray-200'
                        }
                      `}
                      style={{
                        borderColor: isHovered ? integration.helperColor : undefined,
                        boxShadow: isHovered 
                          ? `0 0 50px ${integration.helperColor}80, 0 15px 40px rgba(0,0,0,0.2)`
                          : '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      animate={{
                        rotate: isHovered ? [0, 360] : 0,
                      }}
                      transition={{
                        rotate: { duration: 0.8, ease: 'easeInOut' },
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: integration.color }}
                      >
                        {integration.icon}
                      </div>
                    </motion.div>

                    {/* Tooltip on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full mt-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
                        >
                          <div 
                            className="bg-white/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl border-2"
                            style={{
                              borderColor: integration.helperColor,
                              boxShadow: `0 0 30px ${integration.helperColor}40, 0 10px 30px rgba(0,0,0,0.15)`,
                            }}
                          >
                            <p className="text-[#18181b] font-bold text-base">{integration.name}</p>
                            <p className="text-[#71717a] text-sm mt-1">{integration.description}</p>
                          </div>
                          
                          {/* Tooltip arrow */}
                          <div 
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                            style={{
                              backgroundColor: integration.helperColor,
                              opacity: 0.9,
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}