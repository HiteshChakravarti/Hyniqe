import { motion } from 'motion/react';
import { ArrowLeft, Instagram, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import niviHero from 'figma:asset/6ca3c7eba56e916e325f4e71f237f5270d789a04.png';
import niviDescription from 'figma:asset/89921c30a16d5e3dfb1af28281f4146c2be356ea.png';
import niviFeatures from 'figma:asset/b74dc38f14b2631679c9cb8f1fb9bb0fba674b17.png';
import niviBanner1 from 'figma:asset/f8bd5471e6cc5a643a99bffd2dae88a3924e6c1c.png';
import niviBanner2 from 'figma:asset/e4eb98af7b0335a9aa26f6b695d2e170b9debcf2.png';
import niviBanner3 from 'figma:asset/ca4804eab57808f09c3cebf24e6a94bca295198a.png';
import niviLinkedIn from 'figma:asset/446843c1504def2fa24bf77eb712a6e2d7d94eac.png';
import niviComment from 'figma:asset/268b9820de8fef5f5d7f3e957b67e144d469674a.png';
import niviBrandAnalysis from 'figma:asset/3840f70a457c5003587ab27ff3c39e931428c042.png';
import niviIntegration from 'figma:asset/b510da29d6995482ac67e7388ea42e39c3ed2985.png';
import niviExpertise from 'figma:asset/baab4bbc72cc1bdb6f8d6f1cae2449d4ff6319d5.png';
import niviBrainAI from 'figma:asset/9928876856d2d235408669eab167190e46f39bc9.png';
import niviPowerUps from 'figma:asset/a673188beb041a348629d6fda985ebe7099a8216.png';
import niviAutomation from 'figma:asset/a17189f83a5da4dea7bda072ffe764ab90645e71.png';
import niviTasks from 'figma:asset/e002257be1ecfc74b7753e241303f0dd835b9f43.png';
import niviMultiplePowerUps from 'figma:asset/21ed702de6adaa8d9ddb95875c407a04934f3e0f.png';
import niviKnowledge from 'figma:asset/72479c8b54d2550fa710706f71ef536a9b7904ad.png';
import niviFinalCTA from 'figma:asset/69a94736c68ee6536c823465bc61e8d1cc7dc498.png';

export function NiviPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: 'auth') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a8a] via-[#1e40af] to-[#0a0a0f] pt-20"> {/* Changed from black to blue gradient */}
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
              <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500 to-cyan-600 opacity-20 blur-3xl rounded-full" />
              <img
                src={niviHero}
                alt="Nivi - Social Media Manager"
                className="relative w-full max-w-md mx-auto"
              />
            </motion.div>

            {/* Right: Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-6">
                Social Media Manager
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
                Meet Nivi
              </h1>
              
              <p className="text-xl text-[#a1a1aa] mb-8 leading-relaxed">
                Your creative social media expert who keeps your brand active and engaging across all platforms. 
                Nivi creates content, schedules posts, engages with your audience, and grows your community 24/7.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-cyan-400">96%</div>
                  <div className="text-sm text-[#71717a]">Engagement Rate</div>
                </div>
                <div className="glass-card p-4">
                  <div className="text-3xl font-bold text-cyan-400">50+</div>
                  <div className="text-sm text-[#71717a]">Posts/Week</div>
                </div>
              </div>

              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full hover:scale-105 transition-all hover:glow"
              >
                Boost Your Social Presence with Nivi
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <img
              src={niviDescription}
              alt="Meet NIVI - Your Social Media Assistant"
              className="w-full rounded-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Full-Width Banner 1 - Always Available */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviBanner1}
            alt="Available at all times"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 2 - Content Calendar */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviBanner2}
            alt="Build a social media content calendar"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 3 - Viral Instagram Script */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviBanner3}
            alt="Write viral Instagram reel scripts"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 4 - LinkedIn Post Generation */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviLinkedIn}
            alt="NIVI, generate a viral LinkedIn post"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 5 - Comment Reply */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviComment}
            alt="NIVI, reply to this comment"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 6 - Brand Analysis */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviBrandAnalysis}
            alt="NIVI, what do you think my brand currently lacks on social media?"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 7 - Integration Features */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviIntegration}
            alt="With NIVI, you can generate images, connect to platforms, and do social media tasks in seconds"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 8 - Savvy Social Effortless */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviExpertise}
            alt="Savvy. Social. Effortless. AI-powered social media magic with Nivi."
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 9 - Brain AI */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviBrainAI}
            alt="Empowered by your Brain AI - Your unique knowledge combined with NIVI's expertise"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 10 - Power-Ups */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviPowerUps}
            alt="Unlock the full potential of NIVI with our Power-Ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 11 - Automation */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviAutomation}
            alt="Automate your social media tasks with NIVI"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 12 - Thousands of Tasks */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviTasks}
            alt="NIVI can complete thousands of social media tasks"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 13 - Multiple Power-Ups */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviMultiplePowerUps}
            alt="NIVI can connect with multiple unique power-ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner 14 - Use Your Knowledge */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviKnowledge}
            alt="NIVI can use your knowledge across all your tasks"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Capabilities */}
      <section className="section-padding bg-[#131318]/30">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">What Nivi Can Do</h2>
          
          {/* Features Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto mb-16"
          >
            <img
              src={niviFeatures}
              alt="NIVI Features - Social Media Management"
              className="w-full rounded-2xl"
            />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Create Content',
                description: 'Generate engaging posts, captions, and visuals tailored to your brand voice.',
              },
              {
                icon: Calendar,
                title: 'Schedule Posts',
                description: 'Plan and publish content at optimal times across all social platforms.',
              },
              {
                icon: Instagram,
                title: 'Engage Audience',
                description: 'Respond to comments, messages, and mentions to build community.',
              },
              {
                icon: TrendingUp,
                title: 'Grow Following',
                description: 'Analyze trends, optimize content, and expand your reach organically.',
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
                <capability.icon className="w-10 h-10 text-cyan-400 mb-4" />
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
                title: 'Brands',
                description: 'Build a loyal community and increase brand awareness across platforms.',
              },
              {
                title: 'Creators',
                description: 'Focus on creating while Nivi handles posting and engagement.',
              },
              {
                title: 'Agencies',
                description: 'Manage multiple client accounts efficiently and consistently.',
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

      {/* Full-Width Banner 15 - Final CTA */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={niviFinalCTA}
            alt="NIVI - Your social media manager, on AI. BUY NOW"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="container-custom text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to dominate social media?
          </h2>
          <p className="text-xl text-[#a1a1aa] mb-8 max-w-2xl mx-auto">
            Let Nivi amplify your brand voice and grow your community while you focus on business.
          </p>
          <button 
            onClick={() => onNavigate?.('auth')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full hover:scale-105 transition-all hover:glow"
          >
            Get Started with Nivi
          </button>
        </div>
      </section>
    </div>
  );
}
