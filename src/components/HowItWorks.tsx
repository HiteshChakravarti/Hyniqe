import { motion } from 'motion/react';
import { UserPlus, Zap, TrendingUp, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Sign Up',
    description: '30 seconds',
    detail: 'Create your account and get instant access to your AI workforce.',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Choose Your Team',
    description: 'Pick AI employees',
    detail: 'Select from specialized AI helpers based on your business needs.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Deploy & Work',
    description: 'Start immediately',
    detail: 'Your AI team starts working instantly. No training required.',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Achieve Success',
    description: 'See results',
    detail: 'Monitor your AI team\'s performance and achieve your business goals.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-[#131318]/30">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <h2 className="mb-4">Get started in 4 simple steps</h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            Deploy your AI workforce in minutes, not months. No technical expertise required.
          </p>
        </motion.div>

        {/* Steps - Desktop: Horizontal, Mobile: Vertical */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 relative">
          {/* Connection Lines (Desktop only) */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] origin-left"
              style={{ width: 'calc(100% - 200px)', marginLeft: '100px' }}
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="glass-card p-8 hover:bg-[#1a1a24]/60 transition-all group cursor-pointer">
                {/* Number Badge */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#60a5fa] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <step.icon className="w-8 h-8 text-[#a78bfa]" />
                </div>

                {/* Content */}
                <h3 className="text-xl mb-2">{step.title}</h3>
                <div className="text-[#34d399] font-medium mb-3">{step.description}</div>
                <p className="text-[#a1a1aa]">{step.detail}</p>
              </div>

              {/* Mobile Connection Line */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center py-4">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-[#a78bfa] to-[#34d399]" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <button className="px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:glow">
            Start Your Free Trial
          </button>
          <p className="text-sm text-[#71717a] mt-4">No credit card required • 14-day free trial</p>
        </motion.div>
      </div>
    </section>
  );
}