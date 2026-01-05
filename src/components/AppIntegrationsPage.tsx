import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { mockIntegrations } from '../mock-data';
import { Check, Plug, ExternalLink } from 'lucide-react';

interface AppIntegrationsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AppIntegrationsPage({ onBack, onNavigate, onLogout }: AppIntegrationsPageProps) {
  const { currentWorkspace } = useApp();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="app-integrations"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onLogout={onLogout} onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Integrations</h1>
              <p className="text-gray-600">Connect your favorite tools and services</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    {integration.logoUrl ? (
                      <img src={integration.logoUrl} alt={integration.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Plug className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {integration.status === 'connected' && (
                      <div className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg text-gray-900 mb-2">{integration.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                  <button
                    className={`w-full px-4 py-2 rounded-xl transition-all ${
                      integration.status === 'connected'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Manage' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}