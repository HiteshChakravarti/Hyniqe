import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Zap,
  Users,
  Brain,
  History,
  Plus,
  User,
  Search,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  Database,
  Mail,
  FileText,
  BarChart3
} from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';

interface HomeDashboardProps {
  userName: string;
  onNavigateToHelper: (helperId: string) => void;
  onLogout: () => void;
  brainData?: {
    setupComplete: number;
    totalDocuments: number;
    knowledgeItems: string[];
  };
}

const helpers = [
  {
    id: 'esha',
    name: 'Esha',
    role: 'AI Recruiter',
    description: 'Find and screen top talent',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    image: 'https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: { tasksToday: 12, active: true }
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success',
    description: 'Delight your customers',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    image: 'https://images.unsplash.com/photo-1606704382773-a2875b6b931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBkb2clMjBjaGFyYWN0ZXIlMjAzZHxlbnwxfHx8fDE3NjQ3MzA5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    stats: { tasksToday: 8, active: true }
  },
  {
    id: 'nivi',
    name: 'Nivi',
    role: 'Social Media Manager',
    description: 'Grow your social presence',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    image: 'https://images.unsplash.com/photo-1761537265098-ab06313e1218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWFuJTIwYmlyZCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: { tasksToday: 15, active: true }
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    description: 'Unlock data insights',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    image: 'https://images.unsplash.com/photo-1689881199549-43015f799708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG93bCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: { tasksToday: 5, active: false }
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    description: 'Close more deals faster',
    color: 'red',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    image: 'https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: { tasksToday: 10, active: true }
  }
];

const quickActions = [
  {
    id: 'content-plan',
    helper: 'nivi',
    title: 'Create Content Plan',
    description: 'Generate a week of social posts with Nivi',
    icon: MessageCircle,
    gradient: 'from-cyan-600 to-cyan-700'
  },
  {
    id: 'recruitment',
    helper: 'esha',
    title: 'Run Recruitment Flow',
    description: 'Screen candidates with Esha',
    icon: Users,
    gradient: 'from-purple-600 to-purple-700'
  },
  {
    id: 'sales-data',
    helper: 'orin',
    title: 'Analyze Sales Data',
    description: 'Get insights from Orin',
    icon: BarChart3,
    gradient: 'from-green-600 to-green-700'
  },
  {
    id: 'customer-tickets',
    helper: 'karo',
    title: 'Handle Support Tickets',
    description: 'Resolve issues with Karo',
    icon: Mail,
    gradient: 'from-orange-600 to-orange-700'
  }
];

const recentActivity = [
  { helper: 'Nivi', action: 'Generated Instagram content plan', time: '1h ago', icon: MessageCircle, color: 'text-cyan-400' },
  { helper: 'Esha', action: 'Screened 15 candidates for Senior Dev role', time: '2h ago', icon: Users, color: 'text-purple-400' },
  { helper: 'Turbo', action: 'Sent follow-ups to 28 prospects', time: '3h ago', icon: Mail, color: 'text-orange-400' },
  { helper: 'Orin', action: 'Built Q4 revenue dashboard', time: '5h ago', icon: BarChart3, color: 'text-green-400' },
  { helper: 'Karo', action: 'Resolved 12 support tickets', time: '6h ago', icon: CheckCircle, color: 'text-orange-400' }
];

