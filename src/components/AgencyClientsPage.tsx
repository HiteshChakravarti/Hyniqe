import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { mockAgencyClients } from '../mock-data';
import { Plus, Building, TrendingUp, X } from 'lucide-react';

interface AgencyClientsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function AgencyClientsPage({ onBack, onNavigate, onLogout }: AgencyClientsPageProps) {
  const { currentWorkspace } = useApp();
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="clients"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onLogout={onLogout}
          onNavigate={onNavigate}
          onCreateClient={() => setShowNewClientModal(true)}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl text-gray-900 mb-2">Clients</h1>
                <p className="text-gray-600">Manage all your agency clients</p>
              </div>
              <button
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Client
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAgencyClients.map((client) => (
                <div
                  key={client.id}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-700' :
                      client.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  <h3 className="text-xl text-gray-900 mb-2">{client.name}</h3>
                  <div className="text-sm text-gray-600 mb-4">
                    {client.industry} • {client.planTier === 'x' ? 'Hyniqé X' : 'Starter'}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Credits</span>
                        <span className="text-gray-900">{client.usage.creditsUsed}/{client.usage.creditsTotal}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                          style={{ width: `${(client.usage.creditsUsed / client.usage.creditsTotal) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Calls Today</span>
                      <span className="text-gray-900">{client.usage.callsToday}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Spend Today</span>
                      <span className="text-gray-900">${client.usage.spendTodayUSD.toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors">
                    Manage Client
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      <AnimatePresence>
        {showNewClientModal && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewClientModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl text-gray-900">Add New Client</h2>
                  <button
                    onClick={() => setShowNewClientModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Client Name *</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Industry</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Technology"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Plan</label>
                      <select className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors">
                        <option>Starter - $39/mo</option>
                        <option>Hyniqé X - $97/mo</option>
                      </select>
                    </div>
                  </div>

                  <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform shadow-lg">
                    Create Client Workspace
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
