import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { FeaturesShowcase } from '../FeaturesShowcase';
import { Features } from '../Features';
import { RollingText } from '../RollingText';
import { GlassyButton } from '../GlassyButton';
import { AnimatedCompactNumber, AnimatedPercentage } from '../AnimatedNumber';
import { FullscreenHelperCarousel } from '../FullscreenHelperCarousel';

interface FeaturesPageProps {
  onBack: () => void;
  onNavigate?: (page: 'auth' | 'esha' | 'karo' | 'nivi' | 'orin' | 'turbo' | 'pricing' | 'brain' | 'integrations' | 'features' | 'home') => void;
}

export function FeaturesPage({ onBack, onNavigate }: FeaturesPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section-padding relative overflow-hidden bg-white pt-24">
        {/* Background gradient - subtle on white */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-cyan-50/30 pointer-events-none" />
        
        <div className="container-custom relative z-10">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-4 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full"
            >
              <span className="text-gradient font-medium">Platform Capabilities</span>
            </motion.div>
            
            <h1 className="mb-6 text-[#18181b]">
              <RollingText delay={0.3}>
                Everything you need to
              </RollingText>
              <br />
              <RollingText delay={0.5}>
                <span className="text-gradient">supercharge your team</span>
              </RollingText>
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-xl text-[#52525b] max-w-3xl mx-auto"
            >
              HYNIQE combines cutting-edge AI technology with intuitive design to deliver
              a powerful platform that grows with your business. Explore all the features
              that make our AI employees truly exceptional.
            </motion.p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-purple-600">
                <AnimatedCompactNumber value={5} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">AI Models</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-orange-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-orange-600">
                <AnimatedCompactNumber value={50} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Integrations</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-cyan-600">
                <AnimatedCompactNumber value={100} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Features</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-green-600">
                <AnimatedPercentage value={99.9} decimals={1} />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Uptime</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* NEW: Fullscreen Helper Carousel - 3D Effect - MOVED HERE */}
      <FullscreenHelperCarousel onNavigate={onNavigate} />

      {/* Features Showcase Section */}
      <FeaturesShowcase />

      {/* Detailed Features Section */}
      <Features />

      {/* Bottom CTA */}
      <section className="section-padding bg-gradient-to-b from-white to-purple-50/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg rounded-3xl p-12 text-center relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-orange-100/30 to-cyan-100/50 pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="mb-4 text-[#18181b]">
                Ready to experience <span className="text-gradient">the future</span>?
              </h2>
              <p className="text-xl text-[#52525b] mb-8 max-w-2xl mx-auto">
                Stop juggling tools. Start managing outcomes.<br />
                Deploy AI Helpers that actually work like employees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onBack}
                  className="px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:shadow-lg font-medium text-lg"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={onBack}
                  className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-purple-200 text-[#18181b] rounded-full transition-all hover:scale-105 hover:border-purple-300 font-medium text-lg"
                >
                  View Pricing
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}