import { Home, Zap, Users, Brain, History, Plus, User } from 'lucide-react';

interface DashboardSidebarProps {
  activePage?: 'home' | 'powerups' | 'helpers' | 'brain' | 'history';
  activeSidebarItem?: string;
  setActiveSidebarItem?: (item: string) => void;
  onNavigate?: (page: string) => void;
  onNavigateToHelper?: (page: string) => void;
  onLogout: () => void;
}

export function DashboardSidebar({ 
  activePage, 
  activeSidebarItem,
  setActiveSidebarItem,
  onNavigate, 
  onNavigateToHelper,
  onLogout 
}: DashboardSidebarProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'powerups', icon: Zap, label: 'Power-Ups' },
    { id: 'helpers', icon: Users, label: 'Employees' },
    { id: 'brain', icon: Brain, label: 'Brain' },
    { id: 'history', icon: History, label: 'History' }
  ];

  // Determine which item is currently active
  const activeItem = activePage || activeSidebarItem || 'home';

  const handleNavigation = (itemId: string) => {
    // Update active state for HomeDashboard
    if (setActiveSidebarItem) {
      setActiveSidebarItem(itemId);
    }

    // Navigate based on the item
    if (itemId === 'home') {
      if (onNavigate) {
        onNavigate('dashboard');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('dashboard');
      }
    } else if (itemId === 'profile') {
      if (onNavigate) {
        onNavigate('profile');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('profile');
      }
    } else if (itemId === 'settings') {
      if (onNavigate) {
        onNavigate('settings');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('settings');
      }
    } else if (itemId === 'powerups') {
      if (onNavigate) {
        onNavigate('powerups');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('powerups');
      }
    } else if (itemId === 'helpers') {
      if (onNavigate) {
        onNavigate('helpers');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('helpers');
      }
    } else if (itemId === 'brain') {
      if (onNavigate) {
        onNavigate('brain-knowledge');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('brain-knowledge');
      }
    } else if (itemId === 'history') {
      if (onNavigate) {
        onNavigate('history');
      } else if (onNavigateToHelper) {
        onNavigateToHelper('history');
      }
    }
  };

  return (
    <div className="w-20 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-6 shadow-2xl relative">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-pink-600/5 pointer-events-none"></div>
      
      {/* Logo */}
      <div className="mb-8 relative z-10">
        <button 
          onClick={() => handleNavigation('home')}
          className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 cursor-pointer relative group"
        >
          <span className="text-white text-xl font-bold">H</span>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Profile Avatar - Above Home */}
      <div className="mb-6 relative z-10">
        <button
          onClick={() => handleNavigation('profile')}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group relative overflow-hidden ${
            activeItem === 'profile'
              ? 'bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-purple-600/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
              : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-purple-600/20 hover:to-pink-600/20 border border-white/10 hover:border-purple-400/30 hover:shadow-md hover:shadow-purple-500/10'
          }`}
          title="Profile"
        >
          {/* Avatar placeholder - can be replaced with actual image */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center transition-all duration-300 ${
            activeItem === 'profile' ? 'scale-110' : 'group-hover:scale-110'
          }`}>
            <User className="w-5 h-5 text-white" />
          </div>
          
          {/* Active indicator */}
          {activeItem === 'profile' && (
            <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 via-pink-400 to-purple-500 rounded-r-full shadow-lg shadow-purple-500/60 animate-pulse"></div>
          )}
          
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-xl border border-white/20 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl group-hover:translate-x-1">
            Profile
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90"></span>
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3 relative z-10">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${
              activeItem === item.id
                ? 'bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-purple-600/30 backdrop-blur-xl border border-purple-400/40 shadow-lg shadow-purple-500/20'
                : 'hover:bg-white/10 hover:backdrop-blur-xl border border-transparent hover:border-white/20 hover:shadow-md hover:shadow-white/10'
            }`}
            title={item.label}
          >
            <item.icon className={`w-6 h-6 transition-all duration-300 ${
              activeItem === item.id 
                ? 'text-purple-300 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-110' 
                : 'text-gray-400 group-hover:text-white group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'
            }`} />
            
            {/* Active indicator */}
            {activeItem === item.id && (
              <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 via-pink-400 to-purple-500 rounded-r-full shadow-lg shadow-purple-500/60 animate-pulse"></div>
            )}
            
            {/* Premium Glassmorphic Tooltip */}
            <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-xl border border-white/20 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl group-hover:translate-x-1">
              {item.label}
              {/* Tooltip arrow */}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90"></span>
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-3 relative z-10">
        {/* Add New Button */}
        <button className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:scale-105 shadow-lg">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-white transition-all duration-300 group-hover:rotate-90" />
          
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-xl border border-white/20 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl group-hover:translate-x-1">
            New Chat
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90"></span>
          </span>
        </button>
        
        {/* User Profile Button */}
        <button 
          onClick={onLogout}
          className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-110 group relative border border-white/20"
        >
          <User className="w-6 h-6 text-white" />
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
          
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-xl border border-white/20 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl group-hover:translate-x-1">
            Profile & Logout
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90"></span>
          </span>
        </button>
      </div>
    </div>
  );
}