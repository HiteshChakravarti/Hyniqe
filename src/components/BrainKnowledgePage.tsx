import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  Upload,
  FileText,
  Database,
  Globe,
  Search,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  Folder,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  File,
  Settings,
  Zap,
  TrendingUp,
  Users,
  Filter,
  Calendar,
  Tag,
  MoreVertical,
  Eye,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface BrainKnowledgePageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}

interface KnowledgeItem {
  id: string;
  name: string;
  type: 'document' | 'link' | 'image' | 'video' | 'folder';
  category: string;
  size?: string;
  uploadedDate: string;
  lastSynced?: string;
  source: string;
  tags: string[];
  usedBy: string[];
  icon: any;
}

const knowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    name: 'Brand Voice Guidelines.pdf',
    type: 'document',
    category: 'Brand & Voice',
    size: '2.4 MB',
    uploadedDate: '2 days ago',
    lastSynced: '1 hour ago',
    source: 'Uploaded',
    tags: ['brand', 'guidelines', 'voice'],
    usedBy: ['All Helpers'],
    icon: FileText
  },
  {
    id: '2',
    name: 'Product Overview',
    type: 'folder',
    category: 'Products & Services',
    uploadedDate: '1 week ago',
    lastSynced: '2 hours ago',
    source: 'Google Drive',
    tags: ['products', 'documentation'],
    usedBy: ['Karo', 'Turbo', 'Niki'],
    icon: Folder
  },
  {
    id: '3',
    name: 'Customer FAQs Database',
    type: 'link',
    category: 'Customer Data',
    uploadedDate: '3 days ago',
    lastSynced: '30 min ago',
    source: 'Notion',
    tags: ['customer', 'support', 'faq'],
    usedBy: ['Karo'],
    icon: LinkIcon
  },
  {
    id: '4',
    name: 'Sales Process Flowchart.png',
    type: 'image',
    category: 'Internal Processes',
    size: '1.8 MB',
    uploadedDate: '5 days ago',
    source: 'Uploaded',
    tags: ['sales', 'process'],
    usedBy: ['Turbo', 'Estel'],
    icon: ImageIcon
  },
  {
    id: '5',
    name: 'Product Demo Video',
    type: 'video',
    category: 'Products & Services',
    size: '45.2 MB',
    uploadedDate: '1 week ago',
    source: 'YouTube',
    tags: ['demo', 'video', 'product'],
    usedBy: ['Karo', 'Turbo', 'Niki'],
    icon: Video
  },
  {
    id: '6',
    name: 'Market Research Report.docx',
    type: 'document',
    category: 'Analytics & Data',
    size: '5.1 MB',
    uploadedDate: '4 days ago',
    lastSynced: '3 hours ago',
    source: 'Uploaded',
    tags: ['research', 'market', 'analytics'],
    usedBy: ['Orin', 'Niki'],
    icon: FileText
  },
  {
    id: '7',
    name: 'Company Culture Deck',
    type: 'document',
    category: 'Brand & Voice',
    size: '8.3 MB',
    uploadedDate: '2 weeks ago',
    source: 'Uploaded',
    tags: ['culture', 'brand', 'hr'],
    usedBy: ['Estel', 'All Helpers'],
    icon: FileText
  },
  {
    id: '8',
    name: 'Customer Testimonials',
    type: 'folder',
    category: 'Customer Data',
    uploadedDate: '1 week ago',
    lastSynced: '1 day ago',
    source: 'Google Drive',
    tags: ['testimonials', 'customer', 'feedback'],
    usedBy: ['Niki', 'Turbo'],
    icon: Folder
  }
];

const categories = [
  { id: 'all', name: 'All Knowledge', icon: Database },
  { id: 'brand', name: 'Brand & Voice', icon: Zap },
  { id: 'products', name: 'Products & Services', icon: FileText },
  { id: 'customer', name: 'Customer Data', icon: Users },
  { id: 'processes', name: 'Internal Processes', icon: Settings },
  { id: 'analytics', name: 'Analytics & Data', icon: TrendingUp }
];

const dataSources = [
  { name: 'Google Drive', connected: true, items: 12, icon: Folder },
  { name: 'Notion', connected: true, items: 8, icon: FileText },
  { name: 'Dropbox', connected: false, items: 0, icon: Database },
  { name: 'YouTube', connected: true, items: 3, icon: Video }
];

