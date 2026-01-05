import { useState } from 'react';
import { motion } from 'motion/react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  Mail,
  FileText,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Zap,
  Phone,
  Share2,
  Video,
  Edit,
  Trash2,
  Bookmark,
  ExternalLink,
  ChevronDown,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface HistoryPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

interface ActivityItem {
  id: string;
  helper: {
    name: string;
    color: string;
    gradient: string;
    image: string;
  };
  action: string;
  category: 'message' | 'task' | 'integration' | 'document';
  description: string;
  timestamp: string;
  timeAgo: string;
  icon: any;
  iconColor: string;
  saved?: boolean;
  details?: string;
}

const activities: ActivityItem[] = [
  {
    id: '1',
    helper: {
      name: 'Niki',
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1761537265098-ab06313e1218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWFuJTIwYmlyZCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Generated Instagram content plan',
    category: 'task',
    description: 'Created 15 posts for next week with captions and hashtags',
    timestamp: '2024-12-08T10:30:00',
    timeAgo: '1 hour ago',
    icon: MessageCircle,
    iconColor: 'text-cyan-500',
    saved: true
  },
  {
    id: '2',
    helper: {
      name: 'Estel',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Screened candidates for Senior Developer role',
    category: 'task',
    description: 'Analyzed 15 resumes and shortlisted 5 top candidates',
    timestamp: '2024-12-08T09:15:00',
    timeAgo: '2 hours ago',
    icon: Users,
    iconColor: 'text-purple-500',
    saved: false
  },
  {
    id: '3',
    helper: {
      name: 'Turbo',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      image: 'https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Sent follow-up emails to prospects',
    category: 'message',
    description: 'Personalized outreach to 28 high-priority leads',
    timestamp: '2024-12-08T08:45:00',
    timeAgo: '3 hours ago',
    icon: Mail,
    iconColor: 'text-orange-500',
    saved: true
  },
  {
    id: '4',
    helper: {
      name: 'Orin',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      image: 'https://images.unsplash.com/photo-1689881199549-43015f799708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG93bCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Built Q4 revenue dashboard',
    category: 'document',
    description: 'Created interactive dashboard with sales metrics and trends',
    timestamp: '2024-12-08T06:20:00',
    timeAgo: '5 hours ago',
    icon: BarChart3,
    iconColor: 'text-green-500',
    saved: false
  },
  {
    id: '5',
    helper: {
      name: 'Karo',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1606704382773-a2875b6b931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBkb2clMjBjaGFyYWN0ZXIlMjAzZHxlbnwxfHx8fDE3NjQ3MzA5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Resolved 12 support tickets',
    category: 'task',
    description: 'Handled customer inquiries with 98% satisfaction rate',
    timestamp: '2024-12-08T05:10:00',
    timeAgo: '6 hours ago',
    icon: CheckCircle,
    iconColor: 'text-orange-500',
    saved: false
  },
  {
    id: '6',
    helper: {
      name: 'Niki',
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1761537265098-ab06313e1218?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWFuJTIwYmlyZCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Analyzed social media performance',
    category: 'task',
    description: 'Last month engagement up 34% across all platforms',
    timestamp: '2024-12-07T16:30:00',
    timeAgo: '1 day ago',
    icon: TrendingUp,
    iconColor: 'text-cyan-500',
    saved: true
  },
  {
    id: '7',
    helper: {
      name: 'Estel',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1651111139316-8f7ae50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXJwbGUlMjBlbGVwaGFudCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MHww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Scheduled 8 interviews',
    category: 'integration',
    description: 'Booked calendar slots with top candidates for this week',
    timestamp: '2024-12-07T14:15:00',
    timeAgo: '1 day ago',
    icon: Calendar,
    iconColor: 'text-purple-500',
    saved: false
  },
  {
    id: '8',
    helper: {
      name: 'Turbo',
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      image: 'https://images.unsplash.com/photo-1643598772821-314261780e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjB0aWdlciUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Closed 3 deals worth $45,000',
    category: 'task',
    description: 'Successfully moved opportunities through sales pipeline',
    timestamp: '2024-12-07T11:45:00',
    timeAgo: '1 day ago',
    icon: Target,
    iconColor: 'text-orange-500',
    saved: true
  },
  {
    id: '9',
    helper: {
      name: 'Karo',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1606704382773-a2875b6b931a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBkb2clMjBjaGFyYWN0ZXIlMjAzZHxlbnwxfHx8fDE3NjQ3MzA5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Onboarded 12 new customers',
    category: 'task',
    description: 'Guided new users through product setup and training',
    timestamp: '2024-12-06T15:20:00',
    timeAgo: '2 days ago',
    icon: Users,
    iconColor: 'text-orange-500',
    saved: false
  },
  {
    id: '10',
    helper: {
      name: 'Orin',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      image: 'https://images.unsplash.com/photo-1689881199549-43015f799708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMG93bCUyMGNoYXJhY3RlciUyMDNkfGVufDF8fHx8MTc2NDczMDk2MXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    action: 'Analyzed customer churn patterns',
    category: 'document',
    description: 'Identified key retention opportunities and risk factors',
    timestamp: '2024-12-06T10:30:00',
    timeAgo: '2 days ago',
    icon: BarChart3,
    iconColor: 'text-green-500',
    saved: false
  }
];

export function HistoryPage({ onBack, onNavigate, onLogout }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'message' | 'task' | 'integration' | 'document'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7days');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.helper.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || activity.category === selectedFilter;
    const matchesSaved = !showSavedOnly || activity.saved;
    return matchesSearch && matchesFilter && matchesSaved;
  });

  const savedActivities = activities.filter(a => a.saved).length;
  const totalActivities = activities.length;

  const groupedByDate = filteredActivities.reduce((groups: any, activity) => {
    const date = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey = '';
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {});

  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="history"
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
                  <History className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-text-primary text-4xl">Activity History</h1>
                  <p className="text-text-secondary">Track all actions across your AI helpers</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-wrap mb-6">
                <div className="glass-card px-4 py-2 bg-purple-500/10 backdrop-blur-xl border border-purple-500/20 rounded-full flex items-center gap-2 shadow-md">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-text-primary text-sm">{totalActivities} Total Activities</span>
                </div>
                <div className="glass-card px-4 py-2 bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-full flex items-center gap-2 shadow-md">
                  <Bookmark className="w-4 h-4 text-cyan-500" />
                  <span className="text-text-primary text-sm">{savedActivities} Saved</span>
                </div>
                <div className="glass-card px-4 py-2 bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-full flex items-center gap-2 shadow-md">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-text-primary text-sm">34% increase this week</span>
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
                    placeholder="Search activity..."
                    className="w-full glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-all shadow-md"
                  />
                </div>

                {/* Time Range */}
                <div className="relative">
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="glass-card px-4 py-4 pr-10 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl text-text-primary focus:outline-none focus:border-accent-primary transition-all shadow-md appearance-none cursor-pointer"
                  >
                    <option value="24hours">Last 24 hours</option>
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="all">All time</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
                </div>

                {/* Export */}
                <button className="glass-card px-6 py-2 bg-white/60 backdrop-blur-xl hover:bg-white/80 border border-white/50 text-text-primary rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <span className="hidden md:inline">Export</span>
                </button>
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {[
                  { id: 'all', label: 'All Activities', icon: Activity },
                  { id: 'message', label: 'Messages', icon: MessageCircle },
                  { id: 'task', label: 'Tasks', icon: CheckCircle },
                  { id: 'integration', label: 'Integrations', icon: Zap },
                  { id: 'document', label: 'Documents', icon: FileText }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id as any)}
                    className={`glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${
                      selectedFilter === filter.id
                        ? 'bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md'
                        : 'bg-white/50 backdrop-blur-xl hover:bg-white/70 text-text-secondary border border-white/50 shadow-sm'
                    }`}
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Saved Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                    showSavedOnly
                      ? 'bg-cyan-500/20 backdrop-blur-xl text-cyan-600 border border-cyan-500/30'
                      : 'bg-white/50 backdrop-blur-xl text-text-secondary border border-white/50'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${showSavedOnly ? 'fill-current' : ''}`} />
                  Saved Only
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-8">
              {Object.entries(groupedByDate).map(([date, dateActivities]: [string, any]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-text-primary text-xl">{date}</h2>
                    <div className="flex-1 h-px bg-border-soft"></div>
                  </div>

                  {/* Activities */}
                  <div className="space-y-4">
                    {dateActivities.map((activity: ActivityItem) => (
                      <motion.div
                        key={activity.id}
                        whileHover={{ x: 4 }}
                        className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex gap-4">
                          {/* Helper Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                              <img 
                                src={activity.helper.image} 
                                alt={activity.helper.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-${activity.helper.color}-500`}>{activity.helper.name}</span>
                                  <span className="text-text-tertiary">•</span>
                                  <span className="text-text-secondary">{activity.action}</span>
                                </div>
                                <p className="text-text-secondary text-sm">{activity.description}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button 
                                  className={`glass-card w-10 h-10 backdrop-blur-xl border rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                    activity.saved
                                      ? 'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30'
                                      : 'bg-white/50 border-white/50 hover:bg-white/70'
                                  }`}
                                >
                                  <Bookmark className={`w-4 h-4 ${activity.saved ? 'text-cyan-500 fill-current' : 'text-text-tertiary'}`} />
                                </button>
                                <button className="glass-card w-10 h-10 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl flex items-center justify-center transition-all shadow-sm">
                                  <ExternalLink className="w-4 h-4 text-text-tertiary" />
                                </button>
                              </div>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
                                <span className="text-xs text-text-tertiary capitalize">{activity.category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-text-tertiary" />
                                <span className="text-xs text-text-tertiary">{activity.timeAgo}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredActivities.length === 0 && (
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center shadow-lg">
                <History className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-text-primary text-xl mb-2">No activity found</h3>
                <p className="text-text-secondary">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}