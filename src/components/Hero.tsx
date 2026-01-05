import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users, Play, CheckCircle } from 'lucide-react';
import { GlassyButton } from './GlassyButton';
import { SwipeLettersButton } from './SwipeLettersButton';
import { RollingText } from './RollingText';
import { AnimatedCompactNumber, AnimatedPercentage } from './AnimatedNumber';

interface HeroProps {
  onGetStarted: () => void;
  onViewEffectsDemo?: () => void;
}

// Helper colors for cycling
const helperColors = [
  { color: '#a78bfa', name: 'Esha', gradient: 'from-purple-500/20 via-purple-400/10 to-transparent' },  // Purple
  { color: '#fb923c', name: 'Karo', gradient: 'from-orange-500/20 via-orange-400/10 to-transparent' },   // Orange
  { color: '#22d3ee', name: 'Nivi', gradient: 'from-cyan-500/20 via-cyan-400/10 to-transparent' },      // Cyan
  { color: '#34d399', name: 'Orin', gradient: 'from-green-500/20 via-green-400/10 to-transparent' },    // Green
  { color: '#fb923c', name: 'Turbo', gradient: 'from-orange-600/20 via-orange-500/10 to-transparent' }, // Orange
];

export function Hero({ onGetStarted, onViewEffectsDemo }: HeroProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorIndex, setColorIndex] = useState(0);

  // Color cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % helperColors.length);
    }, 3000); // Change color every 3 seconds (faster, tighter)

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    // Create particles
    const particleCount = window.innerWidth < 768 ? 30 : 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 139, 250, 0.4)';
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20 bg-white">
      {/* Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Giant HYNÍQÉ Background Text with Color Transitions */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={colorIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute"
          >
            <h1 
              className="text-[10rem] sm:text-[14rem] md:text-[18rem] lg:text-[24rem] xl:text-[28rem] font-bold tracking-tighter leading-none select-none"
              style={{
                background: `linear-gradient(135deg, ${helperColors[colorIndex].color}90, ${helperColors[colorIndex].color}60, ${helperColors[colorIndex].color}40)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                opacity: 0.25,
              }}
            >
              HYNÍQÉ
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Animated Background Gradient that transitions with colors */}
      <motion.div
        key={`gradient-${colorIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className={`absolute inset-0 bg-gradient-to-br ${helperColors[colorIndex].gradient} pointer-events-none`}
      />

      {/* Light Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/50 pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Headline with Rolling Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative mb-8"
          >
            <h1 className="relative z-10 text-[#18181b] text-center">
              <RollingText delay={0.3}>
                <span className="text-gradient">Lightning fast</span> AI employees for modern teams
              </RollingText>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#52525b] mb-12 text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed text-center"
          >
            Deploy in seconds. Scale instantly. Meet your specialized AI workforce ready to recruit, sell, analyze, and grow your business 24/7.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white py-4 px-10 rounded-full transition-all flex items-center justify-center gap-2 group border border-white/20 hover:scale-[1.02] shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <SwipeLettersButton
              variant="secondary"
              size="lg"
              icon={<Play className="w-5 h-5" />}
              direction="bottom"
            >
              Watch Demo
            </SwipeLettersButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-12"
          >
            <div>
              <AnimatedCompactNumber
                value={10000}
                className="text-4xl lg:text-5xl font-bold mb-2 text-[#18181b]"
              />
              <div className="text-sm text-[#71717a]">Active Teams</div>
            </div>
            <div>
              <AnimatedCompactNumber
                value={500000}
                className="text-4xl lg:text-5xl font-bold mb-2 text-[#18181b]"
              />
              <div className="text-sm text-[#71717a]">Tasks Completed</div>
            </div>
            <div>
              <AnimatedPercentage
                value={99.9}
                className="text-4xl lg:text-5xl font-bold mb-2 text-[#18181b]"
              />
              <div className="text-sm text-[#71717a]">Uptime</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}