import { motion } from 'motion/react';
import { Users, CheckCircle, Activity, Shield } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Role-based Helpers',
    description: 'Each AI has a job description, responsibilities, and limits.',
  },
  {
    icon: CheckCircle,
    title: 'Human-in-the-loop approvals',
    description: 'Critical actions require confirmation—AI moves fast, humans stay in control.',
  },
  {
    icon: Activity,
    title: 'Real-time monitoring',
    description: 'Track activity, outputs, token usage, and performance per Helper.',
  },
  {
    icon: Shield,
    title: 'Enterprise-ready security',
    description: 'SOC2-aligned, encrypted, permission-based access.',
  },
];

export function Features() {
  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="mb-6 text-[#18181b]">
            Built for <span className="text-gradient">modern teams</span>
          </h2>
        </motion.div>

        {/* Features Grid - Matching Attached Image Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              {/* Icon - Centered at top */}
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa]/20 to-[#60a5fa]/20 border border-[#a78bfa]/30 flex items-center justify-center group-hover:scale-110 group-hover:border-[#a78bfa]/50 transition-all">
                  <feature.icon className="w-8 h-8 text-[#a78bfa]" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-3 text-[#18181b] group-hover:text-[#a78bfa] transition-colors">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-[#52525b] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 flex flex-wrap justify-center items-center gap-12"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-[#18181b] mb-1">99.9%</div>
            <div className="text-sm text-[#71717a]">Uptime SLA</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-[#d4d4d8]" />
          <div className="text-center">
            <div className="text-3xl font-bold text-[#18181b] mb-1">24/7</div>
            <div className="text-sm text-[#71717a]">Support</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-[#d4d4d8]" />
          <div className="text-center">
            <div className="text-3xl font-bold text-[#18181b] mb-1">SOC 2</div>
            <div className="text-sm text-[#71717a]">Certified</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}