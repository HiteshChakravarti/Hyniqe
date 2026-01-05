import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight } from 'lucide-react';

const aiHelpers = [
  {
    id: 'estel',
    name: 'Estel',
    role: 'AI Recruiter',
    color: '#a78bfa',
    gradient: 'from-purple-500 to-purple-600',
    image: 'figma:asset/b434b05361034eca13601b9d522dffa1cc5229d9.png',
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success AI',
    color: '#fb923c',
    gradient: 'from-orange-500 to-orange-600',
    image: 'figma:asset/d45ed71bf1590295ce00ae8d744117adb1ec7479.png',
  },
  {
    id: 'niki',
    name: 'Niki',
    role: 'Social Media Manager',
    color: '#22d3ee',
    gradient: 'from-cyan-500 to-cyan-600',
    image: 'figma:asset/0ad1d2f5ccad00c11a5650031ed9406df751a055.png',
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    color: '#34d399',
    gradient: 'from-green-500 to-green-600',
    image: 'figma:asset/48fba9f6f9bd14e6878f277860141b89e0a39432.png',
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    color: '#ef4444',
    gradient: 'from-orange-500 to-red-500',
    image: 'figma:asset/4b33d5b78096e6f6fd5a8e3c58afc35665ef97b0.png',
  },
];

interface MotionTilesHeroProps {
  onNavigate?: (helperId: string) => void;
}

export function MotionTilesHero({ onNavigate }: MotionTilesHeroProps) {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="mb-4">
            Your <span className="text-gradient">AI dream team</span> awaits
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            Five specialized AI employees, each a master of their domain. Click any helper to explore their unique capabilities.
          </p>
        </motion.div>

        {/* 3D Motion Tiles Grid - Desktop */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
            style={{
              perspective: '1500px',
            }}
          >
            {/* Grid with 3D perspective */}
            <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Row 1: Estel & Karo */}
              <motion.div
                initial={{ opacity: 0, y: 50, z: -100 }}
                whileInView={{ opacity: 1, y: 0, z: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="col-start-1"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${aiHelpers[0].color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={aiHelpers[0].image}
                      alt={aiHelpers[0].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{aiHelpers[0].name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{aiHelpers[0].role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${aiHelpers[0].gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, z: -100 }}
                whileInView={{ opacity: 1, y: 0, z: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="col-start-3"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${aiHelpers[1].color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={aiHelpers[1].image}
                      alt={aiHelpers[1].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{aiHelpers[1].name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{aiHelpers[1].role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${aiHelpers[1].gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Row 2: Niki (center) */}
              <motion.div
                initial={{ opacity: 0, y: 50, z: 0 }}
                whileInView={{ opacity: 1, y: 0, z: 50 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="col-start-2"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${aiHelpers[2].color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={aiHelpers[2].image}
                      alt={aiHelpers[2].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{aiHelpers[2].name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{aiHelpers[2].role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${aiHelpers[2].gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Row 3: Orin & Turbo */}
              <motion.div
                initial={{ opacity: 0, y: 50, z: -100 }}
                whileInView={{ opacity: 1, y: 0, z: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="col-start-1"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${aiHelpers[3].color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={aiHelpers[3].image}
                      alt={aiHelpers[3].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{aiHelpers[3].name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{aiHelpers[3].role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${aiHelpers[3].gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50, z: -100 }}
                whileInView={{ opacity: 1, y: 0, z: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="col-start-3"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${aiHelpers[4].color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={aiHelpers[4].image}
                      alt={aiHelpers[4].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{aiHelpers[4].name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{aiHelpers[4].role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${aiHelpers[4].gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden">
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
            {aiHelpers.map((helper, index) => (
              <motion.div
                key={helper.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex-shrink-0 w-[280px] snap-center"
              >
                <div
                  className="glass-card p-6 rounded-2xl"
                  style={{ boxShadow: `0 0 20px ${helper.color}` }}
                >
                  <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden">
                    <ImageWithFallback
                      src={helper.image}
                      alt={helper.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl mb-2">{helper.name}</h3>
                  <p className="text-[#a1a1aa] mb-4">{helper.role}</p>
                  <div className="flex items-center gap-2 text-sm group">
                    <span
                      className={`bg-gradient-to-r ${helper.gradient} text-transparent bg-clip-text`}
                    >
                      Explore capabilities
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-[#a1a1aa] mb-6">
            Each AI employee works 24/7, learns from your business, and gets better every day.
          </p>
          <button className="conic-button conic-purple px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:glow">
            Meet Your Team
          </button>
        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}