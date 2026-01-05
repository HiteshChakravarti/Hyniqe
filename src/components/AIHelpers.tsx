import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DockNavigation } from './DockNavigation';
import { RollingText } from './RollingText';
import { Carousel3D } from './Carousel3D';
import { AnimatedNumber, AnimatedPercentage } from './AnimatedNumber';
import teamHeroImage from 'figma:asset/76a919327c9e4ccc01f34737da3d1f87b067c6f0.png';
import eshaImage from 'figma:asset/b434b05361034eca13601b9d522dffa1cc5229d9.png';
import karoImage from 'figma:asset/d45ed71bf1590295ce00ae8d744117adb1ec7479.png';
import niviImage from 'figma:asset/0ad1d2f5ccad00c11a5650031ed9406df751a055.png';
import orinImage from 'figma:asset/48fba9f6f9bd14e6878f277860141b89e0a39432.png';
import turboImage from 'figma:asset/4b33d5b78096e6f6fd5a8e3c58afc35665ef97b0.png';

const aiHelpers = [
  {
    id: 'esha',
    name: 'Esha',
    role: 'AI Recruiter',
    description: 'Screen candidates, schedule interviews, and find top talent 24/7. Esha automates your entire recruitment pipeline.',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    stats: { tasks: 24, accuracy: '95%', status: 'Online' },
    image: eshaImage,
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success AI',
    description: 'Handle support tickets, onboard users, and maintain relationships. Karo ensures your customers are always delighted.',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    stats: { tasks: 32, accuracy: '98%', status: 'Online' },
    image: karoImage,
  },
  {
    id: 'nivi',
    name: 'Nivi',
    role: 'Social Media Manager',
    description: 'Create content, schedule posts, and engage with your audience. Nivi keeps your brand active across all platforms.',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
    stats: { tasks: 41, accuracy: '96%', status: 'Online' },
    image: niviImage,
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    description: 'Analyze trends, generate insights, and create reports. Orin transforms your data into actionable intelligence.',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    stats: { tasks: 18, accuracy: '99%', status: 'Online' },
    image: orinImage,
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    description: 'Qualify leads, follow up prospects, and close deals. Turbo supercharges your sales pipeline with AI precision.',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    stats: { tasks: 27, accuracy: '94%', status: 'Online' },
    image: turboImage,
  },
];

export function AIHelpers({ onNavigate }: { onNavigate?: (helper: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % aiHelpers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const navigate = (newIndex: number) => {
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveIndex(newIndex);
    if (onNavigate) {
      onNavigate(aiHelpers[newIndex].id);
    }
  };

  const activeHelper = aiHelpers[activeIndex];

  return (
    <section id="ai-employees" className="section-padding relative overflow-hidden bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="mb-4">
            Meet your <span className="text-gradient">AI employees</span>
          </h2>
          <p className="text-text-tertiary max-w-2xl mx-auto">
            Five specialized AI teammates ready to transform your business operations. Each one expertly trained for their role.
          </p>
        </motion.div>

        {/* Desktop & Mobile: 3D Carousel */}
        <div className="mb-16 lg:mb-24">
          <Carousel3D items={aiHelpers} onNavigate={onNavigate} />
        </div>

        {/* macOS Dock Navigation - Desktop Only */}
        <div className="hidden lg:block">
          <DockNavigation onNavigate={(helperId) => {
            if (onNavigate) {
              onNavigate(helperId);
            }
          }} />
        </div>

        {/* Team Hero Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 lg:mt-32 -mx-4 lg:-mx-0"
        >
          <div className="relative rounded-none lg:rounded-3xl overflow-hidden">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-orange-500 to-cyan-500 opacity-50 blur-3xl"></div>
            
            {/* Image Container */}
            <div className="relative bg-gradient-to-br from-gray-900 to-black p-0 lg:p-1 lg:rounded-3xl">
              <img
                src={teamHeroImage}
                alt="HYNÍQÉ AI Team - Esha, Turbo, and Karo ready to work"
                className="w-full h-auto lg:rounded-2xl object-cover min-h-[400px] lg:min-h-[600px]"
              />
            </div>

            {/* Overlay Text */}
            <div className="absolute inset-0 flex items-end justify-center pb-12 lg:pb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center mx-4"
              >
                {/* Conic Gradient Border Wrapper */}
                <div 
                  className="inline-block rounded-[24px] p-[3px]"
                  style={{
                    background: 'conic-gradient(from 0deg, #a78bfa 0deg, #22d3ee 90deg, #34d399 180deg, #fb923c 270deg, #a78bfa 360deg)',
                  }}
                >
                  <div className="glass-card px-8 py-4 lg:px-16 lg:py-8 rounded-[21px]">
                    <h3 className="text-2xl lg:text-4xl text-text-primary mb-2">Your AI Dream Team</h3>
                    <p className="text-text-secondary text-base lg:text-xl">Ready to transform your business, one task at a time</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}