export function BrainKnowledgePage({ onBack, onNavigate, onLogout }: BrainKnowledgePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'document' | 'link' | 'image' | 'video' | 'folder'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { currentWorkspace } = useApp();

  // Filter knowledge items
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('Upload file');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="brain-knowledge"
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
                <div className="glass-card w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-text-primary text-4xl">HYNIQE Brain</h1>
                  <p className="text-text-secondary">Central knowledge base for all AI helpers</p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card bg-gradient-to-br from-cyan-600/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-lg">
                  <FileText className="w-8 h-8 text-cyan-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">{knowledgeItems.length}</p>
                  <p className="text-text-secondary text-sm">Total Documents</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-lg">
                  <Database className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">68.1 MB</p>
                  <p className="text-text-secondary text-sm">Storage Used</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-green-600/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="glass-card px-2 py-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full">
                      <span className="text-green-600 text-xs">Up to date</span>
                    </div>
                  </div>
                  <p className="text-3xl text-text-primary mb-1">100%</p>
                  <p className="text-text-secondary text-sm">Sync Status</p>
                </div>

                <div className="glass-card bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
                  <p className="text-3xl text-text-primary mb-1">75%</p>
                  <p className="text-text-secondary text-sm">Coverage</p>
                </div>
              </div>

              {/* Search & Actions */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search knowledge base..."
                    className="w-full glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl pl-12 pr-4 py-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-all shadow-md"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={handleFileUpload}
                    className="glass-card px-6 py-2 bg-gradient-to-r from-accent-primary/80 to-accent-tertiary/80 backdrop-blur-xl hover:from-accent-primary hover:to-accent-tertiary text-white rounded-xl transition-all border border-white/20 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="hidden md:inline">Upload</span>
                  </button>
                  <button className="glass-card px-4 py-2 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl transition-all shadow-sm">
                    <RefreshCw className="w-5 h-5 text-text-secondary" />
                  </button>
                  <button className="glass-card px-4 py-2 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl transition-all shadow-sm">
                    <Settings className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
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

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Knowledge Items - Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-text-primary text-2xl mb-4">Knowledge Library</h2>
                
                {/* Upload Zone */}
                <div className="glass-card bg-gradient-to-br from-cyan-600/5 to-blue-600/5 backdrop-blur-xl border-2 border-dashed border-cyan-500/30 rounded-2xl p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-all shadow-lg">
                  <Upload className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                  <h3 className="text-text-primary mb-2">Drop files here or click to upload</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Support for PDFs, docs, images, videos, and more
                  </p>
                  <button className="glass-card px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 backdrop-blur-xl text-white rounded-xl transition-all border border-white/20 shadow-md hover:shadow-lg">
                    Browse Files
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 4 }}
                      className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`glass-card w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                          item.type === 'document' ? 'bg-blue-500/10 border border-blue-500/20' :
                          item.type === 'folder' ? 'bg-amber-500/10 border border-amber-500/20' :
                          item.type === 'link' ? 'bg-purple-500/10 border border-purple-500/20' :
                          item.type === 'image' ? 'bg-pink-500/10 border border-pink-500/20' :
                          'bg-cyan-500/10 border border-cyan-500/20'
                        }`}>
                          <item.icon className={`w-6 h-6 ${
                            item.type === 'document' ? 'text-blue-500' :
                            item.type === 'folder' ? 'text-amber-500' :
                            item.type === 'link' ? 'text-purple-500' :
                            item.type === 'image' ? 'text-pink-500' :
                            'text-cyan-500'
                          }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-text-primary mb-1 truncate">{item.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-text-tertiary">
                            <span>{item.category}</span>
                            {item.size && (
                              <>
                                <span>•</span>
                                <span>{item.size}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{item.uploadedDate}</span>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="glass-card px-2 py-0.5 bg-white/40 backdrop-blur-sm border border-white/50 rounded text-xs text-text-secondary shadow-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Used By */}
                        <div className="hidden md:block text-right">
                          <p className="text-xs text-text-tertiary mb-1">Used by:</p>
                          <p className="text-sm text-text-secondary">{item.usedBy.join(', ')}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button className="glass-card w-10 h-10 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl flex items-center justify-center transition-all shadow-sm">
                            <Eye className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button className="glass-card w-10 h-10 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 rounded-xl flex items-center justify-center transition-all shadow-sm">
                            <MoreVertical className="w-4 h-4 text-text-secondary" />
                          </button>
                        </div>
                      </div>

                      {/* Last Synced */}
                      {item.lastSynced && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/30">
                          <RefreshCw className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-text-tertiary">Last synced {item.lastSynced}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Data Sources */}
                <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-text-primary mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-500" />
                    Connected Sources
                  </h3>
                  <div className="space-y-3">
                    {dataSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="glass-card w-10 h-10 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg flex items-center justify-center shadow-sm">
                            <source.icon className="w-5 h-5 text-text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm text-text-primary">{source.name}</p>
                            {source.connected && (
                              <p className="text-xs text-text-tertiary">{source.items} items</p>
                            )}
                          </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full ${source.connected ? 'bg-green-500' : 'bg-gray-300'} relative cursor-pointer shadow-inner`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${source.connected ? 'right-1' : 'left-1'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="glass-card w-full mt-4 py-3 bg-white/50 backdrop-blur-xl hover:bg-white/70 border border-white/50 text-text-primary rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Source
                  </button>
                </div>

                {/* Knowledge Coverage */}
                <div className="glass-card bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-text-primary mb-4">Knowledge Coverage</h3>
                  
                  <div className="space-y-3">
                    {[
                      { area: 'Brand Voice', coverage: 90, color: 'purple' },
                      { area: 'Products', coverage: 85, color: 'cyan' },
                      { area: 'Customer Data', coverage: 70, color: 'orange' },
                      { area: 'Processes', coverage: 60, color: 'green' }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-secondary">{item.area}</span>
                          <span className="text-sm text-text-primary">{item.coverage}%</span>
                        </div>
                        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 transition-all`}
                            style={{ width: `${item.coverage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-text-primary mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'Added Brand Guidelines', time: '2h ago', icon: Plus },
                      { action: 'Synced Google Drive', time: '5h ago', icon: RefreshCw },
                      { action: 'Updated FAQ Database', time: '1d ago', icon: Edit }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-border-soft last:border-0 last:pb-0">
                        <div className="glass-card w-8 h-8 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <activity.icon className="w-4 h-4 text-text-secondary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-text-primary">{activity.action}</p>
                          <p className="text-xs text-text-tertiary">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto-Sync Settings */}
                <div className="glass-card bg-gradient-to-br from-green-600/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-text-primary text-sm">Auto-Sync</p>
                        <p className="text-text-tertiary text-xs">Real-time updates</p>
                      </div>
                    </div>
                    <div className="w-12 h-7 rounded-full bg-green-500 relative cursor-pointer shadow-inner">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Knowledge syncs automatically across all helpers every 30 minutes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}