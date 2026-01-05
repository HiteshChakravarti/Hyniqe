import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SwipeLettersButton } from './SwipeLettersButton';

interface FinalCTAProps {
  onGetStarted?: () => void;
}

export function FinalCTA({ onGetStarted }: FinalCTAProps = {}) {
  return (
    <section className="section-padding relative overflow-hidden bg-white">
      {/* Floating Gradient Orbs Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Purple Orb */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-40"
          style={{ 
            background: 'radial-gradient(circle, #a78bfa 0%, transparent 60%)',
            top: '-10%', 
            left: '-10%' 
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Cyan Orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-40"
          style={{ 
            background: 'radial-gradient(circle, #22d3ee 0%, transparent 60%)',
            top: '20%', 
            right: '-15%' 
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Green Orb */}
        <motion.div
          className="absolute w-[450px] h-[450px] rounded-full blur-[80px] opacity-35"
          style={{ 
            background: 'radial-gradient(circle, #34d399 0%, transparent 60%)',
            bottom: '-10%', 
            left: '30%' 
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Orange Orb */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-35"
          style={{ 
            background: 'radial-gradient(circle, #fb923c 0%, transparent 60%)',
            bottom: '10%', 
            right: '10%' 
          }}
          animate={{
            x: [0, -60, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent-primary" />
            <span className="text-sm text-accent-primary font-medium">Join 10,000+ teams already using HYNÍQÉ</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 text-text-primary"
          >
            Start your AI workforce <span className="text-gradient">today</span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-text-secondary mb-8 max-w-2xl mx-auto"
          >
            Transform your business with specialized AI employees. Deploy in seconds, scale instantly, achieve more.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <SwipeLettersButton
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              icon={<ArrowRight className="w-5 h-5" />}
              direction="bottom"
            >
              Start Free Trial
            </SwipeLettersButton>
            <SwipeLettersButton
              variant="outline"
              size="lg"
              direction="bottom"
            >
              Schedule a Demo
            </SwipeLettersButton>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-6 text-sm text-text-tertiary"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}