import { 
  Home, 
  Zap, 
  GitBranch, 
  Brain, 
  Users, 
  Settings, 
  Plug, 
  Activity, 
  CreditCard,
  Building,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { OrgType } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardSidebarNewProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  orgType?: OrgType;
}

export function DashboardSidebarNew({ activePage, onNavigate, onLogout, orgType }: DashboardSidebarNewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, show: true },
    { id: 'powerups', label: 'Power-Ups', icon: Zap, show: true },
    { id: 'workflows', label: 'Workflows', icon: GitBranch, show: true, badge: 'Soon' },
    { id: 'brain-knowledge', label: 'Brain', icon: Brain, show: true },
    { id: 'helpers', label: 'Helpers', icon: Users, show: true },
    { id: 'app-integrations', label: 'Integrations', icon: Plug, show: true },
    { id: 'activity', label: 'Activity', icon: Activity, show: true },
    { id: 'agency-overview', label: 'Overview', icon: LayoutDashboard, show: orgType === 'agency' },
    { id: 'agency-clients', label: 'Clients', icon: Building, show: orgType === 'agency' }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-purple-200/50"
      >
        <Menu className="w-6 h-6 text-gray-900" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-r border-purple-200/50 z-50 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-purple-200/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">H</span>
                  </div>
                  <span className="font-semibold text-gray-900">HYNÍQÉ</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-purple-50 rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.filter(item => item.show).map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs px-2 py-1 bg-pink-500 text-white rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-purple-200/50">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-purple-50 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-20 bg-white/60 backdrop-blur-xl border-r border-purple-200/50 flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-purple-200/50 flex items-center justify-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">H</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-purple-200/50">
          <button
            onClick={() => onNavigate('settings')}
            title="Settings"
            className="w-full flex items-center justify-center p-3 rounded-xl text-gray-700 hover:bg-purple-50 transition-all"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </>
  );
}