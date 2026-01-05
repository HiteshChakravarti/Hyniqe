import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { mockAgencyClients } from '../mock-data';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Zap,
  ArrowUpRight,
  Plus
} from 'lucide-react';

interface AgencyOverviewPageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AgencyOverviewPage({ onNavigate, onLogout }: AgencyOverviewPageProps) {
  const { currentWorkspace } = useApp();

  const totalRevenue = mockAgencyClients.reduce((sum, client) => sum + (client.planTier === 'x' ? 97 : 39), 0);
  const totalCreditsUsed = mockAgencyClients.reduce((sum, client) => sum + client.usage.creditsUsed, 0);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="agency-overview"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onLogout={onLogout}
          onNavigate={onNavigate}
          onCreateClient={() => onNavigate('agency-clients')}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Agency Overview</h1>
              <p className="text-gray-600">Manage all your clients from one dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">{mockAgencyClients.length}</div>
                <div className="text-sm text-gray-600">Active Clients</div>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">${totalRevenue}</div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">{totalCreditsUsed}</div>
                <div className="text-sm text-gray-600">Credits Used This Month</div>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-3xl font-semibold text-gray-900 mb-1">98%</div>
                <div className="text-sm text-gray-600">Client Satisfaction</div>
              </div>
            </div>

            {/* Clients Overview */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Clients</h2>
                <button
                  onClick={() => onNavigate('agency-clients')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  New Client
                </button>
              </div>

              <div className="space-y-4">
                {mockAgencyClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 bg-white/50 border border-purple-100 rounded-xl hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onNavigate('agency-clients')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg text-gray-900 mb-1">{client.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{client.industry}</span>
                          <span>•</span>
                          <span>{client.planTier === 'x' ? 'Hyniqé X' : 'Starter'} Plan</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900 mb-1">
                          {client.usage.creditsUsed}/{client.usage.creditsTotal}
                        </div>
                        <div className="text-sm text-gray-600">Credits</div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        style={{ width: `${(client.usage.creditsUsed / client.usage.creditsTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
