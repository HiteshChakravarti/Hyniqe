import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings as SettingsIcon,
  Users,
  Bell,
  Layout,
  Brain,
  Shield,
  CreditCard,
  Link as LinkIcon,
  Wrench,
  Check,
  Search,
  Save,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { DashboardHeader } from './DashboardHeader';
import { useApp } from '../contexts/AppContext';

interface SettingsPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout: () => void;
}

type TabId = 'employees' | 'notifications' | 'workspace' | 'brain' | 'privacy' | 'billing' | 'integrations' | 'advanced';

export function SettingsPage({ onBack, onNavigate, onLogout }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Settings states
  const [responseTone, setResponseTone] = useState('professional');
  const [responseLength, setResponseLength] = useState(50);
  const [creativityLevel, setCreativityLevel] = useState(50);
  const [defaultLanguage, setDefaultLanguage] = useState('english');
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  
  const [compactView, setCompactView] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [defaultView, setDefaultView] = useState('home');
  
  const [autoLearn, setAutoLearn] = useState(true);
  const [autoCategorization, setAutoCategorization] = useState(true);

  const tabs = [
    { id: 'employees' as TabId, label: 'AI Employees', icon: Users },
    { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
    { id: 'workspace' as TabId, label: 'Workspace', icon: Layout },
    { id: 'brain' as TabId, label: 'Brain & Knowledge', icon: Brain },
    { id: 'privacy' as TabId, label: 'Privacy & Data', icon: Shield },
    { id: 'billing' as TabId, label: 'Billing', icon: CreditCard },
    { id: 'integrations' as TabId, label: 'Integrations', icon: LinkIcon },
    { id: 'advanced' as TabId, label: 'Advanced', icon: Wrench }
  ];

  const helpers = [
    { id: 'esha', name: 'Esha', role: 'AI Recruiter', color: 'purple', enabled: true },
    { id: 'karo', name: 'Karo', role: 'Customer Success', color: 'orange', enabled: true },
    { id: 'nivi', name: 'Nivi', role: 'Social Media Manager', color: 'cyan', enabled: true },
    { id: 'orin', name: 'Orin', role: 'Data Analyst', color: 'green', enabled: true },
    { id: 'turbo', name: 'Turbo', role: 'Sales Specialist', color: 'red', enabled: true }
  ];

  const handleSave = () => {
    setHasChanges(false);
    // Show toast notification
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'employees':
        return (
          <div className="space-y-6">
            {/* Global AI Settings */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Global AI Settings</h3>
              
              <div className="space-y-6">
                {/* Response Tone */}
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Default Response Tone</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['professional', 'casual', 'friendly', 'formal'].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => { setResponseTone(tone); setHasChanges(true); }}
                        className={`glass-card p-3 rounded-xl transition-all text-sm ${
                          responseTone === tone
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/40 text-purple-600 shadow-lg'
                            : 'bg-white/40 border-white/50 text-text-secondary hover:bg-white/60'
                        }`}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Response Length */}
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Response Length</label>
                  <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2 text-sm text-text-secondary">
                      <span>Concise</span>
                      <span>Detailed</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={responseLength}
                      onChange={(e) => { setResponseLength(Number(e.target.value)); setHasChanges(true); }}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="text-center mt-2">
                      <span className="text-purple-600 font-medium">{responseLength}%</span>
                    </div>
                  </div>
                </div>

                {/* Creativity Level */}
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Creativity Level</label>
                  <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2 text-sm text-text-secondary">
                      <span>Conservative</span>
                      <span>Creative</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={creativityLevel}
                      onChange={(e) => { setCreativityLevel(Number(e.target.value)); setHasChanges(true); }}
                      className="w-full h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="text-center mt-2">
                      <span className="text-purple-600 font-medium">{creativityLevel}%</span>
                    </div>
                  </div>
                </div>

                {/* Default Language */}
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Default Language</label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => { setDefaultLanguage(e.target.value); setHasChanges(true); }}
                    className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-text-primary outline-none cursor-pointer"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Individual Employee Settings */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Individual AI Employee Settings</h3>
              
              <div className="space-y-3">
                {helpers.map((helper) => (
                  <div
                    key={helper.id}
                    className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 hover:bg-white/60 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${helper.color}-500/20 to-${helper.color}-600/20 border border-${helper.color}-400/30 flex items-center justify-center`}>
                          <Users className={`w-6 h-6 text-${helper.color}-600`} />
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{helper.name}</p>
                          <p className="text-sm text-text-secondary">{helper.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700">
                          Configure
                        </button>
                        <button
                          className={`relative w-12 h-6 rounded-full transition-all ${
                            helper.enabled
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            helper.enabled ? 'translate-x-6' : ''
                          }`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Email Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Daily Digest</p>
                    <p className="text-sm text-text-secondary">Get a daily summary of your AI activity</p>
                  </div>
                  <button
                    onClick={() => { setEmailNotifications(!emailNotifications); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      emailNotifications
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      emailNotifications ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Weekly Summary</p>
                    <p className="text-sm text-text-secondary">Weekly recap of insights and achievements</p>
                  </div>
                  <button
                    onClick={() => { setWeeklyDigest(!weeklyDigest); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      weeklyDigest
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      weeklyDigest ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* In-App Notifications */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">In-App Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Task Completions</p>
                    <p className="text-sm text-text-secondary">When AI employees complete tasks</p>
                  </div>
                  <button
                    onClick={() => { setInAppNotifications(!inAppNotifications); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      inAppNotifications
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      inAppNotifications ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Power-Up Updates</p>
                    <p className="text-sm text-text-secondary">When new integrations are available</p>
                  </div>
                  <button
                    className="relative w-14 h-7 rounded-full transition-all bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full translate-x-7"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Brain Updates</p>
                    <p className="text-sm text-text-secondary">When knowledge is added or updated</p>
                  </div>
                  <button
                    className="relative w-14 h-7 rounded-full transition-all bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full translate-x-7"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="space-y-6">
            {/* Appearance */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Appearance</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="glass-card p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/40 shadow-lg">
                      <div className="w-full h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl mb-3"></div>
                      <p className="text-text-primary font-medium">Dark (Current)</p>
                    </button>
                    <button className="glass-card p-4 rounded-2xl bg-white/40 border-white/50 opacity-50 cursor-not-allowed">
                      <div className="w-full h-20 bg-white border border-gray-200 rounded-xl mb-3"></div>
                      <p className="text-text-secondary">Light (Coming Soon)</p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Compact View</p>
                    <p className="text-sm text-text-secondary">Reduce spacing and padding</p>
                  </div>
                  <button
                    onClick={() => { setCompactView(!compactView); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      compactView
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      compactView ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Defaults */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Defaults</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-text-primary font-medium mb-3 block">Default View on Login</label>
                  <select
                    value={defaultView}
                    onChange={(e) => { setDefaultView(e.target.value); setHasChanges(true); }}
                    className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-text-primary outline-none cursor-pointer"
                  >
                    <option value="home">Home Dashboard</option>
                    <option value="last">Last Used Page</option>
                    <option value="esha">Esha (Recruiter)</option>
                    <option value="karo">Karo (Customer Success)</option>
                    <option value="nivi">Nivi (Social Media)</option>
                    <option value="orin">Orin (Data Analyst)</option>
                    <option value="turbo">Turbo (Sales)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Sidebar Collapsed by Default</p>
                    <p className="text-sm text-text-secondary">Start with collapsed sidebar</p>
                  </div>
                  <button
                    onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      sidebarCollapsed
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      sidebarCollapsed ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'brain':
        return (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Brain & Knowledge Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Auto-Learn from Conversations</p>
                    <p className="text-sm text-text-secondary">Automatically update knowledge from interactions</p>
                  </div>
                  <button
                    onClick={() => { setAutoLearn(!autoLearn); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      autoLearn
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      autoLearn ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Auto-Categorization</p>
                    <p className="text-sm text-text-secondary">Automatically organize knowledge items</p>
                  </div>
                  <button
                    onClick={() => { setAutoCategorization(!autoCategorization); setHasChanges(true); }}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      autoCategorization
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      autoCategorization ? 'translate-x-7' : ''
                    }`}></div>
                  </button>
                </div>

                <div>
                  <label className="text-text-primary font-medium mb-3 block">Knowledge Retention Period</label>
                  <select
                    className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-text-primary outline-none cursor-pointer"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Privacy & Data Controls</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Analytics & Usage Data</p>
                    <p className="text-sm text-text-secondary">Help us improve with anonymous usage data</p>
                  </div>
                  <button
                    className="relative w-14 h-7 rounded-full transition-all bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full translate-x-7"></div>
                  </button>
                </div>

                <button className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-left hover:bg-white/60 transition-all">
                  <p className="text-text-primary font-medium mb-1">Export All Data</p>
                  <p className="text-sm text-text-secondary">Download a copy of all your data</p>
                </button>

                <button className="w-full glass-card bg-red-500/5 backdrop-blur-xl border border-red-400/30 rounded-2xl p-4 text-left hover:bg-red-500/10 transition-all">
                  <p className="text-red-600 font-medium mb-1">Clear All History</p>
                  <p className="text-sm text-red-500/70">Permanently delete all conversation history</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="glass-card bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-400/30 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl text-text-primary mb-2">Pro Plan</h3>
                  <p className="text-text-secondary">$49/month • Billed monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl text-text-primary mb-1">$49</p>
                  <p className="text-sm text-text-secondary">per month</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>5 AI Employees</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Unlimited Conversations</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>10GB Knowledge Storage</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Priority Support</span>
                </div>
              </div>

              <button className="w-full glass-card px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl font-medium">
                Upgrade to Enterprise
              </button>
            </div>

            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Payment Method</h3>
              
              <div className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-text-secondary">Expires 12/25</p>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 text-sm">Update</button>
                </div>
              </div>

              <button className="text-sm text-purple-600 hover:text-purple-700">
                + Add Payment Method
              </button>
            </div>

            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Billing History</h3>
              
              <div className="space-y-3">
                {[
                  { date: 'Dec 1, 2024', amount: '$49.00', status: 'Paid' },
                  { date: 'Nov 1, 2024', amount: '$49.00', status: 'Paid' },
                  { date: 'Oct 1, 2024', amount: '$49.00', status: 'Paid' }
                ].map((invoice, index) => (
                  <div key={index} className="glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-text-primary font-medium">{invoice.date}</p>
                      <p className="text-sm text-text-secondary">{invoice.amount} • {invoice.status}</p>
                    </div>
                    <button className="text-purple-600 hover:text-purple-700 text-sm">Download</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Active Integrations</h3>
              <p className="text-text-secondary mb-4">Manage your connected Power-Ups and integrations from the Power-Ups page.</p>
              
              <button
                onClick={() => onNavigate && onNavigate('powerups')}
                className="glass-card px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Go to Power-Ups
              </button>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl text-text-primary mb-6">Advanced Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl">
                  <div>
                    <p className="text-text-primary font-medium">Developer Mode</p>
                    <p className="text-sm text-text-secondary">Enable advanced debugging features</p>
                  </div>
                  <button
                    className="relative w-14 h-7 rounded-full transition-all bg-gray-300"
                  >
                    <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"></div>
                  </button>
                </div>

                <button className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-left hover:bg-white/60 transition-all">
                  <p className="text-text-primary font-medium mb-1">Export Settings</p>
                  <p className="text-sm text-text-secondary">Download your settings as JSON</p>
                </button>

                <button className="w-full glass-card bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-4 text-left hover:bg-white/60 transition-all">
                  <p className="text-text-primary font-medium mb-1">Keyboard Shortcuts</p>
                  <p className="text-sm text-text-secondary">View and customize keyboard shortcuts</p>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to restore all settings to defaults?')) {
                      // Reset all settings
                      setHasChanges(false);
                    }
                  }}
                  className="w-full glass-card bg-orange-500/5 backdrop-blur-xl border border-orange-400/30 rounded-2xl p-4 text-left hover:bg-orange-500/10 transition-all"
                >
                  <p className="text-orange-600 font-medium mb-1 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Restore Defaults
                  </p>
                  <p className="text-sm text-orange-500/70">Reset all settings to factory defaults</p>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="settings"
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
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-card w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <SettingsIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-text-primary text-4xl">Settings</h1>
                  <p className="text-text-secondary">Customize your HYNIQÉ experience</p>
                </div>
              </div>

              {/* Search Settings */}
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-3 flex items-center gap-3 shadow-md">
                <Search className="w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`glass-card px-4 py-3 rounded-2xl flex items-center gap-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/40 text-purple-600 shadow-lg'
                        : 'bg-white/40 border-white/50 text-text-secondary hover:bg-white/60'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>

            {/* Save Bar */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-card bg-white/90 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4"
              >
                <p className="text-text-primary">You have unsaved changes</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasChanges(false)}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}