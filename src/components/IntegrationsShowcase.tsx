import { motion } from 'motion/react';
import { Facebook, Instagram, Mail, Calendar, Linkedin } from 'lucide-react';

// Import phone mockup
import phoneMockup from 'figma:asset/8704a2991fd76089356b51cce139f30297f22922.png';

export function IntegrationsShowcase() {
  const integrationIcons = [
    {
      icon: <Facebook className="w-8 h-8 text-[#1877F2]" fill="#1877F2" />,
      name: 'Facebook',
      bgColor: 'bg-white'
    },
    {
      icon: <Instagram className="w-8 h-8 text-transparent bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] bg-clip-text" />,
      name: 'Instagram',
      bgColor: 'bg-white',
      gradient: true
    },
    {
      icon: <Mail className="w-8 h-8 text-[#EA4335]" />,
      name: 'Gmail',
      bgColor: 'bg-white'
    },
    {
      icon: <Calendar className="w-8 h-8 text-[#4285F4]" />,
      name: 'Calendar',
      bgColor: 'bg-white'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M7 22h10c1.103 0 2-.897 2-2V8l-6-6H7c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2z" fill="#0364B8"/>
          <path d="M15 2v4c0 1.103.897 2 2 2h4" fill="#0078D4"/>
        </svg>
      ),
      name: 'Outlook',
      bgColor: 'bg-white'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12.01 1.91l-8.93 8.92v9.26h6.54V13.5h4.79v6.59h6.54v-9.26z" fill="#4285F4"/>
          <path d="M12.01 1.91L3.08 10.83h8.93z" fill="#EA4335"/>
          <path d="M12.01 1.91l8.93 8.92H12.01z" fill="#34A853"/>
          <path d="M3.08 10.83v9.26h6.54v-6.59z" fill="#FBBC04"/>
        </svg>
      ),
      name: 'Drive',
      bgColor: 'bg-white'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M4 4h6v6H4V4zm0 10h6v6H4v-6zM14 4h6v6h-6V4zm0 10h6v6h-6v-6z" fill="currentColor" className="text-gray-900"/>
        </svg>
      ),
      name: 'Notion',
      bgColor: 'bg-white'
    },
    {
      icon: <Linkedin className="w-8 h-8 text-[#0A66C2]" fill="#0A66C2" />,
      name: 'LinkedIn',
      bgColor: 'bg-white'
    }
  ];

  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden relative">
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
          {/* Left Side - Text and Icons */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-gray-900 text-4xl lg:text-5xl xl:text-6xl leading-tight">
                Integrates with your<br />favorite tools.
              </h2>
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed max-w-lg">
                <span className="text-[#7C3AED]">Integrations.</span> Streamline business processes by bringing your favorite tools, systems, and AI employees together. AI for business makes working with integrations and existing systems easier than ever.
              </p>
            </div>

            {/* Integration Icons Grid */}
            <div className="grid grid-cols-4 gap-4 pt-4 max-w-sm">
              {integrationIcons.map((integration, index) => (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group"
                >
                  <div className={`${integration.bgColor} rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex items-center justify-center aspect-square shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-100`}>
                    {integration.gradient ? (
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                        <Instagram className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {integration.icon}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Integration Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative z-10"
            >
              <img 
                src={phoneMockup} 
                alt="Brain AI Integrations Interface"
                className="w-full max-w-[300px] lg:max-w-[400px] xl:max-w-[450px] h-auto drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}