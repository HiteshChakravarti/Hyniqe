import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { Sparkles, Zap, GitBranch } from 'lucide-react';

interface WorkflowsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function WorkflowsPage({ onBack, onNavigate, onLogout }: WorkflowsPageProps) {
  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="workflows"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onLogout={onLogout}
          onNavigate={onNavigate}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Coming Soon Banner */}
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
                <GitBranch className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-4xl mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Workflows Coming Soon
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Build multi-step automation workflows that connect your AI helpers, Power-Ups, and integrations.
              </p>

              {/* Features Preview */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                  <Sparkles className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Builder</h3>
                  <p className="text-sm text-gray-600">Drag-and-drop interface to create complex workflows</p>
                </div>

                <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                  <Zap className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Triggers & Actions</h3>
                  <p className="text-sm text-gray-600">Set up automated workflows based on events</p>
                </div>

                <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                  <GitBranch className="w-10 h-10 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Conditional Logic</h3>
                  <p className="text-sm text-gray-600">Add branching and conditional steps</p>
                </div>
              </div>

              {/* Notify Me Button */}
              <button className="mt-12 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:scale-105 transition-transform shadow-lg">
                Notify Me When Available
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
