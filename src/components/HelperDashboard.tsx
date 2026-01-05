import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquarePlus, 
  Search, 
  Settings, 
  Send, 
  Sparkles,
  User,
  Calendar,
  Target,
  TrendingUp,
  Users,
  MessageCircle,
  FileText,
  BarChart3,
  Heart,
  Zap,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  DollarSign,
  Share2,
  Image as ImageIcon,
  Video,
  Megaphone,
  PieChart,
  Database,
  LineChart,
  Filter,
  Activity,
  ArrowLeft,
  Home
} from 'lucide-react';

interface HelperDashboardProps {
  helperId: 'esha' | 'karo' | 'nivi' | 'orin' | 'turbo';
  onBack?: () => void;
}

const helperData = {
  esha: {
    name: 'Esha',
    role: 'AI Recruiter',
    greeting: "Hey, it's Esha 👋",
    subtitle: 'How can I help you find top talent today?',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    quickActions: [
      { icon: Users, label: 'Screen candidates', description: 'Review applications automatically' },
      { icon: Calendar, label: 'Schedule interviews', description: 'Book meetings with top picks' },
      { icon: Target, label: 'Find top talent', description: 'Search across platforms' },
      { icon: FileText, label: 'Generate job posts', description: 'Create compelling listings' },
    ],
    powerUps: [
      { icon: User, name: 'Resume Parser', color: 'bg-purple-500' },
      { icon: Calendar, name: 'Interview Scheduler', color: 'bg-pink-500' },
      { icon: Zap, name: 'Candidate Scoring', color: 'bg-indigo-500' },
    ],
    recentHistory: [
      'Screened 45 candidates for Senior Developer role',
      'Scheduled 8 interviews for this week',
      'Generated job post for Product Manager position',
    ]
  },
  karo: {
    name: 'Karo',
    role: 'Customer Success AI',
    greeting: "Hey, it's Karo 👋",
    subtitle: 'How can I help delight your customers today?',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1606704382773-a2875b6b931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBkb2clMjBjaGFyYWN0ZXIlMjAzZHxlbnwxfHx8fDE3NjQ3MzA5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    quickActions: [
      { icon: MessageCircle, label: 'Handle support tickets', description: 'Resolve customer issues fast' },
      { icon: Heart, label: 'Check customer health', description: 'Monitor satisfaction scores' },
      { icon: Mail, label: 'Send follow-ups', description: 'Keep customers engaged' },
      { icon: CheckCircle, label: 'Onboard new users', description: 'Guide customers to success' },
    ],
    powerUps: [
      { icon: MessageCircle, name: 'Ticket Manager', color: 'bg-orange-500' },
      { icon: Heart, name: 'Health Monitor', color: 'bg-red-500' },
      { icon: Zap, name: 'Auto-Response', color: 'bg-amber-500' },
    ],
    recentHistory: [
      'Resolved 32 support tickets with 98% satisfaction',
      'Onboarded 12 new customers',
      'Sent follow-up emails to 45 users',
    ]
  },
  nivi: {
    name: 'Nivi',
    role: 'Social Media Manager',
    greeting: "Hey, it's Nivi 👋",
    subtitle: 'How can I boost your social presence today?',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
    image: 'https://images.unsplash.com/photo-1761537265098-ab06313e1218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWFuJTIwYmlyZCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    quickActions: [
      { icon: Megaphone, label: 'Create content', description: 'Generate engaging posts' },
      { icon: Calendar, label: 'Schedule posts', description: 'Plan your content calendar' },
      { icon: TrendingUp, label: 'Analyze performance', description: 'Track engagement metrics' },
      { icon: ImageIcon, label: 'Design graphics', description: 'Create stunning visuals' },
    ],
    powerUps: [
      { icon: Megaphone, name: 'Content Creator', color: 'bg-cyan-500' },
      { icon: Calendar, name: 'Scheduler', color: 'bg-blue-500' },
      { icon: TrendingUp, name: 'Analytics', color: 'bg-teal-500' },
    ],
    recentHistory: [
      'Created 15 posts for next week',
      'Scheduled content across 4 platforms',
      'Analyzed last month\'s engagement - up 34%!',
    ]
  },
  orin: {
    name: 'Orin',
    role: 'Data Analyst',
    greeting: "Hey, it's Orin 👋",
    subtitle: 'How can I help unlock insights from your data?',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    image: 'https://images.unsplash.com/photo-1689881199549-43015f799708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG93bCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    quickActions: [
      { icon: BarChart3, label: 'Generate reports', description: 'Create comprehensive analytics' },
      { icon: TrendingUp, label: 'Analyze trends', description: 'Identify patterns in data' },
      { icon: PieChart, label: 'Build dashboards', description: 'Visualize key metrics' },
      { icon: Database, label: 'Query databases', description: 'Extract valuable insights' },
    ],
    powerUps: [
      { icon: BarChart3, name: 'Report Builder', color: 'bg-green-500' },
      { icon: LineChart, name: 'Trend Analyzer', color: 'bg-emerald-500' },
      { icon: Filter, name: 'Data Cleaner', color: 'bg-lime-500' },
    ],
    recentHistory: [
      'Generated Q4 revenue report',
      'Analyzed customer churn patterns',
      'Built real-time sales dashboard',
    ]
  },
  turbo: {
    name: 'Turbo',
    role: 'Sales Specialist',
    greeting: "Hey, it's Turbo 👋",
    subtitle: 'How can I help close more deals today?',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    image: 'https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    quickActions: [
      { icon: Target, label: 'Qualify leads', description: 'Score and prioritize prospects' },
      { icon: Phone, label: 'Follow up prospects', description: 'Automated outreach campaigns' },
      { icon: DollarSign, label: 'Close deals', description: 'Move opportunities forward' },
      { icon: Activity, label: 'Track pipeline', description: 'Monitor sales performance' },
    ],
    powerUps: [
      { icon: Target, name: 'Lead Scorer', color: 'bg-orange-500' },
      { icon: Mail, name: 'Email Outreach', color: 'bg-red-500' },
      { icon: DollarSign, name: 'Deal Tracker', color: 'bg-amber-500' },
    ],
    recentHistory: [
      'Qualified 28 new leads this week',
      'Sent follow-ups to 56 prospects',
      'Closed 3 deals worth $45,000',
    ]
  },
};

