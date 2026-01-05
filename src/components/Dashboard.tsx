import { useState } from 'react';
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
  Target
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import estelImage from 'figma:asset/d8b1b79c9918d3d4a6cd73091e9b8a979ab511ff.png';
import karoImage from 'figma:asset/dc52e3f2d941d1a747f54b33e4933a9938c74d6b.png';
import nikiImage from 'figma:asset/f49b3d012c317bec730b62a0ae47b5621fa40ac6.png';
import orinImage from 'figma:asset/9d2219c92c5dcdc3c0d8ce430e2da4aba264e80a.png';
import turboImage from 'figma:asset/11464600c439aa9f3f2e8d58bdd401a64c29ac14.png';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
  userName?: string;
}

const helpers = [
  {
    id: 'estel',
    name: 'Estel',
    role: 'Recruiter',
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
    id: 'niki',
    name: 'Niki',
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
    color: 'from-orange-500 to-red-500',
    stats: {
      tasksCompleted: 38,
      activeProjects: 6,
      performance: 94
    },
    recentActivity: [
      'Qualified 20 new leads',
      'Closed 3 deals worth $45,000',
      'Updated pipeline with 15 prospects'
    ]
  }
];

export function Dashboard({ setCurrentPage, userName = 'User' }: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');

  const totalTasksCompleted = helpers.reduce((acc, helper) => acc + helper.stats.tasksCompleted, 0);
  const totalActiveProjects = helpers.reduce((acc, helper) => acc + helper.stats.activeProjects, 0);
  const avgPerformance = Math.round(helpers.reduce((acc, helper) => acc + helper.stats.performance, 0) / helpers.length);

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-text-primary text-4xl mb-2">Welcome back, {userName}! 👋</h1>
          <p className="text-text-secondary">Here's what your AI team has been up to</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-500/20">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-green-500 text-sm flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                12%
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-1">Tasks Completed</p>
            <p className="text-text-primary text-3xl">{totalTasksCompleted}</p>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-purple-500/20">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-green-500 text-sm flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                8%
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-1">Active Projects</p>
            <p className="text-text-primary text-3xl">{totalActiveProjects}</p>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-green-500 text-sm flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                5%
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-1">Avg Performance</p>
            <p className="text-text-primary text-3xl">{avgPerformance}%</p>
          </div>

          <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-orange-500/20">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-green-500 text-sm flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                15%
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-1">Time Saved</p>
            <p className="text-text-primary text-3xl">142h</p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text-primary text-2xl">Your AI Employees</h2>
          <div className="flex gap-2 glass-card bg-white/50 backdrop-blur-xl rounded-xl p-1 border border-white/50 shadow-md">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                timeframe === 'today' 
                  ? 'glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                timeframe === 'week' 
                  ? 'glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                timeframe === 'month' 
                  ? 'glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Helpers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {helpers.map((helper) => (
            <div
              key={helper.id}
              className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 hover:border-accent-primary/30 hover:shadow-xl transition-all"
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
                      <h3 className="text-text-primary text-xl mb-1">{helper.name}</h3>
                      <p className="text-accent-primary text-sm">{helper.role}</p>
                    </div>
                    <button
                      onClick={() => setCurrentPage(`helper-dashboard-${helper.id}`)}
                      className="glass-card bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary px-4 py-2 rounded-xl text-white text-sm transition-all border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.02]"
                    >
                      Open Chat
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-text-tertiary text-xs mb-1">Tasks</p>
                      <p className="text-text-primary">{helper.stats.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-text-tertiary text-xs mb-1">Projects</p>
                      <p className="text-text-primary">{helper.stats.activeProjects}</p>
                    </div>
                    <div>
                      <p className="text-text-tertiary text-xs mb-1">Performance</p>
                      <p className="text-green-500">{helper.stats.performance}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <p className="text-text-secondary text-sm mb-3">Recent Activity:</p>
                <div className="space-y-2">
                  {helper.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-text-secondary">{activity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-card bg-gradient-to-br from-accent-primary/20 to-accent-tertiary/20 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-text-primary text-2xl mb-2">Need help with something?</h3>
              <p className="text-text-secondary">Chat with any of your AI employees to get started on a task</p>
            </div>
            <button className="glass-card bg-white/80 backdrop-blur-xl hover:bg-white border border-white/50 text-text-primary px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]">
              <MessageSquare className="w-5 h-5" />
              Start New Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}