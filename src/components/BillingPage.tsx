import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { mockBillingInfo, mockUsageData } from '../mock-data';
import { CreditCard, Download, Calendar, Check } from 'lucide-react';

interface BillingPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function BillingPage({ onBack, onNavigate, onLogout }: BillingPageProps) {
  const { currentWorkspace, usageData } = useApp();
  const billing = mockBillingInfo[currentWorkspace?.id || 'ws-001'];

  const plans = [
    { id: 'starter', name: 'Starter', price: 39, features: ['2 helpers', '1 workspace', '150 credits/mo'] },
    { id: 'x', name: 'Hyniqé X', price: 97, features: ['All helpers', 'Unlimited workspaces', '250 credits/mo'] },
    { id: 'team', name: 'Agency/Team', price: 149, features: ['Team controls', '3 seats', '750 credits/mo'] }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="billing"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onLogout={onLogout} onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl text-gray-900 mb-8">Billing & Plans</h1>

            {/* Current Plan */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 mb-8">
              <h2 className="text-xl text-gray-900 mb-4">Current Plan</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">{billing?.planTier === 'x' ? 'Hyniqé X' : billing?.planTier || 'Starter'}</div>
                  <div className="text-gray-600">${billing?.priceUSD || 39}/month</div>
                  <div className="text-sm text-gray-500 mt-2">Next billing: {billing?.nextBillingDate || 'N/A'}</div>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform">
                  Change Plan
                </button>
              </div>
            </div>

            {/* Usage */}
            <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 mb-8">
              <h2 className="text-xl text-gray-900 mb-4">Usage This Month</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Credits Used</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {usageData?.creditsUsed || 0} / {usageData?.creditsTotal || 0}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Calls Today</div>
                  <div className="text-2xl font-semibold text-gray-900">{usageData?.callsToday || 0}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Spend Today</div>
                  <div className="text-2xl font-semibold text-gray-900">${usageData?.spendTodayUSD?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            {billing?.paymentMethod && (
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 mb-8">
                <h2 className="text-xl text-gray-900 mb-4">Payment Method</h2>
                <div className="flex items-center gap-4">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="text-gray-900">{billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}</div>
                    <div className="text-sm text-gray-500">Primary payment method</div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices */}
            {billing?.invoices && billing.invoices.length > 0 && (
              <div className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6">
                <h2 className="text-xl text-gray-900 mb-4">Recent Invoices</h2>
                <div className="space-y-3">
                  {billing.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="text-gray-900">{invoice.date}</div>
                          <div className="text-sm text-gray-500">${invoice.amount}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {invoice.status}
                        </span>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
