import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface HeaderEffectsDemoProps {
  onBack: () => void;
}

export function HeaderEffectsDemo({ onBack }: HeaderEffectsDemoProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a0f1f]">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl text-white text-center mb-12">Header Animation Effects Demo</h1>
        
        <div className="space-y-16">
          {/* Effect 1: Matrix Rain */}
          <EffectDemo
            title="1. Classic Matrix Rain"
            description="Characters falling vertically behind text (HYNIQE purple/cyan theme)"
          >
            <MatrixRainEffect />
          </EffectDemo>

          {/* Effect 2: Scrambled Text Reveal */}
          <EffectDemo
            title="2. Scrambled Text Reveal"
            description="Random characters that solve themselves into the actual text"
          >
            <ScrambledTextEffect text="Unlock the Power of Brain AI" />
          </EffectDemo>

          {/* Effect 3: Data Stream */}
          <EffectDemo
            title="3. Data Stream Background"
            description="Flowing binary/hex code streams behind text"
          >
            <DataStreamEffect />
          </EffectDemo>

          {/* Effect 4: Glitch Effect */}
          <EffectDemo
            title="4. Cyberpunk Glitch"
            description="RGB split and scan line distortion effect"
          >
            <GlitchTextEffect text="Brain AI Technology" />
          </EffectDemo>

          {/* Effect 5: Terminal Typing */}
          <EffectDemo
            title="5. Terminal Typing"
            description="Text types out character by character with cursor"
          >
            <TerminalTypingEffect text="Initializing Brain AI System..." />
          </EffectDemo>

          {/* Effect 6: Neural Network Particles */}
          <EffectDemo
            title="6. Neural Network Particles"
            description="Particles flow and connect to form text"
          >
            <NeuralParticlesEffect />
          </EffectDemo>

          {/* Effect 7: Hybrid - Matrix + Scrambled */}
          <EffectDemo
            title="7. Hybrid: Matrix Rain + Scrambled Text"
            description="Combination of matrix background with text reveal"
          >
            <HybridEffect />
          </EffectDemo>

          {/* Effect 8: Wave Distortion */}
          <EffectDemo
            title="8. Wave Distortion"
            description="Text with flowing wave distortion effect"
          >
            <WaveDistortionEffect text="HYNIQE Brain AI" />
          </EffectDemo>
        </div>
      </div>
    </div>
  );
}

// Demo Container Component
function EffectDemo({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
      <h2 className="text-2xl text-white mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        {children}
      </div>
    </div>
  );
}

// Effect 1: Matrix Rain
function MatrixRainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const colors = ['#a78bfa', '#06b6d4', '#8b5cf6', '#0ea5e9'];

    function draw() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.fillStyle = color;
        ctx.fillText(char, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-5xl md:text-6xl text-white text-center z-10 drop-shadow-2xl">
          Unlock the Power of<br />Brain AI
        </h1>
      </div>
    </div>
  );
}

