import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  Target,
  Zap,
  BarChart3,
  Calendar,
  MessageCircle,
  Mail,
  FileText,
  Phone,
  Share2,
  Filter,
  Star,
  ChevronRight,
  Edit,
  Trash2,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface HelpersPageProps {
  onNavigateToHelper?: (helperId: string) => void;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

const helpers = [
  {
    id: 'estel',
    name: 'Estel',
    role: 'AI Recruiter',
    description: 'Find and screen top talent across multiple platforms',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    image: 'https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'active',
    stats: {
      tasksCompleted: 847,
      accuracy: 98,
      activeTasks: 12,
      timeActive: '45h this week'
    },
    powerUps: ['LinkedIn', 'Calendar Sync', 'Gmail'],
    performance: 95,
    lastActive: '2 min ago'
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success AI',
    description: 'Delight your customers with personalized support',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    image: 'https://images.unsplash.com/photo-1606704382773-a2875b6b931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBkb2clMjBjaGFyYWN0ZXIlMjAzZHxlbnwxfHx8fDE3NjQ3MzA5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'active',
    stats: {
      tasksCompleted: 1203,
      accuracy: 99,
      activeTasks: 8,
      timeActive: '52h this week'
    },
    powerUps: ['Gmail', 'Slack Bot', 'CRM Integration'],
    performance: 98,
    lastActive: '5 min ago'
  },
  {
    id: 'niki',
    name: 'Niki',
    role: 'Social Media Manager',
    description: 'Grow your social presence with engaging content',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    image: 'https://images.unsplash.com/photo-1761537265098-ab06313e1218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWFuJTIwYmlyZCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'active',
    stats: {
      tasksCompleted: 654,
      accuracy: 96,
      activeTasks: 15,
      timeActive: '38h this week'
    },
    powerUps: ['Instagram', 'Twitter/X', 'Content Generator'],
    performance: 92,
    lastActive: '1 min ago'
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    description: 'Unlock powerful insights from your data',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    image: 'https://images.unsplash.com/photo-1689881199549-43015f799708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG93bCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'idle',
    stats: {
      tasksCompleted: 432,
      accuracy: 99,
      activeTasks: 5,
      timeActive: '28h this week'
    },
    powerUps: ['Google Sheets', 'Advanced Analytics'],
    performance: 97,
    lastActive: '2h ago'
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    description: 'Close more deals faster with AI-powered outreach',
    color: 'red',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    image: 'https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'active',
    stats: {
      tasksCompleted: 923,
      accuracy: 97,
      activeTasks: 10,
      timeActive: '41h this week'
    },
    powerUps: ['CRM Integration', 'Phone System', 'Gmail'],
    performance: 94,
    lastActive: '3 min ago'
  }
];

export function HelpersPage({ onNavigateToHelper, onBack, onNavigate, onLogout }: HelpersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle'>('all');

  const filteredHelpers = helpers.filter(helper => {
    const matchesSearch = helper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         helper.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || helper.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeHelpers = helpers.filter(h => h.status === 'active').length;
  const totalTasks = helpers.reduce((sum, h) => sum + h.stats.tasksCompleted, 0);
  const avgPerformance = Math.round(helpers.reduce((sum, h) => sum + h.performance, 0) / helpers.length);

  const handleNavigate = (helperId: string) => {
    if (onNavigateToHelper) {
      onNavigateToHelper(helperId);
    }
  };

  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="helpers"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {onNavigate && onLogout && (
          <DashboardHeader
            onLogout={onLogout}
            onNavigate={onNavigate}
            onCreateProfile={() => onNavigate('profiles')}
          />
        )}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="glass-card mb-6 px-4 py-2 bg-white/60 backdrop-blur-xl border border-white/50 rounded-xl flex items-center gap-2 text-text-secondary hover:text-text-primary hover:bg-white/80 transition-all shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-card w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-text-primary text-4xl">AI Employees</h1>
                  <p className="text-text-secondary">Manage and monitor your AI workforce</p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-purple-500" />
                    <div className="glass-card px-2 py-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full">
                      <span className="text-green-600 text-xs">Active</span>
                    </div>
                  </div>
                  <p className="text-3xl text-text-primary mb-1">{activeHelpers}/{helpers.length}</p>
                  <p className="text-text-secondary text-sm">Active Helpers</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-cyan-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">{totalTasks.toLocaleString()}</p>
                  <p className="text-text-secondary text-sm">Tasks Completed</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-green-600/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">{avgPerformance}%</p>
                  <p className="text-text-secondary text-sm">Avg Performance</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-lg">
                  <Zap className="w-8 h-8 text-orange-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">50</p>
                  <p className="text-text-secondary text-sm">Active Tasks</p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search helpers..."
                    className="w-full glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-all shadow-md"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`glass-card px-4 py-2 rounded-xl text-sm transition-all ${
                      filterStatus === 'all'
                        ? 'bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md'
                        : 'bg-white/50 backdrop-blur-xl hover:bg-white/70 text-text-secondary border border-white/50 shadow-sm'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`glass-card px-4 py-2 rounded-xl text-sm transition-all ${
                      filterStatus === 'active'
                        ? 'bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md'
                        : 'bg-white/50 backdrop-blur-xl hover:bg-white/70 text-text-secondary border border-white/50 shadow-sm'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterStatus('idle')}
                    className={`glass-card px-4 py-2 rounded-xl text-sm transition-all ${
                      filterStatus === 'idle'
                        ? 'bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md'
                        : 'bg-white/50 backdrop-blur-xl hover:bg-white/70 text-text-secondary border border-white/50 shadow-sm'
                    }`}
                  >
                    Idle
                  </button>
                </div>

                {/* Add Helper */}
                <button className="glass-card px-6 py-2 bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white rounded-xl transition-all border border-white/20 shadow-md hover:shadow-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="hidden md:inline">Add Helper</span>
                </button>
              </div>
            </div>

            {/* Helpers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredHelpers.map((helper) => (
                <motion.div
                  key={helper.id}
                  whileHover={{ y: -4 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                          <img 
                            src={helper.image} 
                            alt={helper.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                          helper.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-text-primary text-xl mb-1">{helper.name}</h3>
                        <p className="text-text-secondary text-sm mb-1">{helper.role}</p>
                        <p className="text-text-tertiary text-xs">{helper.lastActive}</p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <button className="glass-card w-10 h-10 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl flex items-center justify-center transition-all shadow-sm">
                      <MoreVertical className="w-5 h-5 text-text-secondary" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-text-secondary text-sm mb-6">{helper.description}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="glass-card bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-text-tertiary text-xs">Completed</span>
                      </div>
                      <p className="text-text-primary text-2xl">{helper.stats.tasksCompleted}</p>
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-cyan-500" />
                        <span className="text-text-tertiary text-xs">Accuracy</span>
                      </div>
                      <p className="text-text-primary text-2xl">{helper.stats.accuracy}%</p>
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-500" />
                        <span className="text-text-tertiary text-xs">Active Now</span>
                      </div>
                      <p className="text-text-primary text-2xl">{helper.stats.activeTasks}</p>
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-text-tertiary text-xs">Time Active</span>
                      </div>
                      <p className="text-text-primary text-sm">{helper.stats.timeActive}</p>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-secondary">Performance</span>
                      <span className="text-sm text-accent-primary">{helper.performance}%</span>
                    </div>
                    <div className="h-2 bg-white/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${helper.gradient} transition-all`}
                        style={{ width: `${helper.performance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Power-Ups */}
                  <div className="mb-6">
                    <p className="text-text-tertiary text-xs mb-3">Active Power-Ups:</p>
                    <div className="flex flex-wrap gap-2">
                      {helper.powerUps.map((powerUp, idx) => (
                        <span key={idx} className="glass-card px-3 py-1 bg-white/50 backdrop-blur-sm border border-white/50 rounded-lg text-text-secondary text-xs shadow-sm">
                          {powerUp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleNavigate(helper.id + '-dashboard')}
                      className={`glass-card flex-1 py-3 bg-gradient-to-r ${helper.gradient} backdrop-blur-xl hover:scale-[1.02] text-white rounded-xl transition-all border border-white/20 shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Chat
                    </button>
                    <button className="glass-card px-4 py-3 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl transition-all shadow-sm">
                      <Settings className="w-5 h-5 text-text-secondary" />
                    </button>
                    <button className="glass-card px-4 py-3 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl transition-all shadow-sm">
                      <BarChart3 className="w-5 h-5 text-text-secondary" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No Results */}
            {filteredHelpers.length === 0 && (
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center shadow-lg">
                <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-text-primary text-xl mb-2">No helpers found</h3>
                <p className="text-text-secondary">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}