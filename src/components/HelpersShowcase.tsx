import { motion } from 'motion/react';
import { MessageSquare, Calendar, TrendingUp, Users, Sparkles } from 'lucide-react';

// Import helper images
import niviImage from 'figma:asset/ff2e3055da8953b992a6fa52f5e76883918b4019.png';
import eshaImage from 'figma:asset/4a1ee8f26daeb0fc6f5f212c6612cc4716e18f27.png';
import orinImage from 'figma:asset/0bf6075a7fa326b81bcfd9c6b02e2db02eab39b0.png';

interface HelpersShowcaseProps {
  onNavigate?: (page: string) => void;
}

export function HelpersShowcase({ onNavigate }: HelpersShowcaseProps = {}) {
  const showcaseCards = [
    {
      id: 'nivi',
      name: 'Nivi',
      title: 'Nivi, help me prepare for today\'s meetings',
      description: 'Boost productivity with AI. Streamline business processes with daily summaries based on your emails and calendar to keep your schedule on track.',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-gradient-to-br from-cyan-500/90 to-cyan-600/90',
      icon: <Calendar className="w-6 h-6" />,
      image: niviImage,
      size: 'large',
    },
    {
      id: 'esha',
      name: 'Esha',
      title: 'Esha, find candidates for the new role',
      description: 'Revolutionize hiring with AI recruiting. Screen resumes, schedule interviews, and identify top talent automatically, saving your HR team countless hours.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-500/90 to-purple-600/90',
      icon: <Users className="w-6 h-6" />,
      image: eshaImage,
      size: 'medium',
    },
    {
      id: 'orin',
      name: 'Orin',
      title: 'Orin, analyze this month\'s performance',
      description: 'Get instant insights with AI data analysis. Transform raw data into actionable intelligence with automated reporting and trend detection.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-green-500/90 to-green-600/90',
      icon: <TrendingUp className="w-6 h-6" />,
      image: orinImage,
      size: 'medium',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-[#18181b] mb-6">
            Automates work.<br />Even while you sleep.
          </h2>
          <p className="text-[#52525b] text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Let your AI helpers handle repetitive tasks—creating content, responding to messages, and managing workflows—so your team stays focused on strategy, not busywork.
          </p>
        </motion.div>

        {/* Grid Layout */}
        <div className="max-w-6xl mx-auto">
          {/* Top Large Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <div className={`${showcaseCards[0].bgColor} backdrop-blur-xl rounded-3xl p-8 lg:p-12 min-h-[400px] lg:min-h-[450px] relative overflow-hidden border border-white/20 shadow-2xl`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 h-full flex items-start">
                {/* Text Content - Top Left */}
                <div className="text-white space-y-3 max-w-md">
                  <h3 className="text-3xl lg:text-4xl font-bold leading-tight">
                    {showcaseCards[0].title}
                  </h3>
                  <p className="text-white/90 text-sm lg:text-base leading-relaxed">
                    {showcaseCards[0].description}
                  </p>
                </div>
              </div>

              {/* Image - Bottom Right with 3D Edge Overflow Effect */}
              <div className="absolute bottom-0 right-0 -mb-6 -mr-6">
                <motion.div
                  initial={{ opacity: 0, x: 30, y: 30 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative transform-gpu"
                >
                  <img 
                    src={showcaseCards[0].image} 
                    alt={showcaseCards[0].name}
                    className="w-64 h-80 lg:w-80 lg:h-[420px] object-contain drop-shadow-2xl"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Two Cards Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {showcaseCards.slice(1, 3).map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              >
                <div className={`${card.bgColor} backdrop-blur-xl rounded-3xl p-8 min-h-[450px] lg:min-h-[500px] relative overflow-hidden border border-white/20 shadow-2xl flex flex-col`}>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    {/* Top - Text Content - Constrained to Left */}
                    <div className="text-white space-y-3 max-w-xs">
                      <h3 className="text-2xl lg:text-3xl font-bold leading-tight text-left">
                        {card.title}
                      </h3>
                      <p className={`text-white/90 leading-relaxed text-left ${index === 0 ? 'text-xs lg:text-sm' : 'text-sm lg:text-base'}`}>
                        {card.description}
                      </p>
                    </div>

                    {/* Bottom - Image positioned at bottom right edge with 3D overflow effect */}
                    <div className="absolute bottom-0 right-0 -mb-6 -mr-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                        className="relative transform-gpu"
                      >
                        <img 
                          src={card.image} 
                          alt={card.name}
                          className="w-48 h-64 lg:w-56 lg:h-72 object-contain drop-shadow-2xl"
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}