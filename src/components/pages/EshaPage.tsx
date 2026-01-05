import { motion } from 'motion/react';
import { ArrowLeft, Briefcase, Clock, Target, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function EshaPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: 'auth') => void }) {
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
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-500 to-purple-600 opacity-20 blur-3xl rounded-full" />
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Esha - AI Recruiter"
                className="relative w-full max-w-md mx-auto"
              />
            </motion.div>

            {/* Right: Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
                AI Recruiter
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Meet Esha
              </h1>
              
              <p className="text-xl text-[#a1a1aa] mb-8 leading-relaxed">
                Your tireless recruitment partner who never sleeps. Esha screens thousands of candidates, 
                schedules interviews, and finds top talent 24/7 while you focus on making the final decisions.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-purple-400">95%</div>
                  <div className="text-sm text-[#71717a]">Accuracy Rate</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-purple-400">24/7</div>
                  <div className="text-sm text-[#71717a]">Always Active</div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:scale-105 transition-all hover:glow"
              >
                Start Recruiting with Esha
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-padding bg-[#131318]/30">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">What Esha Can Do</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Briefcase,
                title: 'Screen Candidates',
                description: 'Automatically review resumes and filter qualified candidates based on your criteria.',
              },
              {
                icon: Clock,
                title: 'Schedule Interviews',
                description: 'Coordinate with candidates and your team to set up interview times seamlessly.',
              },
              {
                icon: Target,
                title: 'Source Talent',
                description: 'Actively search for candidates across LinkedIn, job boards, and databases.',
              },
              {
                icon: TrendingUp,
                title: 'Track Pipeline',
                description: 'Monitor recruitment metrics and provide insights on hiring effectiveness.',
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
                <capability.icon className="w-10 h-10 text-purple-400 mb-4" />
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
                title: 'Startups',
                description: 'Hire your first team members without a dedicated HR department.',
              },
              {
                title: 'Growing Companies',
                description: 'Scale your hiring process as you expand rapidly.',
              },
              {
                title: 'Enterprises',
                description: 'Handle high-volume recruitment with consistency and speed.',
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
      <section className="section-padding bg-gradient-to-b from-transparent to-purple-500/5">
        <div className="container-custom text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to supercharge your recruitment?
          </h2>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
            Let Esha handle the heavy lifting while you focus on building amazing teams.
          </p>
          <button 
            onClick={() => onNavigate?.('auth')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:scale-105 transition-all hover:glow"
          >
            Get Started with Esha
          </button>
        </div>
      </section>
    </div>
  );
}
