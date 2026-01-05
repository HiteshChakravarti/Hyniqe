import { motion } from 'motion/react';
import { Brain, Zap, Shield, Users, TrendingUp, Clock, Sparkles, Network } from 'lucide-react';

const features = [
  {
    id: 'brain-ai',
    title: 'Brain AI',
    description: 'Central intelligence that learns from every interaction and grows smarter with your business.',
    icon: Brain,
    color: '#a78bfa',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'instant-automation',
    title: 'Instant Automation',
    description: 'Set up workflows in seconds. Your AI employees handle repetitive tasks automatically.',
    icon: Zap,
    color: '#facc15',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'enterprise-security',
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC2 compliant, and GDPR ready. Your data stays protected.',
    icon: Shield,
    color: '#34d399',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    description: 'Your AI employees work together seamlessly, sharing context and insights across tasks.',
    icon: Users,
    color: '#60a5fa',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'predictive-insights',
    title: 'Predictive Insights',
    description: 'AI-powered analytics that forecast trends and suggest optimizations before you ask.',
    icon: TrendingUp,
    color: '#f472b6',
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    id: '24-7-availability',
    title: '24/7 Availability',
    description: 'Never miss an opportunity. Your AI team works around the clock, every day of the year.',
    icon: Clock,
    color: '#fb923c',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 'smart-learning',
    title: 'Continuous Learning',
    description: 'Every task makes your AI smarter. Adapts to your preferences and business patterns.',
    icon: Sparkles,
    color: '#c084fc',
    gradient: 'from-purple-400 to-pink-400',
  },
  {
    id: 'integrations',
    title: 'Universal Integration',
    description: 'Connect with 1000+ tools. Gmail, Slack, Notion, and everything your business uses.',
    icon: Network,
    color: '#22d3ee',
    gradient: 'from-cyan-500 to-cyan-600',
  },
];

export function FeaturesShowcase() {
  return (
    <section className="section-padding relative overflow-hidden bg-gradient-to-b from-white via-purple-50/20 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="mb-4 text-[#18181b]">
            Everything you need to <span className="text-gradient">work smarter</span>
          </h2>
          <p className="text-[#52525b] max-w-2xl mx-auto">
            Powerful features that transform how your business operates. Each capability designed to save you time and amplify results.
          </p>
        </motion.div>

        {/* 3D Motion Tiles Grid - Desktop */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              perspective: '2000px',
            }}
          >
            {/* Asymmetric Grid Layout */}
            <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* Row 1 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="col-span-2"
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[0].gradient} flex items-center justify-center mb-4`}>
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[0].title}</h3>
                  <p className="text-[#a1a1aa]">{features[0].description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[1].gradient} flex items-center justify-center mb-4`}>
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[1].title}</h3>
                  <p className="text-[#a1a1aa]">{features[1].description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[2].gradient} flex items-center justify-center mb-4`}>
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[2].title}</h3>
                  <p className="text-[#a1a1aa]">{features[2].description}</p>
                </div>
              </motion.div>

              {/* Row 2 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[3].gradient} flex items-center justify-center mb-4`}>
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[3].title}</h3>
                  <p className="text-[#a1a1aa]">{features[3].description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[4].gradient} flex items-center justify-center mb-4`}>
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[4].title}</h3>
                  <p className="text-[#a1a1aa]">{features[4].description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="col-span-2"
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[5].gradient} flex items-center justify-center mb-4`}>
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[5].title}</h3>
                  <p className="text-[#a1a1aa]">{features[5].description}</p>
                </div>
              </motion.div>

              {/* Row 3 */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="col-span-2"
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[6].gradient} flex items-center justify-center mb-4`}>
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[6].title}</h3>
                  <p className="text-[#a1a1aa]">{features[6].description}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: 20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="col-span-2"
              >
                <div className="glass-card p-8 rounded-2xl h-full">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${features[7].gradient} flex items-center justify-center mb-4`}>
                    <Network className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl mb-3">{features[7].title}</h3>
                  <p className="text-[#a1a1aa]">{features[7].description}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Tablet: 2 Column Grid */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="glass-card p-6 rounded-2xl h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl mb-3">{feature.title}</h3>
                  <p className="text-[#a1a1aa] text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: Single Column */}
        <div className="md:hidden space-y-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="glass-card p-6 rounded-2xl">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3">{feature.title}</h3>
                <p className="text-[#a1a1aa]">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center mt-16"
        >
          <p className="text-[#a1a1aa] mb-6 max-w-2xl mx-auto">
            These features work together seamlessly, creating an AI workforce that transforms your business operations.
          </p>
          <button className="conic-button conic-purple px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:glow">
            Explore All Features
          </button>
        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}