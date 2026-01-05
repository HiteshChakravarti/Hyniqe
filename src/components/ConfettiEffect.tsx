import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  gravity: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Brand colors - purple, pink, cyan, orange
    const colors = [
      '#a78bfa', // purple
      '#f0abfc', // pink
      '#22d3ee', // cyan
      '#fb923c', // orange
      '#34d399', // green
      '#fbbf24', // yellow
    ];

    const particles: Particle[] = [];
    const particleCount = 150;

    // Create particles from multiple points
    const createBurst = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const velocity = 5 + Math.random() * 10;
        
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - Math.random() * 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          width: 8 + Math.random() * 8,
          height: 4 + Math.random() * 4,
          gravity: 0.3 + Math.random() * 0.2,
        });
      }
    };

    // Create multiple bursts across the screen
    createBurst(canvas.width * 0.3, canvas.height * 0.4, particleCount / 3);
    createBurst(canvas.width * 0.5, canvas.height * 0.3, particleCount / 3);
    createBurst(canvas.width * 0.7, canvas.height * 0.4, particleCount / 3);

    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      particles.forEach((particle) => {
        // Update physics
        particle.vy += particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.vx *= 0.99; // Air resistance

        // Only draw if still on screen
        if (particle.y < canvas.height + 50) {
          activeParticles++;

          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);
          
          // Draw confetti piece with gradient
          const gradient = ctx.createLinearGradient(
            -particle.width / 2,
            -particle.height / 2,
            particle.width / 2,
            particle.height / 2
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, particle.color + '80');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(
            -particle.width / 2,
            -particle.height / 2,
            particle.width,
            particle.height
          );
          ctx.restore();
        }
      });

      // Continue animation if particles are still visible
      if (activeParticles > 0 && Date.now() - startTime < 5000) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Clean up when done
        if (onComplete) onComplete();
      }
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [trigger, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
