import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  BarChart3,
  Zap,
  ArrowUpRight,
  Calendar,
  Target,
  Sparkles
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import estelImage from 'figma:asset/d8b1b79c9918d3d4a6cd73091e9b8a979ab511ff.png';
import karoImage from 'figma:asset/dc52e3f2d941d1a747f54b33e4933a9938c74d6b.png';
import nikiImage from 'figma:asset/f49b3d012c317bec730b62a0ae47b5621fa40ac6.png';
import orinImage from 'figma:asset/9d2219c92c5dcdc3c0d8ce430e2da4aba264e80a.png';
import turboImage from 'figma:asset/11464600c439aa9f3f2e8d58bdd401a64c29ac14.png';

interface DashboardHomePageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const helpers = [
  {
    id: 'esha',
    name: 'Esha',
    role: 'AI Recruiter',
    image: estelImage,
    color: 'from-purple-500 to-pink-500',
    stats: {
      tasksCompleted: 24,
      activeProjects: 3,
      performance: 95
    },
    recentActivity: [
      'Screened 15 candidates for Software Engineer role',
      'Scheduled 5 interviews for this week',
      'Updated job descriptions for 3 positions'
    ]
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success',
    image: karoImage,
    color: 'from-orange-500 to-yellow-500',
    stats: {
      tasksCompleted: 32,
      activeProjects: 5,
      performance: 98
    },
    recentActivity: [
      'Resolved 8 customer support tickets',
      'Conducted 3 onboarding sessions',
      'Sent 12 follow-up emails to clients'
    ]
  },
  {
    id: 'nivi',
    name: 'Nivi',
    role: 'Social Media Manager',
    image: nikiImage,
    color: 'from-blue-500 to-cyan-500',
    stats: {
      tasksCompleted: 45,
      activeProjects: 7,
      performance: 92
    },
    recentActivity: [
      'Posted 10 social media updates across platforms',
      'Analyzed engagement metrics for last week',
      'Created content calendar for next month'
    ]
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    image: orinImage,
    color: 'from-green-500 to-emerald-500',
    stats: {
      tasksCompleted: 18,
      activeProjects: 4,
      performance: 97
    },
    recentActivity: [
      'Generated Q4 performance report',
      'Analyzed customer behavior patterns',
      'Created 5 data visualization dashboards'
    ]
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    image: turboImage,
    color: 'from-pink-500 to-rose-500',
    stats: {
      tasksCompleted: 38,
      activeProjects: 6,
      performance: 94
    },
    recentActivity: [
      'Closed 5 new deals this week',
      'Followed up with 20 potential clients',
      'Updated sales pipeline and forecasts'
    ]
  }
];

