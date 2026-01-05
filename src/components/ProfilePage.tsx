import { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Upload,
  Shield,
  Key,
  Download,
  Trash2,
  Check,
  Globe,
  Clock,
  AlertCircle,
  Zap,
  Users,
  Brain,
  MessageSquare,
  Database,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  Edit2,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface ProfilePageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
}

export function ProfilePage({ onBack, onNavigate, onLogout, userName = 'Alex Johnson', userEmail = 'alex.johnson@company.com' }: ProfilePageProps) {
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Mock user data
  const [profileData, setProfileData] = useState({
    name: userName,
    email: userEmail,
    phone: '+1 (555) 123-4567',
    jobTitle: 'Marketing Director',
    company: 'Acme Corporation',
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    bio: 'Passionate about AI-powered marketing and automation. Leading digital transformation initiatives.',
    memberSince: 'January 2024',
    plan: 'Pro',
    linkedin: 'linkedin.com/in/alexjohnson',
    twitter: '@alexjohnson'
  });

  const stats = {
    activeEmployees: 5,
    powerUpsInstalled: 8,
    knowledgeItems: 24,
    conversationsMonth: 156,
    storageUsed: 2.4,
    storageTotal: 10
  };

  const connectedAccounts = [
    { name: 'Google Workspace', icon: Mail, connected: true, lastSync: '2 hours ago' },
    { name: 'Slack', icon: MessageSquare, connected: true, lastSync: '1 day ago' },
    { name: 'Microsoft 365', icon: Database, connected: false, lastSync: null },
    { name: 'Salesforce', icon: Briefcase, connected: false, lastSync: null },
    { name: 'LinkedIn', icon: Linkedin, connected: true, lastSync: '3 days ago' }
  ];

  const activeSessions = [
    { device: 'Chrome on MacBook Pro', location: 'San Francisco, CA', lastActive: 'Active now', current: true },
    { device: 'Safari on iPhone 15', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
    { device: 'Chrome on Windows', location: 'New York, NY', lastActive: '1 day ago', current: false }
  ];

  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="profile"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {onNavigate && (
          <DashboardHeader
            onLogout={onLogout}
            onNavigate={onNavigate}
            onCreateProfile={() => onNavigate('profiles')}
          />
        )}

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Profile Header Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-400/30 rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-500/5 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 ring-4 ring-white/20">
                    <User className="w-16 h-16 text-white" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-white/90 backdrop-blur-xl rounded-xl flex items-center justify-center border border-purple-400/30 shadow-lg hover:bg-white transition-all hover:scale-110 group">
                    <Upload className="w-5 h-5 text-purple-600" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-4xl text-text-primary mb-1">{profileData.name}</h1>
                      <p className="text-text-secondary text-lg flex items-center gap-2">
                        {profileData.jobTitle} at {profileData.company}
                      </p>
                    </div>
                    <div className="glass-card px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/30 rounded-full shadow-lg">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                        {profileData.plan} Plan
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-500" />
                      <span>{profileData.email}</span>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>Member since {profileData.memberSince}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Personal Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl text-text-primary flex items-center gap-2">
                      <User className="w-6 h-6 text-purple-500" />
                      Personal Information
                    </h2>
                    <button 
                      onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                      className="glass-card px-4 py-2 bg-purple-500/10 backdrop-blur-xl border border-purple-400/30 rounded-xl text-purple-600 hover:bg-purple-500/20 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {isEditingPersonal ? (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Full Name</label>
                      <input 
                        type="text" 
                        value={profileData.name}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Email Address</label>
                      <div className="flex items-center justify-between">
                        <input 
                          type="email" 
                          value={profileData.email}
                          disabled
                          className="flex-1 bg-transparent text-text-primary outline-none cursor-default"
                        />
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phone}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Job Title</label>
                      <input 
                        type="text" 
                        value={profileData.jobTitle}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Company</label>
                      <input 
                        type="text" 
                        value={profileData.company}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block">Location</label>
                      <input 
                        type="text" 
                        value={profileData.location}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 md:col-span-2">
                      <label className="text-xs text-text-secondary mb-1 block">Bio</label>
                      <textarea 
                        value={profileData.bio}
                        disabled={!isEditingPersonal}
                        rows={2}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default resize-none"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block flex items-center gap-2">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </label>
                      <input 
                        type="text" 
                        value={profileData.linkedin}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>

                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <label className="text-xs text-text-secondary mb-1 block flex items-center gap-2">
                        <Twitter className="w-3 h-3" />
                        Twitter
                      </label>
                      <input 
                        type="text" 
                        value={profileData.twitter}
                        disabled={!isEditingPersonal}
                        className="w-full bg-transparent text-text-primary outline-none disabled:cursor-default"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Connected Accounts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl"
                >
                  <h2 className="text-2xl text-text-primary mb-6 flex items-center gap-2">
                    <LinkIcon className="w-6 h-6 text-purple-500" />
                    Connected Accounts
                  </h2>

                  <div className="space-y-3">
                    {connectedAccounts.map((account) => (
                      <div 
                        key={account.name}
                        className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center justify-between hover:bg-white/60 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            account.connected 
                              ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30' 
                              : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30'
                          }`}>
                            <account.icon className={`w-6 h-6 ${account.connected ? 'text-green-600' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{account.name}</p>
                            {account.connected ? (
                              <p className="text-xs text-text-secondary">Last synced {account.lastSync}</p>
                            ) : (
                              <p className="text-xs text-text-secondary">Not connected</p>
                            )}
                          </div>
                        </div>
                        {account.connected ? (
                          <button className="px-4 py-2 bg-red-500/10 backdrop-blur-xl border border-red-400/30 rounded-xl text-red-600 hover:bg-red-500/20 transition-all text-sm shadow-md">
                            Disconnect
                          </button>
                        ) : (
                          <button className="px-4 py-2 bg-purple-500/10 backdrop-blur-xl border border-purple-400/30 rounded-xl text-purple-600 hover:bg-purple-500/20 transition-all text-sm shadow-md">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Security & Privacy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl"
                >
                  <h2 className="text-2xl text-text-primary mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-500" />
                    Security & Privacy
                  </h2>

                  <div className="space-y-4">
                    {/* Two-Factor Authentication */}
                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-400/30">
                          <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">Two-Factor Authentication</p>
                          <p className="text-xs text-text-secondary">Add an extra layer of security</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className={`relative w-14 h-7 rounded-full transition-all ${
                          twoFactorEnabled 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                            : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          twoFactorEnabled ? 'translate-x-7' : ''
                        }`}></div>
                      </button>
                    </div>

                    {/* Change Password */}
                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center justify-between hover:bg-white/60 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-400/30">
                          <Key className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">Change Password</p>
                          <p className="text-xs text-text-secondary">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-purple-500/10 backdrop-blur-xl border border-purple-400/30 rounded-xl text-purple-600 hover:bg-purple-500/20 transition-all text-sm shadow-md">
                        Update
                      </button>
                    </div>

                    {/* Active Sessions */}
                    <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-text-primary font-medium">Active Sessions</p>
                          <p className="text-xs text-text-secondary">{activeSessions.length} active devices</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {activeSessions.map((session, index) => (
                          <div key={index} className="flex items-center justify-between text-sm border-t border-white/30 pt-2">
                            <div className="flex-1">
                              <p className="text-text-primary">{session.device}</p>
                              <p className="text-xs text-text-secondary">{session.location} • {session.lastActive}</p>
                            </div>
                            {!session.current && (
                              <button className="text-red-600 hover:text-red-700 text-xs">Revoke</button>
                            )}
                            {session.current && (
                              <span className="text-xs text-green-600">Current</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Download Data */}
                    <button className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center justify-between hover:bg-white/60 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center border border-green-400/30">
                          <Download className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-text-primary font-medium">Download My Data</p>
                          <p className="text-xs text-text-secondary">Export all your account data</p>
                        </div>
                      </div>
                    </button>

                    {/* Delete Account */}
                    <button className="w-full glass-card bg-red-500/5 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 flex items-center justify-between hover:bg-red-500/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center border border-red-400/30">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-red-600 font-medium">Delete Account</p>
                          <p className="text-xs text-red-500/70">Permanently delete your account and data</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Stats & Quick Info */}
              <div className="space-y-6">
                
                {/* Account Overview Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl"
                >
                  <h2 className="text-xl text-text-primary mb-4">Account Overview</h2>
                  
                  <div className="space-y-4">
                    <div className="glass-card bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Active Employees</span>
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-3xl text-text-primary">{stats.activeEmployees}/5</p>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-pink-500/10 to-pink-600/10 backdrop-blur-xl border border-pink-400/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Power-Ups</span>
                        <Zap className="w-4 h-4 text-pink-500" />
                      </div>
                      <p className="text-3xl text-text-primary">{stats.powerUpsInstalled}/12</p>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Knowledge Items</span>
                        <Brain className="w-4 h-4 text-cyan-500" />
                      </div>
                      <p className="text-3xl text-text-primary">{stats.knowledgeItems}</p>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-xl border border-orange-400/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Conversations</span>
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-3xl text-text-primary">{stats.conversationsMonth}</p>
                      <p className="text-xs text-text-secondary mt-1">This month</p>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl border border-green-400/30 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Storage</span>
                        <Database className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl text-text-primary mb-2">{stats.storageUsed}GB / {stats.storageTotal}GB</p>
                      <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                          style={{ width: `${(stats.storageUsed / stats.storageTotal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-4 glass-card px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl font-medium">
                    Upgrade Plan
                  </button>
                </motion.div>

                {/* API Access */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl"
                >
                  <h2 className="text-xl text-text-primary mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-purple-500" />
                    API Access
                  </h2>
                  
                  <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 mb-4">
                    <label className="text-xs text-text-secondary mb-2 block">API Key</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="password" 
                        value="sk_live_••••••••••••••••"
                        disabled
                        className="flex-1 bg-transparent text-text-primary outline-none font-mono text-sm"
                      />
                      <button className="text-purple-600 hover:text-purple-700 text-sm">Show</button>
                    </div>
                  </div>

                  <button className="w-full glass-card px-4 py-2 bg-purple-500/10 backdrop-blur-xl border border-purple-400/30 rounded-xl text-purple-600 hover:bg-purple-500/20 transition-all text-sm shadow-md mb-3">
                    Generate New Key
                  </button>

                  <a 
                    href="#" 
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 justify-center"
                  >
                    <Globe className="w-4 h-4" />
                    View API Documentation
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}