import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { mockActivityLogs } from '../mock-data';
import { 
  Activity,
  ChevronRight,
  Clock,
  DollarSign,
  Zap,
  CheckCircle,
  XCircle,
  ChevronDown,
  X
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ActivityPage({ onBack, onNavigate, onLogout }: ActivityPageProps) {
  const { currentWorkspace, currentProfile } = useApp();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  // Filter activities for current workspace/profile
  const activities = mockActivityLogs.filter(
    log => log.workspaceId === currentWorkspace?.id
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="activity"
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl text-gray-900 mb-2">Activity Log</h1>
              <p className="text-gray-600">
                Track all AI helper runs with model usage, cost, and execution traces
              </p>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card bg-white/60 backdrop-blur-xl border border-purple-200/50 rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.helperId === 'nivi' ? 'bg-cyan-100' :
                          activity.helperId === 'esha' ? 'bg-purple-100' :
                          activity.helperId === 'turbo' ? 'bg-orange-100' :
                          activity.helperId === 'orin' ? 'bg-green-100' :
                          'bg-orange-100'
                        }`}>
                          <Activity className={`w-5 h-5 ${
                            activity.helperId === 'nivi' ? 'text-cyan-600' :
                            activity.helperId === 'esha' ? 'text-purple-600' :
                            activity.helperId === 'turbo' ? 'text-orange-600' :
                            activity.helperId === 'orin' ? 'text-green-600' :
                            'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg text-gray-900">{activity.helperName}</h3>
                          <p className="text-sm text-gray-600">{activity.action}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        {activity.model && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Zap className="w-4 h-4" />
                            <span>{activity.model}</span>
                          </div>
                        )}
                        {activity.costUSD && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>${activity.costUSD.toFixed(3)}</span>
                          </div>
                        )}
                        {activity.durationMs && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(activity.durationMs)}</span>
                          </div>
                        )}
                        {activity.ttfbMs && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>TTFB: {activity.ttfbMs}ms</span>
                          </div>
                        )}
                        {activity.tokensUsed && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{activity.tokensUsed} tokens</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-gray-500">{formatTime(activity.timestamp)}</span>
                      {activity.trace && (
                        <button className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                          View Trace
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {activities.length === 0 && (
              <div className="text-center py-20">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl text-gray-900 mb-2">No Activity Yet</h3>
                <p className="text-gray-600">Run some Power-Ups to see activity logs here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trace Drawer */}
      <AnimatePresence>
        {selectedActivity && (
          <>
            <div 
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedActivity(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl text-gray-900 mb-1">{selectedActivity.helperName}</h2>
                    <p className="text-gray-600">{selectedActivity.action}</p>
                  </div>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Model</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedActivity.model || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Cost</div>
                    <div className="text-lg font-semibold text-gray-900">${selectedActivity.costUSD?.toFixed(3) || '0.000'}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Duration</div>
                    <div className="text-lg font-semibold text-gray-900">{formatDuration(selectedActivity.durationMs || 0)}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">TTFB</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedActivity.ttfbMs}ms</div>
                  </div>
                </div>

                {/* Trace */}
                {selectedActivity.trace && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Trace</h3>
                    
                    {/* Input */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Input</div>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
                        {selectedActivity.trace.input}
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Steps</div>
                      <div className="space-y-2">
                        {selectedActivity.trace.steps.map((step, index) => (
                          <div 
                            key={index}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {step.status === 'success' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className="text-sm font-medium text-gray-900">{step.step}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatDuration(step.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Output</div>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
                        {selectedActivity.trace.output}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedActivity.trace && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No trace data available for this activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