export function HelperDashboard({ helperId, onBack }: HelperDashboardProps) {
  const helper = helperData[helperId];
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Great question! As your ${helper.role}, I'd be happy to help with that. Let me analyze this for you...` 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    handleSendMessage();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Mobile Header with Back Button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-gradient-to-r ${helper.gradient} border-b border-white/20">
        <button
          onClick={onBack}
          className="glass-card bg-white/25 backdrop-blur-xl hover:bg-white/35 p-2 rounded-xl flex items-center gap-2 transition-all border border-white/40"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
          <span className="text-white font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/30 flex items-center justify-center border-2 border-white/50">
            <img 
              src={helper.image} 
              alt={helper.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-white font-bold">{helper.name}</h3>
            <p className="text-white/80 text-xs">{helper.role}</p>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className={`w-full lg:w-72 bg-gradient-to-b ${helper.gradient} p-4 md:p-6 flex flex-col hidden lg:flex`}>
        {/* Character Card */}
        <div className="glass-card bg-white/25 backdrop-blur-xl rounded-2xl p-4 mb-6 border border-white/40 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/30 flex items-center justify-center border-2 border-white/50 shadow-lg">
              <img 
                src={helper.image} 
                alt={helper.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-gray-900 text-xl font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">{helper.name}</h3>
              <p className="text-gray-800 text-sm font-semibold drop-shadow-[0_2px_6px_rgba(255,255,255,0.6)]">{helper.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setChatHistory([])}
            className="glass-card w-full bg-white/35 backdrop-blur-xl hover:bg-white/45 text-gray-900 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/50 shadow-lg hover:shadow-xl hover:scale-105 drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]"
          >
            <MessageSquarePlus className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)]" />
            <span className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)]">+ New Chat</span>
          </button>
        </div>

        {/* Power-Ups */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-900 font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">Power-Ups</h4>
            <button className="text-gray-900 hover:text-gray-900 font-bold text-xs drop-shadow-[0_2px_6px_rgba(255,255,255,0.8)] hover:scale-105 transition-transform">See all</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {helper.powerUps.map((powerUp, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`glass-card ${powerUp.color} backdrop-blur-xl p-3 rounded-xl flex flex-col items-center justify-center aspect-square border border-white/50 shadow-xl hover:shadow-2xl transition-all`}
              >
                <powerUp.icon className="w-6 h-6 text-white mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
                <span className="text-white text-[9px] text-center leading-tight font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{powerUp.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-900 font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">History</h4>
            <Search className="w-4 h-4 text-gray-900 drop-shadow-[0_2px_6px_rgba(255,255,255,0.8)]" />
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            <div className="text-gray-900 text-xs mb-2 font-bold drop-shadow-[0_2px_6px_rgba(255,255,255,0.8)]">Today</div>
            {helper.recentHistory.map((item, index) => (
              <div key={index} className="glass-card text-gray-900 text-xs py-2.5 px-3 bg-white/25 backdrop-blur-xl rounded-xl hover:bg-white/35 cursor-pointer transition-all border border-white/40 line-clamp-2 shadow-lg hover:shadow-xl font-semibold drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)]">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <button className="glass-card mt-6 text-gray-900 font-bold flex items-center gap-2 py-2.5 px-3 bg-white/25 backdrop-blur-xl hover:bg-white/35 rounded-xl transition-all border border-white/50 shadow-xl hover:scale-105 hover:shadow-2xl">
          <Settings className="w-5 h-5 drop-shadow-[0_2px_6px_rgba(255,255,255,0.6)]" />
          <span className="drop-shadow-[0_2px_6px_rgba(255,255,255,0.6)]">Settings</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Bar */}
        <div className="glass-card bg-white/60 backdrop-blur-xl p-4 border-b border-white/50 shadow-md">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="glass-card flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors bg-white/60 backdrop-blur-xl hover:bg-white/80 px-3 py-2 rounded-xl border border-white/50 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:inline">Back</span>
              </button>
            )}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img src={helper.image} alt={helper.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-text-primary">{helper.name}</h3>
                <p className="text-text-secondary text-sm">{helper.role}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3 ml-4">
              <Home className="w-5 h-5 text-text-secondary" />
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary">{helper.name}</span>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          {chatHistory.length === 0 ? (
            // Welcome Screen
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Greeting */}
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl text-text-primary mb-3">
                  {helper.greeting}
                </h1>
                <p className="text-xl text-text-secondary">{helper.subtitle}</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {helper.quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => handleQuickAction(action.label)}
                    className="glass-card bg-white/80 backdrop-blur-xl hover:bg-white/90 border border-white/60 p-6 rounded-2xl text-left transition-all group shadow-xl hover:shadow-2xl"
                  >
                    <div className={`glass-card w-12 h-12 bg-gradient-to-br ${helper.gradient} backdrop-blur-xl rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/30 shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <h3 className="text-text-primary font-semibold text-lg mb-2">{action.label}</h3>
                    <p className="text-text-secondary font-medium text-sm">{action.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Chat Messages
            <div className="max-w-4xl mx-auto space-y-6">
              {chatHistory.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <img src={helper.image} alt={helper.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={`max-w-2xl p-4 rounded-2xl ${
                    message.role === 'user' 
                      ? `glass-card bg-gradient-to-br ${helper.gradient} backdrop-blur-xl text-white border border-white/20 shadow-md`
                      : 'glass-card bg-white/60 backdrop-blur-xl text-text-primary border border-white/50 shadow-md'
                  }`}>
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="glass-card w-10 h-10 rounded-full bg-white/60 backdrop-blur-xl flex items-center justify-center flex-shrink-0 border border-white/50 shadow-md">
                      <User className="w-6 h-6 text-text-secondary" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={helper.image} alt={helper.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="glass-card bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="glass-card border-t border-white/50 p-4 lg:p-6 bg-white/40 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
              <Sparkles className="w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Press '/' to see integrations actions"
                className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
              />
              <button 
                onClick={handleSendMessage}
                className={`glass-card w-10 h-10 bg-gradient-to-br ${helper.gradient} backdrop-blur-xl rounded-xl flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-md`}
                disabled={!inputMessage.trim()}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-text-tertiary text-xs text-center mt-3">
              {helper.name} can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}