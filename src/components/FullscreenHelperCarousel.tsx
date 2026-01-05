import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import eshaImage from 'figma:asset/b434b05361034eca13601b9d522dffa1cc5229d9.png';
import karoImage from 'figma:asset/d45ed71bf1590295ce00ae8d744117adb1ec7479.png';
import niviImage from 'figma:asset/0ad1d2f5ccad00c11a5650031ed9406df751a055.png';
import orinImage from 'figma:asset/48fba9f6f9bd14e6878f277860141b89e0a39432.png';
import turboImage from 'figma:asset/4b33d5b78096e6f6fd5a8e3c58afc35665ef97b0.png';

interface Helper {
  id: string;
  name: string;
  role: string;
  feature: string;
  description: string;
  color: string;
  bgGradient: string;
  image: string;
}

const helpers: Helper[] = [
  {
    id: 'esha',
    name: 'Esha',
    role: 'AI Recruiter',
    feature: 'AI-Powered Recruiting',
    description: 'Screen candidates, schedule interviews, and find top talent 24/7. Esha automates your entire recruitment pipeline with intelligent matching.',
    color: '#a78bfa',
    bgGradient: 'from-purple-500/20 via-purple-400/10 to-white',
    image: eshaImage,
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success Manager',
    feature: 'Customer Success Automation',
    description: 'Handle support tickets, onboard customers, and increase retention. Karo provides personalized support at scale, 24/7.',
    color: '#fb923c',
    bgGradient: 'from-orange-500/20 via-orange-400/10 to-white',
    image: karoImage,
  },
  {
    id: 'nivi',
    name: 'Nivi',
    role: 'Social Media Manager',
    feature: 'Social Media Management',
    description: 'Create engaging content, schedule posts, and grow your audience. Nivi manages your entire social presence with AI creativity.',
    color: '#22d3ee',
    bgGradient: 'from-cyan-500/20 via-cyan-400/10 to-white',
    image: niviImage,
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    feature: 'Advanced Analytics',
    description: 'Analyze data, generate insights, and create reports automatically. Orin turns your data into actionable intelligence instantly.',
    color: '#34d399',
    bgGradient: 'from-green-500/20 via-green-400/10 to-white',
    image: orinImage,
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    feature: 'Sales Acceleration',
    description: 'Qualify leads, send follow-ups, and close deals faster. Turbo supercharges your sales pipeline with intelligent automation.',
    color: '#fb923c',
    bgGradient: 'from-orange-600/20 via-orange-500/10 to-white',
    image: turboImage,
  },
];

