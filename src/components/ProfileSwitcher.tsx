import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ChevronDown, Check, Plus } from 'lucide-react';
import { Profile } from '../types';

interface ProfileSwitcherProps {
  current: Profile | null;
  profiles: Profile[];
  workspaceId: string;
  onSwitch: (profileId: string) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function ProfileSwitcher({ 
  current, 
  profiles, 
  workspaceId,
  onSwitch, 
  onCreateNew,
  className = '' 
}: ProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter profiles for current workspace
  const workspaceProfiles = profiles.filter(p => p.workspaceId === workspaceId);

  const handleSelect = (profileId: string) => {
    onSwitch(profileId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/60 backdrop-blur-xl border border-purple-200/50 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-medium text-gray-900 max-w-[80px] md:max-w-[120px] truncate text-sm md:text-base">
          {current?.name || 'Select Profile'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-white/95 backdrop-blur-xl rounded-2xl border border-purple-200/50 shadow-2xl z-50 overflow-hidden"
            >
              {/* Profile List */}
              <div className="p-2 max-h-[400px] overflow-y-auto">
                {workspaceProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelect(profile.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      current?.id === profile.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'hover:bg-purple-50 text-gray-900'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      current?.id === profile.id 
                        ? 'from-white/30 to-white/20' 
                        : 'from-purple-500 to-pink-500'
                    } flex items-center justify-center`}>
                      <User className={`w-5 h-5 ${
                        current?.id === profile.id ? 'text-white' : 'text-white'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{profile.name}</div>
                      <div className={`text-xs ${
                        current?.id === profile.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {profile.persona} • {profile.locales.length} locale(s)
                        {profile.isDefault && ' • Default'}
                      </div>
                    </div>
                    {current?.id === profile.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create New */}
              {onCreateNew && workspaceProfiles.length < 5 && (
                <>
                  <div className="border-t border-purple-200/30" />
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onCreateNew();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 text-purple-600 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">New Brand Profile</span>
                    </button>
                  </div>
                </>
              )}

              {/* Max profiles reached */}
              {workspaceProfiles.length >= 5 && (
                <div className="p-3 border-t border-purple-200/30">
                  <p className="text-xs text-gray-500 text-center">
                    Maximum of 5 brand profiles reached
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}