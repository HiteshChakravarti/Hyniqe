import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Search,
  Filter,
  Mail,
  Calendar,
  FileText,
  Database,
  MessageSquare,
  Phone,
  Share2,
  BarChart3,
  Globe,
  Video,
  Image as ImageIcon,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  CheckCircle,
  Plus,
  Star,
  TrendingUp,
  Users,
  Sparkles,
  Clock,
  Download,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface PowerUpPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

type Category = 'all' | 'productivity' | 'communication' | 'analytics' | 'sales' | 'marketing';

interface PowerUp {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: any;
  color: string;
  gradient: string;
  installed: boolean;
  featured: boolean;
  rating: number;
  users: string;
  compatibleHelpers: string[];
  price: 'free' | 'premium';
}

const powerUps: PowerUp[] = [
  {
    id: 'gmail',
    name: 'Gmail Integration',
    description: 'Send, receive, and manage emails directly through your AI helpers',
    category: 'communication',
    icon: Mail,
    color: 'bg-red-500',
    gradient: 'from-red-500 to-pink-500',
    installed: true,
    featured: true,
    rating: 4.9,
    users: '12K+',
    compatibleHelpers: ['Karo', 'Turbo', 'Estel'],
    price: 'free'
  },
  {
    id: 'calendar',
    name: 'Calendar Sync',
    description: 'Schedule meetings, set reminders, and manage your calendar seamlessly',
    category: 'productivity',
    icon: Calendar,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    installed: true,
    featured: true,
    rating: 4.8,
    users: '10K+',
    compatibleHelpers: ['Estel', 'Karo', 'Turbo'],
    price: 'free'
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Create, edit, and analyze spreadsheet data with your AI team',
    category: 'analytics',
    icon: FileText,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-500',
    installed: true,
    featured: false,
    rating: 4.7,
    users: '8K+',
    compatibleHelpers: ['Orin', 'Turbo'],
    price: 'free'
  },
  {
    id: 'slack',
    name: 'Slack Bot',
    description: 'Get instant notifications and interact with helpers in Slack',
    category: 'communication',
    icon: MessageSquare,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    installed: false,
    featured: true,
    rating: 4.9,
    users: '15K+',
    compatibleHelpers: ['All Helpers'],
    price: 'premium'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Connector',
    description: 'Source candidates, post updates, and manage your professional network',
    category: 'sales',
    icon: Linkedin,
    color: 'bg-blue-600',
    gradient: 'from-blue-600 to-blue-700',
    installed: false,
    featured: true,
    rating: 4.8,
    users: '9K+',
    compatibleHelpers: ['Estel', 'Turbo', 'Niki'],
    price: 'premium'
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights with custom dashboards and predictive analytics',
    category: 'analytics',
    icon: BarChart3,
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-red-500',
    installed: false,
    featured: true,
    rating: 4.9,
    users: '6K+',
    compatibleHelpers: ['Orin'],
    price: 'premium'
  },
  {
    id: 'instagram',
    name: 'Instagram Manager',
    description: 'Schedule posts, analyze engagement, and grow your Instagram presence',
    category: 'marketing',
    icon: Instagram,
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-purple-500',
    installed: false,
    featured: false,
    rating: 4.7,
    users: '11K+',
    compatibleHelpers: ['Niki'],
    price: 'premium'
  },
  {
    id: 'twitter',
    name: 'Twitter/X Integration',
    description: 'Automate tweets, monitor mentions, and engage with your audience',
    category: 'marketing',
    icon: Twitter,
    color: 'bg-sky-500',
    gradient: 'from-sky-500 to-blue-500',
    installed: false,
    featured: false,
    rating: 4.6,
    users: '7K+',
    compatibleHelpers: ['Niki'],
    price: 'free'
  },
  {
    id: 'zoom',
    name: 'Video Calls',
    description: 'Schedule and manage video meetings with automatic transcription',
    category: 'communication',
    icon: Video,
    color: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-purple-500',
    installed: false,
    featured: false,
    rating: 4.8,
    users: '13K+',
    compatibleHelpers: ['Estel', 'Karo'],
    price: 'free'
  },
  {
    id: 'crm',
    name: 'CRM Integration',
    description: 'Connect with Salesforce, HubSpot, and other CRM platforms',
    category: 'sales',
    icon: Database,
    color: 'bg-teal-500',
    gradient: 'from-teal-500 to-cyan-500',
    installed: false,
    featured: true,
    rating: 4.9,
    users: '14K+',
    compatibleHelpers: ['Turbo', 'Karo'],
    price: 'premium'
  },
  {
    id: 'phone',
    name: 'Phone System',
    description: 'Make calls, send SMS, and manage phone communications',
    category: 'communication',
    icon: Phone,
    color: 'bg-green-600',
    gradient: 'from-green-600 to-emerald-600',
    installed: false,
    featured: false,
    rating: 4.5,
    users: '5K+',
    compatibleHelpers: ['Turbo', 'Karo'],
    price: 'premium'
  },
  {
    id: 'content',
    name: 'Content Generator',
    description: 'AI-powered content creation for blogs, social media, and more',
    category: 'marketing',
    icon: Sparkles,
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    installed: false,
    featured: false,
    rating: 4.8,
    users: '10K+',
    compatibleHelpers: ['Niki'],
    price: 'premium'
  }
];