export function FullscreenHelperCarousel({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % helpers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const navigate = (newIndex: number) => {
    setActiveIndex(newIndex);
  };

  const activeHelper = helpers[activeIndex];

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Animated Background Gradient */}
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 bg-gradient-to-br ${activeHelper.bgGradient}`}
      />

      {/* Giant "HYNÍQÉ" Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative"
        >
          <h1 
            className="text-[12rem] sm:text-[16rem] md:text-[20rem] lg:text-[28rem] xl:text-[32rem] font-bold tracking-tighter leading-none select-none"
            style={{
              background: 'linear-gradient(to right, #a78bfa, #60a5fa, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: 0.08,
            }}
          >
            HYNÍQÉ
          </h1>
        </motion.div>
      </div>

      {/* Main Content Container */}
      <div 
        className="relative z-10 min-h-screen flex items-center justify-center px-4 lg:px-8 py-20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Feature Info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Feature Tag */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-block"
                >
                  <div 
                    className="px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl border"
                    style={{
                      backgroundColor: `${activeHelper.color}15`,
                      borderColor: `${activeHelper.color}40`,
                      color: activeHelper.color,
                    }}
                  >
                    {activeHelper.role}
                  </div>
                </motion.div>

                {/* Feature Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-5xl xl:text-6xl font-bold text-[#18181b] leading-tight"
                >
                  {activeHelper.feature}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-xl text-[#52525b] leading-relaxed"
                >
                  {activeHelper.description}
                </motion.p>

                {/* Helper Name with Color */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="pt-4"
                >
                  <div className="text-sm text-[#71717a] mb-2">Powered by</div>
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: activeHelper.color }}
                  >
                    {activeHelper.name}
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  onClick={() => onNavigate?.('auth')}
                  className="mt-6 px-8 py-4 rounded-full text-white font-medium text-lg shadow-2xl hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: activeHelper.color,
                  }}
                >
                  Chat with {activeHelper.name}
                </motion.button>
              </motion.div>
            </AnimatePresence>

            {/* Right: 3D Helper Image */}
            <div className="relative" style={{ perspective: '2000px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, rotateY: 30, scale: 0.8 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: -30, scale: 0.8 }}
                  transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative"
                >
                  {/* Glow Effect Behind Image */}
                  <div
                    className="absolute inset-0 blur-3xl opacity-40 rounded-full"
                    style={{
                      backgroundColor: activeHelper.color,
                      transform: 'translateZ(-50px) scale(0.9)',
                    }}
                  />

                  {/* Helper Image */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative z-10"
                  >
                    <img
                      src={activeHelper.image}
                      alt={activeHelper.name}
                      className="w-full h-auto drop-shadow-2xl"
                    />
                  </motion.div>

                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30"
                    style={{ backgroundColor: activeHelper.color }}
                  />
                  <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full blur-2xl opacity-20"
                    style={{ backgroundColor: activeHelper.color }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-8">
            {/* Helper Image - Mobile */}
            <div className="relative max-w-md mx-auto" style={{ perspective: '1500px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative"
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 blur-3xl opacity-30 rounded-full"
                    style={{ backgroundColor: activeHelper.color }}
                  />
                  
                  {/* Image */}
                  <img
                    src={activeHelper.image}
                    alt={activeHelper.name}
                    className="w-full h-auto drop-shadow-2xl relative z-10"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Info - Mobile */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4 px-4"
              >
                {/* Tag */}
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl border"
                  style={{
                    backgroundColor: `${activeHelper.color}15`,
                    borderColor: `${activeHelper.color}40`,
                    color: activeHelper.color,
                  }}
                >
                  {activeHelper.role}
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl font-bold text-[#18181b]">
                  {activeHelper.feature}
                </h2>

                {/* Description */}
                <p className="text-lg text-[#52525b]">
                  {activeHelper.description}
                </p>

                {/* Helper Name */}
                <div className="pt-2">
                  <div className="text-sm text-[#71717a] mb-1">Powered by</div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: activeHelper.color }}
                  >
                    {activeHelper.name}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onNavigate?.('auth')}
                  className="mt-4 px-8 py-4 rounded-full text-white font-medium shadow-2xl hover:scale-105 transition-transform"
                  style={{ backgroundColor: activeHelper.color }}
                >
                  Chat with {activeHelper.name}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => navigate((activeIndex - 1 + helpers.length) % helpers.length)}
          className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 backdrop-blur-xl bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-[100] shadow-xl"
          style={{
            boxShadow: `0 8px 32px ${activeHelper.color}40`,
          }}
        >
          <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-gray-700" />
        </button>
        <button
          onClick={() => navigate((activeIndex + 1) % helpers.length)}
          className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 backdrop-blur-xl bg-white/90 border border-gray-200 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-[100] shadow-xl"
          style={{
            boxShadow: `0 8px 32px ${activeHelper.color}40`,
          }}
        >
          <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-gray-700" />
        </button>
      </div>

      {/* Bottom: Thumbnails */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-3 px-4">
          {helpers.map((helper, index) => (
            <motion.button
              key={helper.id}
              onClick={() => navigate(index)}
              className="relative group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Thumbnail */}
              <div
                className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-4 transition-all ${
                  index === activeIndex 
                    ? 'border-white shadow-2xl' 
                    : 'border-white/50 opacity-60 hover:opacity-100'
                }`}
                style={{
                  boxShadow: index === activeIndex ? `0 0 30px ${helper.color}80` : 'none',
                }}
              >
                <img
                  src={helper.image}
                  alt={helper.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Active Indicator */}
              {index === activeIndex && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: helper.color }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}