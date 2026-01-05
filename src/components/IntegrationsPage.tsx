import { 
  Slack, 
  Mail, 
  Linkedin, 
  Calendar, 
  Facebook, 
  Instagram, 
  FileText, 
  Database, 
  Chrome, 
  BarChart, 
  Calculator, 
  Github, 
  Zap,
  Users,
  CheckCircle,
  Activity,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import heroBanner from 'figma:asset/fcd039380396532ff03cfd293141321e9d5545c9.png';
import { IntegrationHubOrbital } from './IntegrationHubOrbital';
import { AnimatedCompactNumber, AnimatedPercentage } from './AnimatedNumber';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
}

interface IntegrationsPageProps {
  onBack?: () => void;
  onNavigate?: (page: 'auth') => void;
}

export function IntegrationsPage({ onBack, onNavigate }: IntegrationsPageProps) {
  const integrations: Integration[] = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send and receive emails directly through your AI helpers, enabling professional communication.',
      icon: <Mail className="w-8 h-8" />,
      color: '#EA4335',
      tags: ['Email', 'Communication', 'Productivity']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Sync posts, auto-publish content, and manage your LinkedIn presence effortlessly.',
      icon: <Linkedin className="w-8 h-8" />,
      color: '#0A66C2',
      tags: ['Social Media', 'Recruitment', 'Networking']
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Keep your events, meetings synced. Never miss a meeting or deadline again.',
      icon: <Calendar className="w-8 h-8" />,
      color: '#4285F4',
      tags: ['Calendar', 'Scheduling', 'Time Management']
    },
    {
      id: 'facebook',
      name: 'Facebook & Instagram',
      description: 'Build content, post, track engagement on both platforms from one place.',
      icon: <div className="flex gap-1"><Facebook className="w-6 h-6" /><Instagram className="w-6 h-6" /></div>,
      color: '#1877F2',
      tags: ['Social Media', 'Content', 'Marketing']
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Organize your projects, tasks, and notes. Complete workspace integration.',
      icon: <FileText className="w-8 h-8" />,
      color: '#000000',
      tags: ['Documentation', 'Project Management', 'Notes']
    },
    {
      id: 'gdrive',
      name: 'Google Drive',
      description: 'Save meetings directly to Google Drive, ensuring seamless file access.',
      icon: <Database className="w-8 h-8" />,
      color: '#34A853',
      tags: ['Storage', 'Files', 'Cloud']
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      description: 'Sync emails and collaborate from Microsoft Suite. Teams, Outlook, and more.',
      icon: <Chrome className="w-8 h-8" />,
      color: '#00A4EF',
      tags: ['Email', 'Productivity', 'Collaboration']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Track chats and tasks with full personal accountability and team sync.',
      icon: <Slack className="w-8 h-8" />,
      color: '#4A154B',
      tags: ['Communication', 'Team Chat', 'Notifications']
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      description: 'Sync marketing data with your analytics and personas to optimize campaigns.',
      icon: <BarChart className="w-8 h-8" />,
      color: '#E37400',
      tags: ['Analytics', 'Data', 'Insights']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Track expenses, create invoices, and manage financial data seamlessly.',
      icon: <Calculator className="w-8 h-8" />,
      color: '#2CA01C',
      tags: ['Finance', 'Accounting', 'Invoicing']
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Connect repositories, track issues, and automate development workflows.',
      icon: <Github className="w-8 h-8" />,
      color: '#181717',
      tags: ['Development', 'Version Control', 'Automation']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect 5000+ apps and automate workflows with powerful integrations.',
      icon: <Zap className="w-8 h-8" />,
      color: '#FF4A00',
      tags: ['Automation', 'Workflow', 'API']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <section className="relative pt-20 pb-12 overflow-hidden bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full"
        >
          {/* Hero Banner Image - Full Width */}
          <div className="relative w-full">
            <img
              src={heroBanner}
              alt="HYNÍQÉ integrations - All your AI helpers ready to connect with your tools"
              className="w-full h-auto object-cover min-h-[400px] md:min-h-[500px] lg:min-h-[600px]"
            />
          </div>

          {/* CTA Button Below Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mt-8 px-6"
          >
            <button 
              onClick={() => onNavigate?.('auth')}
              className="px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:shadow-lg font-medium text-lg"
            >
              Get HYNÍQÉ
            </button>
            <p className="text-[#52525b] mt-4 text-lg">
              Connect your favorite apps and let your AI employees work seamlessly across your entire tech stack.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 1: Platform Capabilities Stats Bar */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-purple-600">
                <AnimatedCompactNumber value={5} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">AI Helpers</div>
              <div className="text-xs text-[#a1a1aa] mt-1">(and growing)</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-orange-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-orange-600">
                <AnimatedCompactNumber value={12} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Integrations</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-cyan-600">
                <AnimatedCompactNumber value={50} showPlus />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Power-Ups</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="glass-card p-6 text-center bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm"
            >
              <div className="text-4xl font-bold mb-2 text-green-600">
                <AnimatedPercentage value={99.9} decimals={1} />
              </div>
              <div className="text-sm text-[#71717a] font-medium">Platform Uptime</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* One Click Section */}
      <section className="py-20 bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-[#18181b]">
                One click.{' '}
                <span className="text-gradient">Fully synced.</span>
              </h2>
              <p className="text-[#52525b] text-lg mb-8 leading-relaxed">
                HYNÍQÉ integrations make your work simple and effortless. With just one click, all of your tools connect to your favorite tools, Zapier, Microsoft, and more. Our AI employees work 24/7 to keep your integrations fresh, up-to-date, and ready to deliver exceptional results for your team and projects.
              </p>
              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:shadow-lg font-medium"
              >
                Get Started
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg rounded-2xl p-8 lg:p-12">
                <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200">
                    <Calendar className="w-6 h-6 text-[#4285F4]" />
                    <span className="font-medium text-[#18181b]">Google Calendar</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                      <p className="text-sm text-[#71717a] mb-1">Today, 2:00 PM</p>
                      <p className="font-medium text-[#18181b]">Team Sync Meeting</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                      <p className="text-sm text-[#71717a] mb-1">Tomorrow, 10:00 AM</p>
                      <p className="font-medium text-[#18181b]">Client Presentation</p>
                    </div>
                    <button className="w-full py-3 bg-[#a78bfa] text-white rounded-lg font-medium hover:bg-[#a78bfa]/90 transition-colors shadow-sm">
                      + Add to calendar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="section-padding bg-gradient-to-b from-white to-purple-50/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-6 text-[#18181b]">
              What integrations does{' '}
              <span className="text-gradient">HYNÍQÉ</span> offer?
            </h2>
            <p className="text-[#52525b] text-lg max-w-2xl mx-auto">
              Connect with the tools you already use and love. Our AI employees integrate seamlessly with your workflow.
            </p>
          </motion.div>
        </div>

        {/* 3D Integration Hub Visualization - FULL WIDTH */}
        <div className="mb-16">
          <IntegrationHubOrbital />
        </div>

        <div className="container-custom">
          {/* Separator */}
          <div className="mb-16 border-t border-purple-100"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm hover:shadow-md rounded-2xl p-6 hover:border-purple-200 transition-all group cursor-pointer h-full"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-white"
                    style={{ backgroundColor: integration.color }}
                  >
                    {integration.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl mb-2 text-[#18181b]">{integration.name}</h3>
                  </div>
                </div>
                <p className="text-[#52525b] mb-4 leading-relaxed">
                  {integration.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {integration.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-50 text-[#71717a] text-sm rounded-full border border-purple-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-[#52525b] mb-6">
              Don&apos;t see your tool? We&apos;re constantly adding new integrations.
            </p>
            <button className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-purple-200 text-[#18181b] rounded-full transition-all hover:scale-105 hover:border-purple-300 font-medium shadow-sm">
              Request an Integration
            </button>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: Built for modern teams - Operational Credibility */}
      <section className="section-padding bg-gradient-to-b from-white to-purple-50/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-6 text-[#18181b]">
              Built for{' '}
              <span className="text-gradient">modern teams</span>
            </h2>
            <p className="text-[#52525b] text-lg max-w-2xl mx-auto">
              Enterprise-grade features that keep your team productive, secure, and in control.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Role-based Helpers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm rounded-2xl p-8"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl mb-3 text-[#18181b]">Role-based Helpers</h3>
              <p className="text-[#52525b] leading-relaxed">
                Each AI has a job description, responsibilities, and limits.
              </p>
            </motion.div>

            {/* Human-in-the-loop approvals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm border border-orange-100 shadow-sm rounded-2xl p-8"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                <CheckCircle className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl mb-3 text-[#18181b]">Human-in-the-loop approvals</h3>
              <p className="text-[#52525b] leading-relaxed">
                Critical actions require confirmation—AI moves fast, humans stay in control.
              </p>
            </motion.div>

            {/* Real-time monitoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-sm rounded-2xl p-8"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-2xl mb-3 text-[#18181b]">Real-time monitoring</h3>
              <p className="text-[#52525b] leading-relaxed">
                Track activity, outputs, token usage, and performance per Helper.
              </p>
            </motion.div>

            {/* Enterprise-ready security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm border border-green-100 shadow-sm rounded-2xl p-8"
            >
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl mb-3 text-[#18181b]">Enterprise-ready security</h3>
              <p className="text-[#52525b] leading-relaxed">
                SOC2-aligned, encrypted, permission-based access.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-b from-purple-50/30 to-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto bg-white/80 backdrop-blur-sm border border-purple-100 shadow-lg rounded-3xl p-12"
          >
            <h2 className="mb-6 text-[#18181b]">
              Ready to connect{' '}
              <span className="text-gradient">everything?</span>
            </h2>
            <p className="text-[#52525b] text-lg mb-8">
              Join thousands of teams using HYNÍQÉ to automate their workflows and boost productivity across all their favorite tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-[#a78bfa] hover:bg-[#a78bfa]/90 text-white rounded-full transition-all hover:scale-105 hover:shadow-lg font-medium"
              >
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-purple-200 text-[#18181b] rounded-full transition-all hover:scale-105 hover:border-purple-300 font-medium">
                View All Integrations
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}