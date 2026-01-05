import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { Workspace } from '../types';

interface WorkspaceSwitcherProps {
  current: Workspace | null;
  workspaces: Workspace[];
  onSwitch: (workspaceId: string) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function WorkspaceSwitcher({ 
  current, 
  workspaces, 
  onSwitch, 
  onCreateNew,
  className = '' 
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (workspaceId: string) => {
    onSwitch(workspaceId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/60 backdrop-blur-xl border border-purple-200/50 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
      >
        <Building2 className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-gray-900 max-w-[100px] md:max-w-[150px] truncate text-sm md:text-base">
          {current?.name || 'Select Workspace'}
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
              className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-purple-200/50 shadow-2xl z-50 overflow-hidden"
            >
              {/* Workspace List */}
              <div className="p-2 max-h-[400px] overflow-y-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelect(workspace.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      current?.id === workspace.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'hover:bg-purple-50 text-gray-900'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${
                      current?.id === workspace.id ? 'text-white' : 'text-purple-600'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{workspace.name}</div>
                      <div className={`text-xs ${
                        current?.id === workspace.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {workspace.orgType === 'agency' && 'Agency'}
                        {workspace.orgType === 'business' && 'Business'}
                        {workspace.orgType === 'individual' && 'Individual'}
                        {workspace.isAgencyClient && ' • Client'}
                      </div>
                    </div>
                    {current?.id === workspace.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create New (Agency only) */}
              {onCreateNew && current?.orgType === 'agency' && (
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
                      <span className="font-medium">New Client</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}