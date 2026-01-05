import { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { Settings, Globe, ChevronRight, Check } from 'lucide-react';

interface OverridesPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function OverridesPage({ onBack, onNavigate, onLogout }: OverridesPageProps) {
  const { currentWorkspace, currentProfile } = useApp();

  const [overrides, setOverrides] = useState([
    { key: 'model', global: 'gpt-4o', org: 'gpt-4o-mini', profile: null, active: 'org' },
    { key: 'temperature', global: '0.7', org: '0.5', profile: '0.9', active: 'profile' },
    { key: 'maxTokens', global: '2000', org: '1500', profile: null, active: 'org' },
    { key: 'systemPrompt', global: 'Default', org: 'Custom org prompt', profile: 'Custom profile prompt', active: 'profile' }
  ]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="overrides"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onLogout={onLogout} onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Configuration Overrides</h1>
              <p className="text-gray-600">
                Precedence: Global → Workspace → Profile (Profile overrides all)
              </p>
            </div>

            {/* Precedence Chain Visualization */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2 mx-auto">
                    <Globe className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-900">Global</div>
                  <div className="text-xs text-gray-500">Base defaults</div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2 mx-auto">
                    <Settings className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-sm text-gray-900">Workspace</div>
                  <div className="text-xs text-gray-500">Org-level</div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-2 mx-auto">
                    <Check className="w-8 h-8 text-pink-600" />
                  </div>
                  <div className="text-sm text-gray-900">Profile</div>
                  <div className="text-xs text-gray-500">Final override</div>
                </div>
              </div>
            </div>

            {/* Overrides Table */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Setting</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Global</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Workspace</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Profile</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((override, index) => (
                      <tr key={override.key} className={index % 2 === 0 ? 'bg-white/50' : 'bg-purple-50/30'}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{override.key}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{override.global}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {override.org || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {override.profile || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            override.active === 'profile' ? 'bg-pink-100 text-pink-700' :
                            override.active === 'org' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {override.active}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-900">
              <strong>Note:</strong> Profile-level overrides take highest precedence. If a profile override exists, 
              it will be used regardless of workspace or global settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
