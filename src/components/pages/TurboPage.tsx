import { motion } from 'motion/react';
import { ArrowLeft, Target, Phone, TrendingUp, DollarSign } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function TurboPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: 'auth') => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Back Button */}
      <div className="container-custom py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Employees
        </button>
      </div>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur-3xl rounded-full" />
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Turbo - Sales Specialist"
                className="relative w-full max-w-md mx-auto"
              />
            </motion.div>

            {/* Right: Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-block px-4 py-2 bg-orange-500/10 border border-red-500/20 rounded-full text-orange-400 text-sm mb-6">
                Sales Specialist
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Meet Turbo
              </h1>
              
              <p className="text-xl text-[#a1a1aa] mb-8 leading-relaxed">
                Your relentless sales powerhouse who never misses an opportunity. 
                Turbo qualifies leads, follows up with prospects, and closes deals with AI-powered precision and persistence.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-orange-400">94%</div>
                  <div className="text-sm text-[#71717a]">Conversion Rate</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-orange-400">3x</div>
                  <div className="text-sm text-[#71717a]">Pipeline Growth</div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:scale-105 transition-all hover:glow"
              >
                Supercharge Sales with Turbo
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-padding bg-[#131318]/30">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">What Turbo Can Do</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Qualify Leads',
                description: 'Identify high-potential prospects and prioritize your sales efforts effectively.',
              },
              {
                icon: Phone,
                title: 'Follow Up',
                description: 'Never miss a follow-up with persistent, timely outreach to every prospect.',
              },
              {
                icon: DollarSign,
                title: 'Close Deals',
                description: 'Handle objections, negotiate terms, and move deals through the pipeline.',
              },
              {
                icon: TrendingUp,
                title: 'Optimize Pipeline',
                description: 'Analyze sales data and refine strategies to maximize conversion rates.',
              },
            ].map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 hover:bg-[#1a1a24]/60 transition-all"
              >
                <capability.icon className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">{capability.title}</h3>
                <p className="text-[#a1a1aa]">{capability.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">Perfect For</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'B2B Companies',
                description: 'Scale your sales team without scaling costs. Close more enterprise deals.',
              },
              {
                title: 'Sales Teams',
                description: 'Let reps focus on relationships while Turbo handles prospecting.',
              },
              {
                title: 'Startups',
                description: 'Build a sales engine from day one without hiring a full team.',
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <h3 className="text-2xl font-bold mb-4 text-white">{useCase.title}</h3>
                <p className="text-[#a1a1aa]">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-b from-transparent to-orange-500/5">
        <div className="container-custom text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to accelerate your revenue?
          </h2>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
            Let Turbo transform your sales pipeline and drive consistent, predictable growth.
          </p>
          <button 
            onClick={() => onNavigate?.('auth')}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:scale-105 transition-all hover:glow"
          >
            Get Started with Turbo
          </button>
        </div>
      </section>
    </div>
  );
}