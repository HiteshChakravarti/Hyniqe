import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Zap, TrendingUp, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up',
    description: '30 seconds',
    detail: 'Create your account and get instant access to your AI workforce.',
    color: 'from-[#a78bfa] to-[#c084fc]', // Purple
  },
  {
    number: '02',
    icon: Zap,
    title: 'Choose Your Team',
    description: 'Pick AI employees',
    detail: 'Select from specialized AI helpers based on your business needs.',
    color: 'from-[#f0abfc] to-[#e879f9]', // Pink
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Deploy & Work',
    description: 'Start immediately',
    detail: 'Your AI team starts working instantly. No training required.',
    color: 'from-[#22d3ee] to-[#06b6d4]', // Cyan
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Achieve Success',
    description: 'See results',
    detail: 'Monitor your AI team\'s performance and achieve your business goals.',
    color: 'from-[#34d399] to-[#10b981]', // Green
  },
];

interface JourneyStepperProps {
  onGetStarted?: () => void;
}

export function JourneyStepper({ onGetStarted }: JourneyStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const nextStep = prev + 1;
        
        // Mark current step as completed
        if (!completedSteps.includes(prev)) {
          setCompletedSteps((completed) => [...completed, prev]);
        }
        
        // If we've reached the end
        if (nextStep >= steps.length) {
          setIsAutoPlaying(false);
          setAllCompleted(true);
          setShowConfetti(true);
          return prev;
        }
        
        return nextStep;
      });
    }, 3000); // 3 seconds per step

    return () => clearInterval(interval);
  }, [isAutoPlaying, completedSteps]);

  // Handle step click
  const handleStepClick = (index: number) => {
    setActiveStep(index);
    
    // Mark all previous steps as completed
    const previousSteps = Array.from({ length: index }, (_, i) => i);
    setCompletedSteps((prev) => {
      const newCompleted = [...new Set([...prev, ...previousSteps])];
      
      // Check if all steps are now completed
      if (index === steps.length - 1 && !prev.includes(index)) {
        setAllCompleted(true);
        setShowConfetti(true);
      }
      
      return newCompleted;
    });
  };

  // Start auto-play tour
  const startAutoPlay = () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setAllCompleted(false);
    setIsAutoPlaying(true);
  };

  // Reset journey
  const resetJourney = () => {
    setActiveStep(0);
    setCompletedSteps([]);
    setAllCompleted(false);
    setIsAutoPlaying(false);
    setShowConfetti(false);
  };

  // Calculate progress percentage
  const progressPercentage = ((completedSteps.length + (allCompleted ? 1 : 0)) / steps.length) * 100;

  return (
    <section id="how-it-works" className="section-padding bg-white relative overflow-hidden">
      {/* Confetti Effect */}
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 via-white/50 to-white pointer-events-none" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-12"
        >
          <h2 className="mb-4">Get started in 4 simple steps</h2>
          <p className="text-text-tertiary max-w-2xl mx-auto">
            Deploy your AI workforce in minutes, not months. No technical expertise required.
          </p>
        </motion.div>

        {/* Progress Bar & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          {/* Progress Bar */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-tech text-sm text-text-secondary">
                JOURNEY PROGRESS
              </div>
              <div className="font-tech text-lg text-text-primary">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            
            <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#a78bfa] via-[#f0abfc] via-[#22d3ee] to-[#34d399]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Completion Message */}
            <AnimatePresence>
              {allCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#34d399]/20 to-[#10b981]/20 border border-[#34d399]/30 rounded-full">
                    <CheckCircle className="w-5 h-5 text-[#34d399]" />
                    <span className="font-tech text-sm text-[#10b981]">
                      JOURNEY COMPLETE! 🎉
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={isAutoPlaying ? () => setIsAutoPlaying(false) : startAutoPlay}
              className="glass-card px-6 py-3 rounded-full hover:bg-white border border-white/50 transition-all hover:scale-105 flex items-center gap-2 group"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-5 h-5 text-[#a78bfa]" />
                  <span className="font-tech text-sm">Pause Tour</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-[#a78bfa]" />
                  <span className="font-tech text-sm">Start Auto Tour</span>
                </>
              )}
            </button>

            <button
              onClick={resetJourney}
              className="glass-card px-6 py-3 rounded-full hover:bg-white border border-white/50 transition-all hover:scale-105 flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5 text-text-tertiary" />
              <span className="font-tech text-sm">Reset</span>
            </button>
          </div>
        </motion.div>

        {/* Steps - Desktop: Horizontal, Mobile: Vertical */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 relative max-w-7xl mx-auto">
          {/* Connection Lines (Desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 z-0">
            <div className="h-full bg-gradient-to-r from-transparent via-border-soft to-transparent" 
                 style={{ 
                   width: 'calc(100% - 160px)', 
                   marginLeft: '80px' 
                 }} 
            />
            
            {/* Animated Progress Line */}
            <motion.div
              className="h-full bg-gradient-to-r from-[#a78bfa] via-[#f0abfc] via-[#22d3ee] to-[#34d399] absolute top-0"
              initial={{ width: 0 }}
              animate={{ 
                width: completedSteps.length > 0 
                  ? `calc(${(completedSteps.length / (steps.length - 1)) * 100}% - 160px)`
                  : 0
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ marginLeft: '80px' }}
            />
          </div>

          {steps.map((step, index) => {
            const isActive = activeStep === index;
            const isCompleted = completedSteps.includes(index);
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative z-10"
              >
                <motion.button
                  onClick={() => handleStepClick(index)}
                  className={`
                    w-full glass-card p-8 transition-all duration-500 group cursor-pointer
                    ${isActive ? 'bg-white shadow-2xl glow scale-105' : 'hover:bg-white hover:shadow-xl hover:scale-102'}
                    ${isCompleted ? 'border-[#34d399]/30' : 'border-white/50'}
                  `}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Number Badge */}
                  <div className="relative mb-6 flex justify-center">
                    <motion.div
                      className={`
                        w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden
                        ${isActive ? 'shadow-xl' : 'shadow-lg'}
                      `}
                      animate={isActive ? { 
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: isActive ? Infinity : 0,
                        ease: 'easeInOut'
                      }}
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color}`} />
                      
                      {/* Completion Checkmark */}
                      <AnimatePresence>
                        {isCompleted && !isActive && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 bg-gradient-to-br from-[#34d399] to-[#10b981] flex items-center justify-center"
                          >
                            <CheckCircle className="w-10 h-10 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Step Number */}
                      {(!isCompleted || isActive) && (
                        <span className="text-3xl font-bold text-white relative z-10 font-tech">
                          {step.number}
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <motion.div
                      animate={isActive ? { 
                        y: [0, -4, 0],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: isActive ? Infinity : 0,
                        ease: 'easeInOut'
                      }}
                    >
                      <StepIcon className={`w-10 h-10 ${isActive ? 'text-[#a78bfa]' : 'text-text-tertiary'} transition-colors`} />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl mb-2 font-tech ${isActive ? 'text-gradient' : ''}`}>
                    {step.title}
                  </h3>
                  
                  <div className={`
                    font-medium mb-3 font-tech text-sm
                    ${isCompleted ? 'text-[#34d399]' : 'text-[#a78bfa]'}
                  `}>
                    {isCompleted && !isActive ? '✓ COMPLETED' : step.description.toUpperCase()}
                  </div>
                  
                  <p className={`text-sm transition-colors ${isActive ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                    {step.detail}
                  </p>

                  {/* Active Indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border-subtle"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="w-2 h-2 bg-[#a78bfa] rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="font-tech text-xs text-[#a78bfa]">ACTIVE</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Mobile Connection Line */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center py-4">
                    <div className={`
                      w-1 h-12 rounded-full transition-all duration-500
                      ${completedSteps.includes(index) 
                        ? 'bg-gradient-to-b from-[#34d399] to-[#10b981]' 
                        : 'bg-border-soft'
                      }
                    `} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <button 
            onClick={onGetStarted}
            className="glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white py-4 px-10 rounded-full transition-all border border-white/20 hover:scale-105 shadow-xl font-tech"
          >
            Start Your Free Trial
          </button>
          <p className="text-sm text-text-tertiary mt-4 font-tech">
            NO CREDIT CARD REQUIRED • 14-DAY FREE TRIAL
          </p>
        </motion.div>
      </div>
    </section>
  );
}
