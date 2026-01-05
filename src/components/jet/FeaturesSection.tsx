import { Zap, Shield, Globe, BarChart3, Code, Sparkles } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { FeatureCard } from './FeatureCard';

export function JetFeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Deployment',
      description: 'Deploy your entire AI workforce in seconds. No setup, no configuration needed.',
      bullets: [
        'One-click activation',
        'Instant AI employee onboarding',
        'Pre-trained and ready to work'
      ]
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'Bank-level encryption and compliance to keep your data safe and secure.',
      bullets: [
        'End-to-end encryption',
        'SOC 2 Type II certified',
        'GDPR & CCPA compliant'
      ]
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Integrate with your favorite tools seamlessly. API-first architecture.',
      bullets: [
        '100+ integrations available',
        'REST & GraphQL APIs',
        'Webhook support'
      ]
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track performance, monitor tasks, and optimize your AI workforce in real-time.',
      bullets: [
        'Live performance dashboards',
        'Custom reports & insights',
        'AI-powered recommendations'
      ]
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#F7FF5C]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] relative z-10">
        <SectionHeader
          overline="ACCELERATE YOUR BUSINESS"
          title="Everything you need to succeed with AI"
          description="Built for speed, security, and scale. HYNIQE gives you the complete toolkit to deploy and manage your AI workforce."
          centered
          className="mb-20"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Bottom CTA card */}
        <div className="mt-12 bg-gradient-to-br from-[#F7FF5C]/10 to-[#4AF2FF]/10 border border-[#F7FF5C]/20 rounded-3xl p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#050509]" />
            </div>
            <h3 className="heading-h2 text-white mb-4">
              Ready to supercharge your productivity?
            </h3>
            <p className="body-l text-[#A6A7B0] mb-8">
              Join hundreds of companies already using HYNIQE to transform their operations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="bg-[#F7FF5C] hover:bg-[#FFFF8F] text-[#050509] px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-[#F7FF5C]/20 hover:shadow-[#F7FF5C]/40">
                Start Free Trial
              </button>
              <button className="border border-[#222633] text-white hover:border-[#F7FF5C] hover:bg-[#F7FF5C]/5 px-6 py-3 rounded-lg font-medium transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
