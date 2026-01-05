import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Brain,
  Sparkles,
  FileText,
  Database,
  Zap,
  TrendingUp,
  Search,
  Calendar,
  Target,
  Users,
  Mail,
  Globe,
  ChevronRight,
  Check,
  Plus,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  Clock,
  RefreshCw,
  Filter,
  Share2
} from 'lucide-react';
import brainImage from 'figma:asset/a65c8a0877233314994a8eef8d504cbbe3cad6af.png';

interface BrainPageProps {
  onBack: () => void;
  onNavigate?: (page: 'auth') => void;
}

export function BrainPage({ onBack, onNavigate }: BrainPageProps) {
  const [activeTab, setActiveTab] = useState<'businesses' | 'agencies' | 'individuals'>('businesses');

  const features = [
    {
      icon: Upload,
      title: 'Multi-format input',
      description: 'Support for text, webpages, PDFs, CSVs, videos, and YouTube. Supports most common formats.'
    },
    {
      icon: Clock,
      title: 'Continuous improvement',
      description: 'Continuously improves as you add content, questions, and context.'
    },
    {
      icon: Zap,
      title: 'Quick-save functionality',
      description: 'Instantly save knowledge to Brain with just one button.'
    },
    {
      icon: Filter,
      title: 'Selective integration',
      description: 'Choose which apps or Helpers can draw from your Brain.'
    },
    {
      icon: Sparkles,
      title: 'Automatic summarization',
      description: 'Summarize imported emails and threads for quick insights.'
    },
    {
      icon: RefreshCw,
      title: 'Profile switching',
      description: 'Easily switch between contexts with specific brand profiles.'
    }
  ];

  const integrations = [
    { name: 'Gmail', icon: Mail, connected: true },
    { name: 'Facebook + Instagram', icon: Share2, connected: true },
    { name: 'Outlook', icon: Mail, connected: false },
    { name: 'Google Calendar', icon: Calendar, connected: true },
    { name: 'Google Sheets', icon: FileText, connected: false },
  ];

  const knowledgeItems = [
    { icon: Users, title: 'Social Media Audience Analysis', description: 'Full write up about our Brand\'s biggest and...' },
    { icon: Target, title: 'Import Lead Updates', description: 'We have a sheet with the Expo\'s happening in...' },
    { icon: FileText, title: 'New Logo', description: 'Hi Brain, I uploaded our new logo. Whenever you\'re writing...' },
    { icon: Calendar, title: 'Client 1 Landing', description: 'Hey team, we now have a new client landing this...' }
  ];

  const stats = [
    { value: '93%', label: 'Increase in response quality' },
    { value: '5.2 hours', label: 'Saved weekly on data entry' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-br from-purple-50/50 via-white to-cyan-50/30">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Unlock the Power of<br />Personalized AI with Brain AI
            </h1>
            <p className="text-xl text-[#52525b] max-w-4xl mx-auto mb-8 leading-relaxed">
              Empower your AI helpers with context-rich knowledge, tailored to your brand or business. Brain AI centralizes the knowledge you choose to save—documents, conversations, past campaigns, key insights, knowledge bases, client notes, and more—so every AI assistant you use becomes smarter, faster, and hyper-personalized. No more repeating yourself, no more scattered data. Just seamless, context-aware conversations powered intelligently across teams from day one.
            </p>
            <button 
              onClick={() => onNavigate?.('auth')}
              className="px-8 py-4 bg-[#a78bfa] text-white rounded-full hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
            >
              Create your first Brain Profile
            </button>
          </motion.div>

          {/* Visual Demo - Brain with Floating Labels */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-4xl mx-auto h-[500px] flex items-center justify-center"
          >
            {/* Central Brain Image */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-80 h-80"
            >
              <img 
                src={brainImage}
                alt="Brain AI Platform"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 via-blue-500/15 to-purple-500/15 rounded-full blur-3xl -z-10"></div>
            </motion.div>

            {/* Floating Labels */}
            {/* Top Left - Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                y: [0, -10, 0],
              }}
              className="absolute top-12 left-8 md:left-20 bg-white/90 backdrop-blur-md border border-purple-200 rounded-2xl p-4 shadow-xl max-w-[220px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">Documents</span>
              </div>
              <p className="text-xs text-[#71717a]">PDFs, files, brand guidelines</p>
            </motion.div>

            {/* Top Right - Context */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{
                y: [0, -15, 0],
              }}
              className="absolute top-20 right-8 md:right-20 bg-white/90 backdrop-blur-md border border-cyan-200 rounded-2xl p-4 shadow-xl max-w-[220px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">Conversations</span>
              </div>
              <p className="text-xs text-[#71717a]">Past chats, key insights</p>
            </motion.div>

            {/* Middle Left - Integrations */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{
                y: [0, -12, 0],
              }}
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-4 shadow-xl max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">Integrations</span>
              </div>
              <p className="text-xs text-[#71717a]">Gmail, Calendar, Sheets</p>
            </motion.div>

            {/* Middle Right - Knowledge Base */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{
                y: [0, -8, 0],
              }}
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md border border-pink-200 rounded-2xl p-4 shadow-xl max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">Knowledge</span>
              </div>
              <p className="text-xs text-[#71717a]">Client notes, campaigns</p>
            </motion.div>

            {/* Bottom Left - AI Helpers */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              style={{
                y: [0, -14, 0],
              }}
              className="absolute bottom-16 left-12 md:left-24 bg-white/90 backdrop-blur-md border border-orange-200 rounded-2xl p-4 shadow-xl max-w-[220px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">AI Helpers</span>
              </div>
              <p className="text-xs text-[#71717a]">Esha, Karo, Nivi, Orin, Turbo</p>
            </motion.div>

            {/* Bottom Right - Brand Profiles */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              style={{
                y: [0, -10, 0],
              }}
              className="absolute bottom-12 right-12 md:right-24 bg-white/90 backdrop-blur-md border border-green-200 rounded-2xl p-4 shadow-xl max-w-[220px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-[#18181b]">5 Profiles</span>
              </div>
              <p className="text-xs text-[#71717a]">Multi-brand switching</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Your Business, Your Knowledge Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white via-purple-50/20 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl mb-6 text-[#18181b]">
                Your Business, Your Knowledge.
              </h2>
              <div className="space-y-4 text-[#52525b] text-lg">
                <p>
                  Brain AI is more than just storage — it's advanced software for your business, acting as your digital business brain. Upload docs, webpages, and files to make a comprehensive knowledge base that all your AI helpers can tap into, delivering personalized, on-brand responses and efficiently reducing time and personalized assistance.
                </p>
                <p>
                  Brain AI utilizes cutting-edge technology to deliver personalized assistance tailored to your business needs.
                </p>
              </div>
            </motion.div>

            {/* Brain AI Interface Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">Brain AI</h3>
                    <span className="text-xs text-purple-600">Powered by HYNIQE</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Manage
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                    Sync
                  </button>
                </div>
              </div>

              {/* Brain Card */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 mb-6 text-white">
                <h4 className="text-lg mb-2 font-semibold">Active Brain Profile: Brand X</h4>
                <div className="text-sm opacity-90 mb-3 space-y-1">
                  <p>Used by: Esha, Karo, Orin, Nivi, Turbo</p>
                  <p>Power-Ups enabled: 12</p>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {['M', 'Tu', 'W', 'Th'].map((day, i) => (
                    <div key={i} className="text-center">
                      <div className="text-xs opacity-80 mb-1">{day}</div>
                      <div className="text-2xl">{15 + i}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-900">Integrations</h4>
                  <div className="flex gap-2">
                    <button className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-600 rotate-180" />
                    </button>
                    <button className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {integrations.map((integration, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                        integration.connected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <integration.icon className={`w-6 h-6 ${
                          integration.connected ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <p className="text-xs text-gray-600 truncate">{integration.name}</p>
                      {integration.connected && (
                        <p className="text-xs text-green-600">Connected</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Knowledge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-900">AI Knowledge</h4>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      New
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {knowledgeItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm text-gray-900 mb-1">{item.title}</h5>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Button */}
              <button className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform">
                Upload knowledge
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seamless Brand Switching */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl mb-6 text-[#18181b]">
              Seamless Brand Switching
            </h2>
            <p className="text-xl text-[#52525b] max-w-3xl mx-auto">
              Manage up to 5 different Brain AI profiles effortlessly. Perfect for agencies, multi-brand businesses, or personal and professional separation. Switch between profiles instantly for relevant AI interactions across all your domains.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            {[
              { id: 'businesses', label: 'For Businesses' },
              { id: 'agencies', label: 'For Agencies' },
              { id: 'individuals', label: 'For Individuals' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#a78bfa] text-white shadow-md'
                    : 'bg-white border-2 border-purple-200 text-[#71717a] hover:text-[#18181b] hover:border-purple-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {activeTab === 'businesses' && (
              <p className="text-[#52525b] max-w-2xl mx-auto">
                Brain AI makes profile-switching seamless, whether you are in each or access it through the sidebar, switching is controlled instantaneous across platforms.
              </p>
            )}
            {activeTab === 'agencies' && (
              <p className="text-[#52525b] max-w-2xl mx-auto">
                Manage client accounts with ease. Brain AI enables agency teams and colleagues for collaborative workflows and client communications and campaign management across multiple brands.
              </p>
            )}
            {activeTab === 'individuals' && (
              <p className="text-[#52525b] max-w-2xl mx-auto">
                Keep your personal and professional lives separate. Switch between different contexts with dedicated Brain profiles for work, side projects, and personal tasks.
              </p>
            )}
          </motion.div>

          {/* Brand Cards Visual */}
          <div className="flex justify-center items-center gap-6 mb-16">
            <motion.div
              animate={{ rotateY: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-80 h-48 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-2xl"
            >
              <div className="text-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                  <span className="text-sm">Client 1 - September</span>
                </div>
                <h3 className="text-3xl mb-2">27</h3>
                <p className="text-sm opacity-80">Active campaigns this month</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ rotateY: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              className="w-80 h-48 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 shadow-2xl relative z-10 scale-110"
            >
              <div className="text-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                  <span className="text-sm">Client 2 - August</span>
                </div>
                <h3 className="text-3xl mb-2">15</h3>
                <p className="text-sm opacity-80">Completed projects</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI That Grows With You */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-50/30 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl mb-6 text-[#18181b]">
                AI That Grows With You
              </h2>
              <p className="text-xl text-[#52525b] mb-8">
                Brain AI assistant daily. Brain AI helps users develop and improve essential skills such as creativity, critical thinking, and problem-solving. Our helpers are personalized questions about your brand, continuously expanding brain understanding. Brain AI absorbs the discussing abilities of users by automatically learning and delivering more and more tailored to your needs Brain AI becomes.
              </p>
              <div className="grid grid-cols-2 gap-8">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-5xl mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-[#71717a]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mobile Mockups */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 justify-center items-end"
            >
              {/* Phone 1 - Blue */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-72 h-[560px] bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl rounded-[3.5rem] p-4 shadow-2xl border border-white/50 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.3)]"
              >
                <div className="w-full h-full bg-gradient-to-b from-blue-50/80 to-white/80 backdrop-blur-md rounded-[3rem] p-6 flex flex-col border border-blue-100/50">
                  <div className="w-24 h-7 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full mx-auto mb-8 shadow-lg"></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <MessageSquare className="w-7 h-7 text-blue-600" />
                      </div>
                      <h3 className="text-[#18181b] mb-2 text-base font-medium leading-tight">What are the company&apos;s annual revenue figures for the past three years?</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow font-medium">Send</button>
                      <button className="w-full py-3.5 bg-white/80 backdrop-blur-sm border-2 border-blue-200 text-[#18181b] rounded-xl hover:bg-white transition-colors font-medium">Ask Later</button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phone 2 - Orange */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-72 h-[560px] bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl rounded-[3.5rem] p-4 shadow-2xl border border-white/50 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.3)]"
              >
                <div className="w-full h-full bg-gradient-to-b from-orange-50/80 to-white/80 backdrop-blur-md rounded-[3rem] p-6 flex flex-col border border-orange-100/50">
                  <div className="w-24 h-7 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full mx-auto mb-8 shadow-lg"></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-7xl mb-6">🎨</div>
                      <h3 className="text-[#18181b] mb-2 text-base font-medium leading-tight">Q: Has Stella worked on creative for any major product launches or campaigns?</h3>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow font-medium">Yes, that&apos;s right</button>
                      <button className="w-full py-3.5 bg-white/80 backdrop-blur-sm border-2 border-orange-200 text-[#18181b] rounded-xl hover:bg-white transition-colors font-medium">Adjust the fact</button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Phone 3 - Purple */}
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-72 h-[560px] bg-gradient-to-br from-purple-100/50 to-white/60 backdrop-blur-xl rounded-[3.5rem] p-4 shadow-2xl border border-purple-200/50 hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.4)]"
              >
                <div className="w-full h-full bg-gradient-to-b from-purple-600 to-purple-700 backdrop-blur-md rounded-[3rem] p-6 flex flex-col border border-purple-400/30 shadow-inner">
                  <div className="w-24 h-7 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full mx-auto mb-8 shadow-lg"></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                        <Brain className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-white text-xl mb-2 font-semibold">New knowledge added</h3>
                      <p className="text-purple-100 text-sm">New launch campaign notes</p>
                      <p className="text-purple-200 text-sm mt-2">Brand voice updated: friendly + confident</p>
                    </div>
                    <button className="w-full py-3.5 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors shadow-lg font-medium">Continue</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gray-400 max-w-3xl mx-auto">
              As users continue to engage with Brain AI, key importance-mapping heuristics AI learns about their critical thinking skills and cognitive abilities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-[#52525b] mb-12 max-w-3xl mx-auto text-lg"
          >
            Brain AI offers a suite of advanced features deeply integrated to Sintra ecosystems. Designed to streamline your daily workflow.
          </motion.p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm hover:shadow-md rounded-2xl p-6 hover:border-purple-200 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-[#18181b] mb-2">{feature.title}</h3>
                <p className="text-[#52525b]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Brain AI Hub Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-purple-50/60 via-pink-50/40 to-blue-50/30 overflow-hidden">
        {/* Soft Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent"></div>

        <div className="relative max-w-7xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
              Your Brain AI Hub
            </h2>
            <p className="text-lg text-[#52525b] max-w-2xl mx-auto">
              Centralized intelligence powering all your AI helpers with contextual knowledge
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {/* Left Side - Brain Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                {/* Circular Glow Platform */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-300/30 via-purple-300/20 to-transparent rounded-[50%] blur-3xl"></div>
                </div>
                
                {/* Brain Image */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <img 
                    src={brainImage}
                    alt="Brain AI"
                    className="w-full h-auto max-w-lg object-contain drop-shadow-2xl"
                  />
                  {/* Enhanced Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/30 via-blue-500/20 to-purple-500/20 rounded-full blur-2xl -z-10 scale-75"></div>
                </motion.div>

                {/* Floating Data Particles */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-10 right-10 w-3 h-3 bg-cyan-400 rounded-full blur-sm"
                ></motion.div>
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    opacity: [0.4, 0.7, 0.4]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  className="absolute top-32 left-8 w-2 h-2 bg-purple-400 rounded-full blur-sm"
                ></motion.div>
                <motion.div
                  animate={{ 
                    y: [0, -25, 0],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
                  className="absolute bottom-20 right-16 w-2.5 h-2.5 bg-pink-400 rounded-full blur-sm"
                ></motion.div>
              </div>
            </motion.div>

            {/* Right Side - Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center"
            >
              {/* Purple Gradient Card */}
              <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>

                {/* Small Brain Icon */}
                <div className="absolute top-6 right-6 w-24 h-24 opacity-20">
                  <img 
                    src={brainImage}
                    alt="Brain"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="relative">
                  <h3 className="text-2xl text-white mb-6">HYNÍQÉ Brain AI</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div>
                      <div className="text-3xl text-white mb-1">41</div>
                      <div className="text-xs text-purple-200">Snippets</div>
                    </div>
                    <div>
                      <div className="text-3xl text-white mb-1">38</div>
                      <div className="text-xs text-purple-200">Webpages</div>
                    </div>
                    <div>
                      <div className="text-3xl text-white mb-1">4</div>
                      <div className="text-xs text-purple-200">Files</div>
                    </div>
                    <div>
                      <div className="text-3xl text-white mb-1">157</div>
                      <div className="text-xs text-purple-200">Media</div>
                    </div>
                  </div>

                  {/* Helper Pills */}
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
                      🐘 Esha
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
                      🐕 Karo
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
                      🐦 Nivi
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
                      🦉 Orin
                    </div>
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
                      🐯 Turbo
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Integrations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl text-[#18181b]">Integrations</h3>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg bg-white/80 border border-purple-200 flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronRight className="w-5 h-5 text-[#71717a] rotate-180" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/80 border border-purple-200 flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronRight className="w-5 h-5 text-[#71717a]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Gmail', icon: Mail, connected: true, color: 'from-red-500 to-orange-500' },
                { name: 'Facebook', icon: Share2, connected: true, color: 'from-blue-600 to-blue-700' },
                { name: 'Outlook', icon: Mail, connected: false, color: 'from-blue-500 to-blue-600' },
                { name: 'Calendar', icon: Calendar, connected: true, color: 'from-green-500 to-emerald-600' },
                { name: 'Sheets', icon: FileText, connected: false, color: 'from-green-600 to-green-700' },
                { name: 'Drive', icon: Database, connected: true, color: 'from-yellow-500 to-orange-500' },
              ].map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-lg`}>
                    <integration.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-[#18181b] mb-1">{integration.name}</p>
                  {integration.connected ? (
                    <p className="text-xs text-green-600">Connected</p>
                  ) : (
                    <p className="text-xs text-[#71717a]">Available</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* All Knowledge Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl text-[#18181b]">All Knowledge</h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/80 border border-purple-200 rounded-xl text-sm text-[#71717a] hover:bg-white transition-colors flex items-center gap-2">
                  <Search className="w-4 h-4" />
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-lg">
              <div className="space-y-3">
                {[
                  { icon: FileText, title: 'HYNÍQÉ Brand Guidelines.pdf', desc: 'Our complete brand voice, tone, colors, and messaging standards for all AI helpers...', color: 'from-purple-500 to-pink-500' },
                  { icon: Users, title: 'AI Helper Capabilities & Roles', desc: 'Detailed overview of Esha (Recruiter), Karo (Customer Success), Nivi (Social Media), Orin (Data Analyst), and Turbo (Sales)...', color: 'from-blue-500 to-cyan-500' },
                  { icon: Mail, title: 'Customer Onboarding Process', desc: 'Step-by-step guide for new HYNÍQÉ users, integration setup, and best practices for working with AI helpers...', color: 'from-orange-500 to-red-500' },
                  { icon: MessageSquare, title: 'Product Pricing & Plans', desc: 'Current pricing tiers, feature breakdowns, enterprise options, and upgrade paths for HYNÍQÉ platform...', color: 'from-green-500 to-emerald-500' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl hover:bg-purple-100/50 transition-all cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-[#18181b] mb-1">{item.title}</h4>
                      <p className="text-xs text-[#71717a] line-clamp-1">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Answer Questions Button */}
              <button className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                Answer Questions
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-50/30 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            <div className="relative">
              <h2 className="text-4xl md:text-5xl text-white mb-6">
                Get Brain AI and<br />personal AI Helpers today.
              </h2>
              <p className="text-xl text-purple-100 mb-8">
                Transform how you work with advanced, harnessing the power of AI helpers with Brain.
              </p>
              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-white text-purple-600 rounded-full hover:scale-105 transition-transform shadow-xl font-medium"
              >
                Get Brain Today
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-[#18181b] text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              'How does Brain AI differ from regular AI interactions?',
              'Can I use Brain AI for multiple brands or clients?',
              'How does Brain AI learn about my brand?',
              'Is my data in Brain AI secure?',
              'Can I use Brain AI for personal projects too?'
            ].map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border-2 border-purple-100 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
              >
                <span className="text-[#18181b] font-medium">{question}</span>
                <Plus className="w-6 h-6 text-[#71717a]" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}