const categories = [
  { id: 'all', name: 'All Power-Ups', icon: Zap },
  { id: 'productivity', name: 'Productivity', icon: Clock },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'sales', name: 'Sales', icon: TrendingUp },
  { id: 'marketing', name: 'Marketing', icon: Share2 }
];

export function PowerUpsPage({ onBack, onNavigate, onLogout }: PowerUpPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const { currentWorkspace } = useApp();

  // Filter power-ups
  const installedPowerUps = powerUps.filter(p => p.installed);
  const featuredPowerUps = powerUps.filter(p => p.featured && !p.installed);
  const filteredPowerUps = powerUps.filter(powerUp => {
    const matchesSearch = powerUp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          powerUp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || powerUp.category === selectedCategory;
    return matchesSearch && matchesCategory && !powerUp.installed;
  });

  const handleInstall = (powerUpId: string) => {
    // TODO: Implement power-up installation
    console.log('Installing power-up:', powerUpId);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="powerups"
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
                <div className="glass-card w-14 h-14 bg-gradient-to-br from-accent-primary to-accent-tertiary backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-text-primary text-4xl">Power-Ups</h1>
                  <p className="text-text-secondary">Supercharge your AI helpers with integrations</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-wrap mb-6">
                <div className="glass-card px-4 py-2 bg-green-500/10 backdrop-blur-xl border border-green-500/20 rounded-full flex items-center gap-2 shadow-md">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-text-primary text-sm">{installedPowerUps.length} Installed</span>
                </div>
                <div className="glass-card px-4 py-2 bg-accent-primary/10 backdrop-blur-xl border border-accent-primary/20 rounded-full flex items-center gap-2 shadow-md">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span className="text-text-primary text-sm">{powerUps.length} Available</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search power-ups..."
                  className="w-full glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-all shadow-md"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as Category)}
                    className={`glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl text-white border border-white/20 shadow-md'
                        : 'bg-white/50 backdrop-blur-xl hover:bg-white/70 text-text-secondary border border-white/50 shadow-sm'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Installed Power-Ups */}
            {installedPowerUps.length > 0 && selectedCategory === 'all' && (
              <section className="mb-12">
                <h2 className="text-text-primary text-2xl mb-6">My Power-Ups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {installedPowerUps.map((powerUp) => (
                    <motion.div
                      key={powerUp.id}
                      whileHover={{ y: -4 }}
                      className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                    >
                      {/* Icon & Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`glass-card w-14 h-14 bg-gradient-to-br ${powerUp.gradient} backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shadow-md`}>
                          <powerUp.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="glass-card px-3 py-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 text-xs">Installed</span>
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="text-text-primary text-lg mb-2">{powerUp.name}</h3>
                      <p className="text-text-secondary text-sm mb-4">{powerUp.description}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-text-primary text-sm">{powerUp.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary text-sm">{powerUp.users}</span>
                        </div>
                      </div>

                      {/* Compatible Helpers */}
                      <div className="mb-4">
                        <p className="text-text-tertiary text-xs mb-2">Compatible with:</p>
                        <div className="flex flex-wrap gap-1">
                          {powerUp.compatibleHelpers.map((helper, idx) => (
                            <span key={idx} className="glass-card px-2 py-1 bg-white/50 backdrop-blur-sm border border-white/50 rounded-lg text-text-secondary text-xs shadow-sm">
                              {helper}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="glass-card w-full bg-white/80 backdrop-blur-xl hover:bg-white border border-white/50 text-text-primary py-2 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02]">
                        Manage
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Power-Ups */}
            {featuredPowerUps.length > 0 && selectedCategory === 'all' && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-accent-primary" />
                  <h2 className="text-text-primary text-2xl">Featured Power-Ups</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPowerUps.map((powerUp) => (
                    <motion.div
                      key={powerUp.id}
                      whileHover={{ y: -4 }}
                      className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
                    >
                      {/* Premium Badge */}
                      {powerUp.price === 'premium' && (
                        <div className="absolute top-4 right-4 glass-card px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full shadow-sm">
                          <span className="text-amber-600 text-xs">Premium</span>
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`glass-card w-14 h-14 bg-gradient-to-br ${powerUp.gradient} backdrop-blur-xl rounded-xl flex items-center justify-center mb-4 border border-white/20 shadow-md`}>
                        <powerUp.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Info */}
                      <h3 className="text-text-primary text-lg mb-2">{powerUp.name}</h3>
                      <p className="text-text-secondary text-sm mb-4">{powerUp.description}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-text-primary text-sm">{powerUp.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary text-sm">{powerUp.users}</span>
                        </div>
                      </div>

                      {/* Compatible Helpers */}
                      <div className="mb-4">
                        <p className="text-text-tertiary text-xs mb-2">Compatible with:</p>
                        <div className="flex flex-wrap gap-1">
                          {powerUp.compatibleHelpers.map((helper, idx) => (
                            <span key={idx} className="glass-card px-2 py-1 bg-white/50 backdrop-blur-sm border border-white/50 rounded-lg text-text-secondary text-xs shadow-sm">
                              {helper}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button 
                        onClick={() => handleInstall(powerUp.id)}
                        className="glass-card w-full bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white py-2 rounded-xl text-sm transition-all border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Install Power-Up
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* All Power-Ups / Filtered Results */}
            <section>
              <h2 className="text-text-primary text-2xl mb-6">
                {selectedCategory === 'all' ? 'All Power-Ups' : `${categories.find(c => c.id === selectedCategory)?.name} Power-Ups`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPowerUps.map((powerUp) => (
                  <motion.div
                    key={powerUp.id}
                    whileHover={{ y: -4 }}
                    className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
                  >
                    {/* Installed Badge */}
                    {powerUp.installed && (
                      <div className="absolute top-4 right-4 glass-card px-3 py-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-600 text-xs">Installed</span>
                      </div>
                    )}

                    {/* Premium Badge */}
                    {!powerUp.installed && powerUp.price === 'premium' && (
                      <div className="absolute top-4 right-4 glass-card px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full shadow-sm">
                        <span className="text-amber-600 text-xs">Premium</span>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`glass-card w-14 h-14 bg-gradient-to-br ${powerUp.gradient} backdrop-blur-xl rounded-xl flex items-center justify-center mb-4 border border-white/20 shadow-md`}>
                      <powerUp.icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Info */}
                    <h3 className="text-text-primary text-lg mb-2">{powerUp.name}</h3>
                    <p className="text-text-secondary text-sm mb-4">{powerUp.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-text-primary text-sm">{powerUp.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-text-tertiary" />
                        <span className="text-text-secondary text-sm">{powerUp.users}</span>
                      </div>
                    </div>

                    {/* Compatible Helpers */}
                    <div className="mb-4">
                      <p className="text-text-tertiary text-xs mb-2">Compatible with:</p>
                      <div className="flex flex-wrap gap-1">
                        {powerUp.compatibleHelpers.map((helper, idx) => (
                          <span key={idx} className="glass-card px-2 py-1 bg-white/50 backdrop-blur-sm border border-white/50 rounded-lg text-text-secondary text-xs shadow-sm">
                            {helper}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    {powerUp.installed ? (
                      <button className="glass-card w-full bg-white/80 backdrop-blur-xl hover:bg-white border border-white/50 text-text-primary py-2 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02]">
                        Manage
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleInstall(powerUp.id)}
                        className="glass-card w-full bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white py-2 rounded-xl text-sm transition-all border border-white/20 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Install Power-Up
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* No Results */}
              {filteredPowerUps.length === 0 && (
                <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-12 text-center shadow-lg">
                  <Search className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                  <h3 className="text-text-primary text-xl mb-2">No power-ups found</h3>
                  <p className="text-text-secondary">Try adjusting your search or filters</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}