export function HomeDashboard({ userName, onNavigateToHelper, onLogout, brainData }: HomeDashboardProps) {
  const [activeSidebarItem, setActiveSidebarItem] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const defaultBrainData = brainData || {
    setupComplete: 60,
    totalDocuments: 3,
    knowledgeItems: ['Brand tone', 'Product Overview', 'FAQs']
  };

  const activeHelpers = helpers.filter(h => h.stats.active).length;
  const totalTasks = helpers.reduce((sum, h) => sum + h.stats.tasksToday, 0);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <DashboardSidebar
        activeSidebarItem={activeSidebarItem}
        setActiveSidebarItem={setActiveSidebarItem}
        onNavigateToHelper={onNavigateToHelper}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl text-text-primary mb-2">
                  Welcome to Your HYNÍQÉ Brain Workspace 👋
                </h1>
                <p className="text-text-secondary text-lg">
                  All your AI employees, power-ups & knowledge in one place.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="glass-card w-12 h-12 rounded-xl bg-white/60 backdrop-blur-xl hover:bg-white/80 border border-white/50 flex items-center justify-center transition-all shadow-md hover:shadow-lg">
                  <Bell className="w-5 h-5 text-text-secondary" />
                </button>
                <button 
                  onClick={() => onNavigateToHelper('settings')}
                  className="glass-card w-12 h-12 rounded-xl bg-white/60 backdrop-blur-xl hover:bg-white/80 border border-white/50 flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                >
                  <Settings className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to do today?"
                className="w-full glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-all shadow-md"
              />
            </div>

            {/* Stats Chips */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="glass-card px-4 py-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-full flex items-center gap-2 shadow-md">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-text-primary text-sm">Active Employees: {activeHelpers}</span>
              </div>
              <div className="glass-card px-4 py-2 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-full flex items-center gap-2 shadow-md">
                <Zap className="w-4 h-4 text-cyan-500" />
                <span className="text-text-primary text-sm">Tasks Today: {totalTasks}</span>
              </div>
              <div className="glass-card px-4 py-2 bg-gradient-to-r from-green-600/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-full flex items-center gap-2 shadow-md">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-text-primary text-sm">Brain Sync: Up to date</span>
              </div>
            </div>
          </div>

          {/* Your AI Helpers */}
          <section className="mb-12">
            <h2 className="text-2xl text-text-primary mb-6">Your AI Employees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {helpers.map((helper) => (
                <motion.div
                  key={helper.id}
                  whileHover={{ y: -4 }}
                  className={`glass-card relative bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 cursor-pointer group shadow-lg hover:shadow-xl transition-all`}
                  onClick={() => onNavigateToHelper(`${helper.id}-dashboard`)}
                >
                  {/* Status Badge */}
                  {helper.stats.active && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                  
                  {/* Helper Image */}
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 relative">
                    <img 
                      src={helper.image} 
                      alt={helper.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Name Overlay */}
                    <div className="absolute inset-0 flex items-start justify-center pt-1">
                      <span 
                        className="text-white text-xs tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        style={{ 
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          letterSpacing: '0.1em'
                        }}
                      >
                        {helper.name}
                      </span>
                    </div>
                  </div>

                  {/* Helper Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-text-primary mb-1">{helper.name}</h3>
                    <p className="text-sm text-text-secondary">{helper.role}</p>
                    <p className="text-xs text-text-tertiary mt-2">{helper.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{helper.stats.tasksToday} tasks today</span>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2">
                    <button 
                      className={`glass-card w-full py-2 bg-gradient-to-r ${helper.gradient} backdrop-blur-xl text-white rounded-xl text-sm hover:scale-105 transition-all border border-white/20 shadow-md`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToHelper(`${helper.id}-dashboard`);
                      }}
                    >
                      Open Chat
                    </button>
                    <button 
                      className="glass-card w-full py-2 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 text-text-secondary rounded-xl text-sm transition-all shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToHelper(`${helper.id}-dashboard`);
                      }}
                    >
                      View Workflows
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-12">
            <h2 className="text-2xl text-text-primary mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onNavigateToHelper(`${action.helper}-dashboard`)}
                  className={`glass-card bg-gradient-to-br ${action.gradient} backdrop-blur-xl p-6 rounded-2xl text-left group border border-white/20 shadow-lg hover:shadow-xl transition-all`}
                >
                  <action.icon className="w-10 h-10 text-white mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-white/80">{action.description}</p>
                  <ChevronRight className="w-5 h-5 text-white mt-3 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ))}
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl text-text-primary mb-6">Recent Activity</h2>
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-border-soft last:border-0 last:pb-0">
                      <div className={`glass-card w-10 h-10 rounded-xl bg-white/50 backdrop-blur-xl border border-white/50 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <activity.icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-text-primary text-sm mb-1">
                          <span className={activity.color}>{activity.helper}</span> {activity.action}
                        </p>
                        <p className="text-text-tertiary text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Rail */}
            <div className="space-y-6">
              {/* Brain Knowledge */}
              <div className="glass-card bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-cyan-500" />
                  <h3 className="text-text-primary">HYNIQE Brain</h3>
                </div>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Setup Complete</span>
                    <span className="text-sm text-cyan-500">{defaultBrainData.setupComplete}%</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                      style={{ width: `${defaultBrainData.setupComplete}%` }}
                    ></div>
                  </div>
                </div>

                {/* Knowledge Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {defaultBrainData.knowledgeItems.map((item, index) => (
                    <span key={index} className="glass-card px-3 py-1 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-full text-xs text-cyan-600 shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>

                {/* Documents */}
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                  <FileText className="w-4 h-4" />
                  <span>{defaultBrainData.totalDocuments} documents uploaded</span>
                </div>

                <button className="glass-card w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 backdrop-blur-xl text-white rounded-xl flex items-center justify-center gap-2 transition-all border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.02]">
                  <Plus className="w-4 h-4" />
                  Add Knowledge
                </button>
              </div>

              {/* Integrations */}
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg">
                <h3 className="text-text-primary mb-4">Integrations</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Gmail', icon: Mail, connected: true },
                    { name: 'Google Sheets', icon: FileText, connected: true },
                    { name: 'Drive', icon: Database, connected: false }
                  ].map((integration, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="glass-card w-8 h-8 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg flex items-center justify-center shadow-sm">
                          <integration.icon className="w-4 h-4 text-text-secondary" />
                        </div>
                        <span className="text-sm text-text-primary">{integration.name}</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full ${integration.connected ? 'bg-green-500' : 'bg-gray-300'} relative cursor-pointer shadow-inner`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${integration.connected ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Use Brain AI Toggle */}
              <div className="glass-card bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="text-text-primary text-sm">Use Brain AI</p>
                      <p className="text-text-tertiary text-xs">Global knowledge</p>
                    </div>
                  </div>
                  <div className="w-12 h-7 rounded-full bg-purple-500 relative cursor-pointer shadow-inner">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}