export function DashboardHomePage({ onNavigate, onLogout }: DashboardHomePageProps) {
  const { currentWorkspace, currentProfile, user, usageData } = useApp();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState('');

  const totalTasksCompleted = helpers.reduce((acc, helper) => acc + helper.stats.tasksCompleted, 0);
  const totalActiveProjects = helpers.reduce((acc, helper) => acc + helper.stats.activeProjects, 0);
  const avgPerformance = Math.round(helpers.reduce((acc, helper) => acc + helper.stats.performance, 0) / helpers.length);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onLogout={onLogout}
          onNavigate={onNavigate}
          onCreateProfile={() => onNavigate('profiles')}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl text-gray-900 mb-2">
                Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {currentWorkspace && (
                  <span>
                    <span className="font-medium">{currentWorkspace.name}</span>
                    {currentProfile && <> • {currentProfile.name}</>}
                  </span>
                )}
              </p>
            </div>

            {/* AI Employees Cards */}
            <div className="mb-8 md:mb-12">
              <h2 className="text-gray-900 text-xl md:text-2xl mb-4 md:mb-6">AI Employees</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Esha Card - Light Purple */}
                <div className="relative bg-[#A78BFA] rounded-3xl p-1 shadow-2xl hover:shadow-[0_20px_60px_rgba(167,139,250,0.5)] transition-all hover:scale-[1.02] overflow-hidden group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-5 h-full flex flex-col items-center">
                    <div className="relative z-10 text-center mb-4">
                      <h3 className="text-2xl mb-1 tracking-tight text-gray-900">Esha</h3>
                      <p className="text-sm text-gray-600">AI Recruiter</p>
                    </div>
                    
                    <div className="relative w-full h-72 flex items-center justify-center mb-5 rounded-2xl overflow-hidden bg-[#A78BFA] shadow-xl">
                      <ImageWithFallback
                        src={estelImage}
                        alt="Esha"
                        className="relative z-10 w-full h-full object-cover"
                      />
                    </div>
                    
                    <button
                      onClick={() => onNavigate('esha-dashboard')}
                      className="relative z-10 w-full bg-[#A78BFA] hover:bg-[#A78BFA]/90 px-4 py-3 rounded-2xl text-white transition-all shadow-lg font-medium"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>

                {/* Karo Card - Brown */}
                <div className="relative bg-[#A0522D] rounded-3xl p-1 shadow-2xl hover:shadow-[0_20px_60px_rgba(160,82,45,0.5)] transition-all hover:scale-[1.02] overflow-hidden group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-5 h-full flex flex-col items-center">
                    <div className="relative z-10 text-center mb-4">
                      <h3 className="text-2xl mb-1 tracking-tight text-gray-900">Karo</h3>
                      <p className="text-sm text-gray-600">Customer Success</p>
                    </div>
                    
                    <div className="relative w-full h-72 flex items-center justify-center mb-5 rounded-2xl overflow-hidden bg-[#A0522D] shadow-xl">
                      <ImageWithFallback
                        src={karoImage}
                        alt="Karo"
                        className="relative z-10 w-full h-full object-cover"
                      />
                    </div>
                    
                    <button
                      onClick={() => onNavigate('karo-dashboard')}
                      className="relative z-10 w-full bg-[#A0522D] hover:bg-[#A0522D]/90 px-4 py-3 rounded-2xl text-white transition-all shadow-lg font-medium"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>

                {/* Nivi Card - Cyan */}
                <div className="relative bg-[#00BCD4] rounded-3xl p-1 shadow-2xl hover:shadow-[0_20px_60px_rgba(0,188,212,0.5)] transition-all hover:scale-[1.02] overflow-hidden group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-5 h-full flex flex-col items-center">
                    <div className="relative z-10 text-center mb-4">
                      <h3 className="text-2xl mb-1 tracking-tight text-gray-900">Nivi</h3>
                      <p className="text-sm text-gray-600">Social Media Manager</p>
                    </div>
                    
                    <div className="relative w-full h-72 flex items-center justify-center mb-5 rounded-2xl overflow-hidden bg-[#00BCD4] shadow-xl">
                      <ImageWithFallback
                        src={nikiImage}
                        alt="Nivi"
                        className="relative z-10 w-full h-full object-cover"
                      />
                    </div>
                    
                    <button
                      onClick={() => onNavigate('nivi-dashboard')}
                      className="relative z-10 w-full bg-[#00BCD4] hover:bg-[#00BCD4]/90 px-4 py-3 rounded-2xl text-white transition-all shadow-lg font-medium"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>

                {/* Orin Card - Green */}
                <div className="relative bg-[#10B981] rounded-3xl p-1 shadow-2xl hover:shadow-[0_20px_60px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] overflow-hidden group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-5 h-full flex flex-col items-center">
                    <div className="relative z-10 text-center mb-4">
                      <h3 className="text-2xl mb-1 tracking-tight text-gray-900">Orin</h3>
                      <p className="text-sm text-gray-600">Data Analyst</p>
                    </div>
                    
                    <div className="relative w-full h-72 flex items-center justify-center mb-5 rounded-2xl overflow-hidden bg-[#10B981] shadow-xl">
                      <ImageWithFallback
                        src={orinImage}
                        alt="Orin"
                        className="relative z-10 w-full h-full object-cover"
                      />
                    </div>
                    
                    <button
                      onClick={() => onNavigate('orin-dashboard')}
                      className="relative z-10 w-full bg-[#10B981] hover:bg-[#10B981]/90 px-4 py-3 rounded-2xl text-white transition-all shadow-lg font-medium"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>

                {/* Turbo Card - Orange */}
                <div className="relative bg-[#FF8A00] rounded-3xl p-1 shadow-2xl hover:shadow-[0_20px_60px_rgba(255,138,0,0.5)] transition-all hover:scale-[1.02] overflow-hidden group">
                  <div className="bg-white/95 backdrop-blur-xl rounded-[22px] p-5 h-full flex flex-col items-center">
                    <div className="relative z-10 text-center mb-4">
                      <h3 className="text-2xl mb-1 tracking-tight text-gray-900">Turbo</h3>
                      <p className="text-sm text-gray-600">Sales Specialist</p>
                    </div>
                    
                    <div className="relative w-full h-72 flex items-center justify-center mb-5 rounded-2xl overflow-hidden bg-[#FF8A00] shadow-xl">
                      <ImageWithFallback
                        src={turboImage}
                        alt="Turbo"
                        className="relative z-10 w-full h-full object-cover"
                      />
                    </div>
                    
                    <button
                      onClick={() => onNavigate('turbo-dashboard')}
                      className="relative z-10 w-full bg-[#FF8A00] hover:bg-[#FF8A00]/90 px-4 py-3 rounded-2xl text-white transition-all shadow-lg font-medium"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-gray-900 text-xl md:text-2xl">Your Current Employees</h2>
              <div className="flex gap-2 glass-card bg-white/50 backdrop-blur-xl rounded-xl p-1 border border-purple-200/50 shadow-md w-full sm:w-auto">
                <button
                  onClick={() => setTimeframe('today')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm transition-all ${
                    timeframe === 'today' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeframe('week')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm transition-all ${
                    timeframe === 'week' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm transition-all ${
                    timeframe === 'month' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Helpers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
              {helpers.map((helper) => (
                <div
                  key={helper.id}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-6 mb-6">
                    {/* Helper Image */}
                    <div className="w-24 h-24 flex-shrink-0">
                      <ImageWithFallback
                        src={helper.image}
                        alt={helper.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Helper Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-gray-900 text-xl mb-1">{helper.name}</h3>
                          <p className="text-purple-600 text-sm">{helper.role}</p>
                        </div>
                        <button
                          onClick={() => onNavigate(`${helper.id}-dashboard`)}
                          className="glass-card bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-xl hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-xl text-white text-sm transition-all border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.02]"
                        >
                          Open Chat
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Tasks</p>
                          <p className="text-gray-900">{helper.stats.tasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Projects</p>
                          <p className="text-gray-900">{helper.stats.activeProjects}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Performance</p>
                          <p className="text-green-500">{helper.stats.performance}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <p className="text-gray-600 text-sm mb-3">Recent Activity:</p>
                    <div className="space-y-2">
                      {helper.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-600">{activity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Stats (if available) */}
            {usageData && (
              <div className="mb-8 glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900">Usage This Month</h2>
                  <span className="text-sm text-gray-600">{currentWorkspace?.planTier.toUpperCase()} Plan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-gray-600">Credits</span>
                    </div>
                    <div className="text-2xl text-gray-900">
                      {usageData.creditsUsed.toLocaleString()} / {usageData.creditsTotal.toLocaleString()}
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                        style={{ width: `${(usageData.creditsUsed / usageData.creditsTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Calls Today</span>
                    </div>
                    <div className="text-2xl text-gray-900">{usageData.callsToday}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Spend Today</span>
                    </div>
                    <div className="text-2xl text-gray-900">${usageData.spendTodayUSD.toFixed(2)}</div>
                  </div>
                  {usageData.ttfbAvgMs && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        <span className="text-sm text-gray-600">Avg Response</span>
                      </div>
                      <div className="text-2xl text-gray-900">{usageData.ttfbAvgMs}ms</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-500/20">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    12%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">Tasks Completed</p>
                <p className="text-gray-900 text-3xl">{totalTasksCompleted}</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-500/20">
                    <Target className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    8%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">Active Projects</p>
                <p className="text-gray-900 text-3xl">{totalActiveProjects}</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    5%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">Avg Performance</p>
                <p className="text-gray-900 text-3xl">{avgPerformance}%</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-orange-500/20">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    15%
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">Time Saved</p>
                <p className="text-gray-900 text-3xl">142h</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-purple-200/50 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-gray-900 text-2xl mb-2">Need help with something?</h3>
                  <p className="text-gray-600">Chat with any of your AI employees to get started on a task</p>
                </div>
                <button 
                  onClick={() => onNavigate('helpers')}
                  className="glass-card bg-white/80 backdrop-blur-xl hover:bg-white border border-purple-200/50 text-gray-900 px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]"
                >
                  <MessageSquare className="w-5 h-5" />
                  Start New Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}