import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Zap,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  helperColor: string;
  position: { x: number; y: number }; // Scattered positions
}

export function IntegrationHub3D() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Scattered positions for dynamic layout (percentages for responsive)
  const integrations: Integration[] = [
    { 
      id: 'gmail', 
      name: 'Gmail', 
      icon: <Mail className="w-5 h-5" />, 
      color: '#EA4335', 
      helperColor: '#fb923c',
      position: { x: 5, y: 8 }
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <Linkedin className="w-5 h-5" />, 
      color: '#0A66C2', 
      helperColor: '#a78bfa',
      position: { x: 8, y: 18 }
    },
    { 
      id: 'calendar', 
      name: 'Google Calendar', 
      icon: <Calendar className="w-5 h-5" />, 
      color: '#4285F4', 
      helperColor: '#22d3ee',
      position: { x: 12, y: 28 }
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <Facebook className="w-5 h-5" />, 
      color: '#1877F2', 
      helperColor: '#22d3ee',
      position: { x: 6, y: 38 }
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <Instagram className="w-5 h-5" />, 
      color: '#E4405F', 
      helperColor: '#22d3ee',
      position: { x: 10, y: 47 }
    },
    { 
      id: 'notion', 
      name: 'Notion', 
      icon: <FileText className="w-5 h-5" />, 
      color: '#000000', 
      helperColor: '#34d399',
      position: { x: 5, y: 56 }
    },
    { 
      id: 'gdrive', 
      name: 'Google Drive', 
      icon: <Database className="w-5 h-5" />, 
      color: '#34A853', 
      helperColor: '#34d399',
      position: { x: 13, y: 64 }
    },
    { 
      id: 'microsoft', 
      name: 'Microsoft', 
      icon: <Chrome className="w-5 h-5" />, 
      color: '#00A4EF', 
      helperColor: '#22d3ee',
      position: { x: 8, y: 72 }
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      icon: <Slack className="w-5 h-5" />, 
      color: '#4A154B', 
      helperColor: '#a78bfa',
      position: { x: 4, y: 80 }
    },
    { 
      id: 'analytics', 
      name: 'Google Analytics', 
      icon: <BarChart className="w-5 h-5" />, 
      color: '#E37400', 
      helperColor: '#34d399',
      position: { x: 11, y: 88 }
    },
    { 
      id: 'quickbooks', 
      name: 'QuickBooks', 
      icon: <Calculator className="w-5 h-5" />, 
      color: '#2CA01C', 
      helperColor: '#34d399',
      position: { x: 7, y: 95 }
    },
    { 
      id: 'github', 
      name: 'GitHub', 
      icon: <Github className="w-5 h-5" />, 
      color: '#181717', 
      helperColor: '#a78bfa',
      position: { x: 14, y: 102 }
    },
    { 
      id: 'zapier', 
      name: 'Zapier', 
      icon: <Zap className="w-5 h-5" />, 
      color: '#FF4A00', 
      helperColor: '#fb923c',
      position: { x: 9, y: 110 }
    },
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Convergence point (single meeting point for all lines)
  const convergencePoint = { x: 60, y: 50 }; // All lines meet here first
  const brandPoint = { x: 85, y: 50 }; // Then one line goes to brand

  // Generate curved path from integration dot to convergence point
  const getCurvePath = (startX: number, startY: number) => {
    const endX = convergencePoint.x;
    const endY = convergencePoint.y;
    
    const dx = endX - startX;
    const dy = endY - startY;
    
    // More direct horizontal flow (less curvature) - like the reference image
    const controlX1 = startX + dx * 0.6; // Push control points further for straighter lines
    const controlY1 = startY + dy * 0.05; // Minimal vertical deviation
    const controlX2 = startX + dx * 0.8;
    const controlY2 = endY - dy * 0.05;
    
    return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
  };

  // Generate the unified line from convergence to brand
  const getUnifiedPath = () => {
    return `M ${convergencePoint.x} ${convergencePoint.y} L ${brandPoint.x} ${brandPoint.y}`;
  };

  return (
    <div className="relative w-full py-20 overflow-hidden bg-white rounded-3xl border border-purple-100">
      {/* Subtle background gradients */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-200 rounded-full blur-[120px]" />
      </div>
      
      <div className="relative w-full px-4">
        <div className="relative" style={{ minHeight: '700px' }}>
          {/* SVG Layer for connection lines */}
          <svg 
            viewBox="0 0 100 120"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            style={{ minHeight: '700px' }}
          >
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {integrations.map((integration, index) => {
              const isHovered = hoveredId === integration.id;
              const startX = integration.position.x + 8; // Adjust for card width
              const startY = integration.position.y + 1.5; // Center of card
              const pathD = getCurvePath(startX, startY);

              return (
                <g key={`line-${integration.id}`}>
                  {/* Glow layer */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={integration.helperColor}
                    strokeWidth={isHovered ? 0.5 : 0.25}
                    strokeOpacity={isHovered ? 0.7 : 0.3}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isVisible ? {
                      pathLength: 1,
                      opacity: 1,
                    } : {}}
                    transition={{
                      pathLength: { duration: 1.2, delay: index * 0.06 + 0.3 },
                      opacity: { duration: 0.3, delay: index * 0.06 },
                    }}
                    filter="url(#glow)"
                    className="transition-all duration-300"
                  />

                  {/* Main line */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={integration.helperColor}
                    strokeWidth={isHovered ? 0.3 : 0.15}
                    strokeOpacity={isHovered ? 0.9 : 0.6}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={isVisible ? {
                      pathLength: 1,
                      opacity: 1,
                    } : {}}
                    transition={{
                      pathLength: { duration: 1.2, delay: index * 0.06 + 0.3 },
                      opacity: { duration: 0.3, delay: index * 0.06 },
                    }}
                    className="transition-all duration-300"
                  />

                  {/* Animated traveling dot */}
                  <motion.circle
                    r={0.6}
                    fill={integration.helperColor}
                    filter="url(#glow)"
                    initial={{ opacity: 0 }}
                    animate={isVisible ? {
                      opacity: [0, 1, 1, 0],
                    } : {}}
                    transition={{
                      opacity: {
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.2 + 2,
                        times: [0, 0.1, 0.9, 1],
                      },
                    }}
                  >
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      begin={`${index * 0.2 + 2}s`}
                      path={pathD}
                    />
                  </motion.circle>
                </g>
              );
            })}

            {/* Unified line from convergence to brand */}
            <motion.path
              d={getUnifiedPath()}
              fill="none"
              stroke="url(#convergenceGradient)"
              strokeWidth={0.3}
              strokeOpacity={0.8}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isVisible ? {
                pathLength: 1,
                opacity: 1,
              } : {}}
              transition={{
                pathLength: { duration: 1.5, delay: 1.5 },
                opacity: { duration: 0.5, delay: 1.5 },
              }}
              filter="url(#glow)"
              className="transition-all duration-300"
            />

            {/* Animated traveling dots on unified line */}
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={`unified-dot-${i}`}
                r={0.7}
                fill="url(#convergenceGradient)"
                filter="url(#glow)"
                initial={{ opacity: 0 }}
                animate={isVisible ? {
                  opacity: [0, 1, 1, 0],
                } : {}}
                transition={{
                  opacity: {
                    duration: 2,
                    repeat: Infinity,
                    delay: 3 + i * 0.5,
                    times: [0, 0.1, 0.9, 1],
                  },
                }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  begin={`${3 + i * 0.5}s`}
                  path={getUnifiedPath()}
                />
              </motion.circle>
            ))}

            {/* Convergence point - single focal point with subtle glow */}
            <motion.circle
              cx={convergencePoint.x}
              cy={convergencePoint.y}
              r={1.5}
              fill="url(#convergenceGradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={isVisible ? {
                scale: 1,
                opacity: 1,
              } : {}}
              transition={{
                duration: 0.5,
                delay: 1.5,
              }}
              filter="url(#glow)"
            />

            <defs>
              <radialGradient id="convergenceGradient">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                <stop offset="30%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                <stop offset="60%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 0.8 }} />
              </radialGradient>
            </defs>
          </svg>

          {/* Content Layer */}
          <div className="relative" style={{ minHeight: '700px' }}>
            {/* LEFT SIDE - Scattered Integrations */}
            <div className="absolute inset-0">
              {integrations.map((integration, index) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  onMouseEnter={() => setHoveredId(integration.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="absolute"
                  style={{
                    left: `${integration.position.x}%`,
                    top: `${integration.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, x: 5 }}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-xl
                      bg-white/90 backdrop-blur-xl border-2
                      ${hoveredId === integration.id ? 'border-purple-300 bg-white shadow-xl' : 'border-purple-100/50 shadow-md'}
                      transition-all duration-300 cursor-pointer group
                    `}
                    style={{
                      boxShadow: hoveredId === integration.id 
                        ? `0 8px 30px ${integration.helperColor}40, 0 0 0 1px ${integration.helperColor}30`
                        : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-transform group-hover:scale-110 shadow-md"
                      style={{ backgroundColor: integration.color }}
                    >
                      {integration.icon}
                    </div>

                    {/* Name */}
                    <span className="text-[#18181b] font-medium text-sm whitespace-nowrap">
                      {integration.name}
                    </span>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* RIGHT SIDE - HYNIQE Brand - Inline with flow */}
            <div className="absolute left-[87%] top-1/2 -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={isVisible ? { opacity: 1, x: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col"
              >
                <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight bg-gradient-to-r from-[#a78bfa] via-[#22d3ee] to-[#34d399] bg-clip-text text-transparent leading-none whitespace-nowrap">
                  HYNIQE
                </h2>
                
                {/* Gradient underline */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isVisible ? { scaleX: 1 } : {}}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-1 rounded-full mt-2"
                  style={{
                    background: 'linear-gradient(90deg, #a78bfa, #22d3ee, #34d399)',
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)',
                    width: '100%',
                  }}
                />

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={isVisible ? { opacity: 1 } : {}}
                  transition={{ delay: 1 }}
                  className="text-[#71717a] mt-4 text-base"
                >
                  Powered by AI • 12 Integrations
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}