import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebarNew } from './DashboardSidebarNew';
import { useApp } from '../contexts/AppContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Globe, 
  Check,
  X,
  User
} from 'lucide-react';
import { Profile, Locale, Persona } from '../types';

interface ProfilesManagerPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ProfilesManagerPage({ onBack, onNavigate, onLogout }: ProfilesManagerPageProps) {
  const { 
    currentWorkspace, 
    profiles, 
    currentProfile,
    switchProfile,
    addProfile,
    updateProfile,
    deleteProfile
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    locales: ['en-US'] as Locale[],
    persona: 'Professional' as Persona,
    brandTone: '',
    keyGoals: ''
  });

  const workspaceProfiles = profiles.filter(p => p.workspaceId === currentWorkspace?.id);

  const localeOptions: { value: Locale; label: string }[] = [
    { value: 'en-US', label: '🇺🇸 English (US)' },
    { value: 'es-ES', label: '🇪🇸 Español' },
    { value: 'fr-FR', label: '🇫🇷 Français' },
    { value: 'de-DE', label: '🇩🇪 Deutsch' },
    { value: 'pt-BR', label: '🇧🇷 Português' },
    { value: 'ja-JP', label: '🇯🇵 日本語' },
    { value: 'zh-CN', label: '🇨🇳 中文' }
  ];

  const personaOptions: Persona[] = ['Professional', 'Friendly', 'Bold', 'Casual', 'Authoritative'];

  const handleCreateProfile = () => {
    if (!currentWorkspace) return;

    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      name: formData.name,
      website: formData.website,
      industry: formData.industry,
      locales: formData.locales,
      persona: formData.persona,
      brandTone: formData.brandTone,
      keyGoals: formData.keyGoals.split(',').map(g => g.trim()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addProfile(newProfile);
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdateProfile = () => {
    if (!editingProfileId) return;

    updateProfile(editingProfileId, {
      name: formData.name,
      website: formData.website,
      industry: formData.industry,
      locales: formData.locales,
      persona: formData.persona,
      brandTone: formData.brandTone,
      keyGoals: formData.keyGoals.split(',').map(g => g.trim())
    });

    setEditingProfileId(null);
    resetForm();
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setFormData({
      name: profile.name,
      website: profile.website || '',
      industry: profile.industry || '',
      locales: profile.locales,
      persona: profile.persona,
      brandTone: profile.brandTone || '',
      keyGoals: profile.keyGoals?.join(', ') || ''
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      industry: '',
      locales: ['en-US'],
      persona: 'Professional',
      brandTone: '',
      keyGoals: ''
    });
  };

  const toggleLocale = (locale: Locale) => {
    if (formData.locales.includes(locale)) {
      setFormData({ ...formData, locales: formData.locales.filter(l => l !== locale) });
    } else {
      setFormData({ ...formData, locales: [...formData.locales, locale] });
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <DashboardSidebarNew
        activePage="profiles"
        onNavigate={onNavigate}
        onLogout={onLogout}
        orgType={currentWorkspace?.orgType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onLogout={onLogout}
          onNavigate={onNavigate}
          onCreateProfile={() => setShowCreateModal(true)}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl text-gray-900 mb-2">Brand Profiles</h1>
                <p className="text-gray-600">
                  Manage up to 5 brand profiles per workspace. Each profile can have unique tone, locales, and settings.
                </p>
              </div>
              {workspaceProfiles.length < 5 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  New Profile
                </button>
              )}
            </div>

            {/* Profiles Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaceProfiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card bg-white/60 backdrop-blur-xl border rounded-2xl p-6 hover:shadow-xl transition-all ${
                    currentProfile?.id === profile.id 
                      ? 'border-purple-500 shadow-lg' 
                      : 'border-purple-200/50'
                  }`}
                >
                  {/* Profile Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    {currentProfile?.id === profile.id && (
                      <div className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full">
                        Active
                      </div>
                    )}
                    {profile.isDefault && (
                      <div className="px-3 py-1 bg-gray-500 text-white text-xs rounded-full">
                        Default
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <h3 className="text-xl text-gray-900 mb-2">{profile.name}</h3>
                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Globe className="w-4 h-4" />
                      {profile.website}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {profile.industry && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Industry:</span> {profile.industry}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Persona:</span> {profile.persona}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Locales:</span> {profile.locales.length} language(s)
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {currentProfile?.id !== profile.id && (
                      <button
                        onClick={() => switchProfile(profile.id)}
                        className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                      >
                        Switch To
                      </button>
                    )}
                    <button
                      onClick={() => handleEditProfile(profile)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-purple-600" />
                    </button>
                    {!profile.isDefault && workspaceProfiles.length > 1 && (
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Max profiles warning */}
            {workspaceProfiles.length >= 5 && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-900">
                You've reached the maximum of 5 brand profiles for this workspace.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingProfileId) && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => {
                setShowCreateModal(false);
                setEditingProfileId(null);
                resetForm();
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl text-gray-900">
                    {editingProfileId ? 'Edit Profile' : 'Create New Profile'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProfileId(null);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Profile Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="e.g., Acme Labs R&D Division"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="acme.com"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Industry</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Technology"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Locales</label>
                    <div className="flex flex-wrap gap-2">
                      {localeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => toggleLocale(option.value)}
                          className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                            formData.locales.includes(option.value)
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-purple-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Persona</label>
                    <div className="flex flex-wrap gap-2">
                      {personaOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setFormData({ ...formData, persona: option })}
                          className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                            formData.persona === option
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-purple-500'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Brand Tone</label>
                    <textarea
                      value={formData.brandTone}
                      onChange={(e) => setFormData({ ...formData, brandTone: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      rows={3}
                      placeholder="Describe your brand voice and tone..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Key Goals (comma-separated)</label>
                    <textarea
                      value={formData.keyGoals}
                      onChange={(e) => setFormData({ ...formData, keyGoals: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      rows={2}
                      placeholder="Increase brand awareness, Generate leads, ..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProfileId(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingProfileId ? handleUpdateProfile : handleCreateProfile}
                    disabled={!formData.name}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingProfileId ? 'Update Profile' : 'Create Profile'}
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