// Effect 2: Scrambled Text Reveal
function ScrambledTextEffect({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

  useEffect(() => {
    if (currentIndex >= text.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(0);
        setDisplayText('');
      }, 3000);
      return () => clearTimeout(timer);
    }

    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => {
        const result = text
          .split('')
          .map((char, index) => {
            if (index < currentIndex) {
              return text[index];
            }
            if (index === currentIndex) {
              return iterations < 8 
                ? chars[Math.floor(Math.random() * chars.length)]
                : text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        
        return result;
      });

      iterations++;
      
      if (iterations >= 10) {
        clearInterval(interval);
        setCurrentIndex(prev => prev + 1);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, text]);

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-cyan-900/20">
      <h1 className="text-5xl md:text-6xl text-white font-mono text-center px-8">
        {displayText}
      </h1>
    </div>
  );
}

// Effect 3: Data Stream
function DataStreamEffect() {
  const [streams, setStreams] = useState<Array<{ id: number; text: string; duration: number; delay: number }>>([]);

  useEffect(() => {
    const generateStream = () => {
      const binaryStrings = [
        '01001000 01011001 01001110 01001001 01010001 01000101',
        '0xA3F2 0xB947 0x8C21 0xD4E8',
        'BRAIN.AI.SYSTEM.INIT',
        '11010110 10101101 11001100',
        'DATA_SYNC_COMPLETE'
      ];
      
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        text: binaryStrings[Math.floor(Math.random() * binaryStrings.length)],
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2
      }));
    };

    setStreams(generateStream());
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          initial={{ x: '100%' }}
          animate={{ x: '-100%' }}
          transition={{
            duration: stream.duration,
            delay: stream.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute text-purple-500/30 font-mono text-sm whitespace-nowrap"
          style={{ top: `${(stream.id * 20) % 100}%` }}
        >
          {stream.text}
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-5xl md:text-6xl text-white text-center z-10 bg-black/50 px-8 py-4 rounded-2xl backdrop-blur-sm">
          Your Business<br />Your Knowledge
        </h1>
      </div>
    </div>
  );
}

// Effect 4: Glitch Effect
function GlitchTextEffect({ text }: { text: string }) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full bg-black relative overflow-hidden">
      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-full h-1 bg-cyan-500/20"
        />
      </div>

      <div className="relative">
        <h1 className={`text-5xl md:text-6xl text-white font-bold text-center transition-all ${
          isGlitching ? 'glitch' : ''
        }`}>
          {text}
        </h1>
        
        {isGlitching && (
          <>
            <h1 className="absolute inset-0 text-5xl md:text-6xl font-bold text-center text-red-500 opacity-70" 
                style={{ transform: 'translate(-2px, -2px)' }}>
              {text}
            </h1>
            <h1 className="absolute inset-0 text-5xl md:text-6xl font-bold text-center text-cyan-500 opacity-70"
                style={{ transform: 'translate(2px, 2px)' }}>
              {text}
            </h1>
          </>
        )}
      </div>
    </div>
  );
}

// Effect 5: Terminal Typing
function TerminalTypingEffect({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setDisplayText('');
          index = 0;
        }, 2000);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, [text]);

  return (
    <div className="flex items-center justify-center h-full bg-black p-8">
      <div className="w-full max-w-3xl bg-gray-900 rounded-lg p-6 border border-green-500/30">
        <div className="flex gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="font-mono text-green-400 text-xl">
          <span className="text-gray-500">{'>'}</span> {displayText}
          <span className={`inline-block w-2 h-6 bg-green-400 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}></span>
        </div>
      </div>
    </div>
  );
}

// Effect 6: Neural Particles
function NeuralParticlesEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
        ctx.fill();
      }
    }

    const particles: Particle[] = Array.from({ length: 100 }, () => new Particle());

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();

        // Draw connections
        particles.forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-5xl md:text-6xl text-white text-center z-10">
          Neural Network<br />Brain AI
        </h1>
      </div>
    </div>
  );
}

// Effect 7: Hybrid Effect
function HybridEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const text = 'HYNIQE Brain AI';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Matrix background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);
    const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';

    function draw() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '12px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        
        ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
        ctx.fillText(char, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  // Scrambled text
  useEffect(() => {
    if (currentIndex >= text.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(0);
        setDisplayText('');
      }, 3000);
      return () => clearTimeout(timer);
    }

    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (index < currentIndex) return text[index];
            if (index === currentIndex) {
              return iterations < 8 
                ? chars[Math.floor(Math.random() * chars.length)]
                : text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      iterations++;
      
      if (iterations >= 10) {
        clearInterval(interval);
        setCurrentIndex(prev => prev + 1);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-5xl md:text-7xl text-white font-mono text-center z-10 drop-shadow-2xl">
          {displayText}
        </h1>
      </div>
    </div>
  );
}

// Effect 8: Wave Distortion
function WaveDistortionEffect({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/30 to-cyan-900/30 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="wave">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise">
              <animate
                attributeName="baseFrequency"
                dur="10s"
                values="0.01;0.03;0.01"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
          </filter>
        </defs>
      </svg>
      
      <h1 
        className="text-5xl md:text-7xl text-white font-bold text-center z-10"
        style={{ filter: 'url(#wave)' }}
      >
        {text}
      </h1>
    </div>
  );
}
