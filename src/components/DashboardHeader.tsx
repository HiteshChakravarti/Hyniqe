import { Bell, User, Settings, LogOut, HelpCircle, CreditCard, Users, Sliders } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { ProfileSwitcher } from './ProfileSwitcher';
import { useApp } from '../contexts/AppContext';

interface DashboardHeaderProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
  onCreateProfile?: () => void;
  onCreateClient?: () => void;
}

export function DashboardHeader({ 
  onLogout, 
  onNavigate,
  onCreateProfile,
  onCreateClient
}: DashboardHeaderProps) {
  const { 
    currentWorkspace, 
    workspaces, 
    switchWorkspace,
    currentProfile,
    profiles,
    switchProfile,
    user
  } = useApp();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Show workspace switcher only for agency accounts
  const showWorkspaceSwitcher = currentWorkspace?.orgType === 'agency';

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-purple-100">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        {/* Left: Workspace Switcher (Agency only) */}
        <div className="flex items-center gap-2 md:gap-4">
          {showWorkspaceSwitcher && (
            <WorkspaceSwitcher
              current={currentWorkspace}
              workspaces={workspaces}
              onSwitch={switchWorkspace}
              onCreateNew={onCreateClient}
            />
          )}
          {!showWorkspaceSwitcher && (
            <div className="flex items-center gap-2 ml-16 md:ml-0">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs md:text-sm">H</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm md:text-base">HYNÍQÉ</span>
            </div>
          )}
        </div>

        {/* Right: Profile Switcher + Actions */}
        <div className="flex items-center gap-3">
          {/* Profile Switcher */}
          {currentWorkspace && (
            <ProfileSwitcher
              current={currentProfile}
              profiles={profiles}
              workspaceId={currentWorkspace.id}
              onSwitch={switchProfile}
              onCreateNew={onCreateProfile}
            />
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-purple-50 transition-all"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-2xl border border-purple-200/50 shadow-2xl z-50 p-4"
                  >
                    <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <p className="text-sm text-gray-900">Nivi completed your content calendar</p>
                        <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <p className="text-sm text-gray-900">Esha screened 15 candidates</p>
                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <p className="text-sm text-gray-900">Credits usage at 60% for this month</p>
                        <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-purple-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-purple-200/50 shadow-2xl z-50 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-purple-200/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user?.name || 'User'}</div>
                          <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                      >
                        <User className="w-5 h-5 text-purple-600" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('profiles');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                      >
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>Brand Profiles</span>
                      </button>
                      {(currentWorkspace?.orgType === 'business' || currentWorkspace?.orgType === 'agency') && (
                        <button
                          onClick={() => {
                            onNavigate('overrides');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                        >
                          <Sliders className="w-5 h-5 text-purple-600" />
                          <div className="flex flex-col items-start">
                            <span>Config Overrides</span>
                            <span className="text-xs text-gray-500">Global → Workspace → Profile</span>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onNavigate('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                      >
                        <Settings className="w-5 h-5 text-purple-600" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('billing');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                      >
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <span>Billing</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-gray-900 transition-all"
                      >
                        <HelpCircle className="w-5 h-5 text-purple-600" />
                        <span>Help & Support</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-purple-200/30">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}