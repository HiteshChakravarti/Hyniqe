import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Globe, 
  DollarSign, 
  Target,
  Upload,
  FileText,
  Brain,
  Sparkles,
  Check,
  Zap,
  User,
  Users,
  Briefcase
} from 'lucide-react';
import { OrgType, Locale, Persona } from '../types';

interface OnboardingFlowProps {
  onComplete: (userData: any) => void;
  userEmail?: string;
}

export function OnboardingFlow({ onComplete, userEmail }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Type
    orgType: 'business' as OrgType,
    // Step 2: Brand Info
    companyName: '',
    website: '',
    industry: '',
    monthlyRevenue: '',
    keyGoals: '',
    locales: ['en-US'] as Locale[],
    persona: 'Professional' as Persona,
    // Step 3: Brain Setup
    brandTone: '',
    uploadedFiles: [] as File[],
    brainType: 'global', // 'global' or 'personal'
    // Step 4: Plan
    selectedPlan: 'starter'
  });

  const industries = [
    'Technology',
    'E-commerce',
    'Healthcare',
    'Finance',
    'Education',
    'Real Estate',
    'Marketing Agency',
    'Consulting',
    'SaaS',
    'Other'
  ];

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

  const brandToneSuggestions = [
    'Professional & authoritative',
    'Friendly & conversational',
    'Playful & creative',
    'Technical & detailed',
    'Luxury & sophisticated'
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'For individuals',
      price: '$39',
      priceMonthly: '$39/mo',
      priceYearly: '$312/year',
      features: ['Choose any 2 helpers', '1 workspace', '150 credits/month', 'Standard integrations', 'Community support'],
      gradient: 'from-cyan-600 to-blue-600',
      popular: false
    },
    {
      id: 'core',
      name: 'Hyniqé X',
      subtitle: 'Best value',
      price: '$97',
      priceMonthly: '$97/mo',
      priceYearly: '$780/year',
      features: ['All 5 helpers', 'Unlimited workspaces', '250 credits/month', 'All integrations + Brain', 'Priority support'],
      gradient: 'from-purple-600 to-pink-600',
      popular: true
    },
    {
      id: 'team',
      name: 'Agency / Team',
      subtitle: 'For teams',
      price: '$149',
      priceMonthly: '$149/mo',
      priceYearly: '$1,188/year',
      features: ['Everything in Core', 'Team controls & roles', '3 seats included', '750 credits/month', 'Shared knowledge + audit'],
      gradient: 'from-orange-600 to-red-600',
      popular: false
    }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        uploadedFiles: Array.from(e.target.files)
      });
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Account info already validated in signup
      case 2:
        return formData.companyName && formData.industry && formData.keyGoals;
      case 3:
        return formData.brandTone;
      case 4:
        return formData.selectedPlan;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a0f1f] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Welcome to HYNÍQÉ
          </h1>
          <p className="text-gray-400 text-lg">Let's set up your AI Employee workspace</p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto mb-4">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'Brand Info' },
              { num: 3, label: 'Brain Setup' },
              { num: 4, label: 'Plan' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    currentStep > step.num 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                      : currentStep === step.num
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600'
                      : 'bg-gray-800'
                  }`}>
                    {currentStep > step.num ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white">{step.num}</span>
                    )}
                  </div>
                  <span className={`text-sm ${currentStep >= step.num ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.num ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-800'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-800 p-8 md:p-12 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Account Info (Already completed via signup) */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl text-white mb-2">Account Created!</h2>
                  <p className="text-gray-400">Signed in as {userEmail}</p>
                </div>
                
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-8">
                  <p className="text-gray-300 text-center">
                    Your account is ready. Let's personalize your HYNÍQÉ workspace to match your business needs.
                  </p>
                </div>

                {/* Account Type Selection */}
                <div>
                  <label className="block text-gray-300 mb-4 text-center">What type of account is this?</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, orgType: 'individual' })}
                      className={`p-6 rounded-2xl border-2 transition-all text-center ${
                        formData.orgType === 'individual'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <User className={`w-8 h-8 mx-auto mb-3 ${formData.orgType === 'individual' ? 'text-cyan-400' : 'text-gray-500'}`} />
                      <h4 className="text-white mb-1">Individual</h4>
                      <p className="text-xs text-gray-400">For personal use</p>
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, orgType: 'business' })}
                      className={`p-6 rounded-2xl border-2 transition-all text-center ${
                        formData.orgType === 'business'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <Briefcase className={`w-8 h-8 mx-auto mb-3 ${formData.orgType === 'business' ? 'text-purple-400' : 'text-gray-500'}`} />
                      <h4 className="text-white mb-1">Business</h4>
                      <p className="text-xs text-gray-400">For companies</p>
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, orgType: 'agency' })}
                      className={`p-6 rounded-2xl border-2 transition-all text-center ${
                        formData.orgType === 'agency'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <Users className={`w-8 h-8 mx-auto mb-3 ${formData.orgType === 'agency' ? 'text-orange-400' : 'text-gray-500'}`} />
                      <h4 className="text-white mb-1">Agency</h4>
                      <p className="text-xs text-gray-400">For clients & teams</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Brand Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl text-white mb-2">Tell us about your business</h2>
                  <p className="text-gray-400">This helps our AI helpers understand your needs</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="acme.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-2">Industry *</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select industry...</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Monthly Revenue (Optional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={formData.monthlyRevenue}
                        onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="10,000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Key Goals *</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                    <textarea
                      value={formData.keyGoals}
                      onChange={(e) => setFormData({ ...formData, keyGoals: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      rows={4}
                      placeholder="E.g., Increase sales by 30%, improve customer retention, streamline recruitment..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Locales (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {localeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, locales: [option.value] })}
                        className={`px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 rounded-full text-sm text-gray-300 transition-colors ${
                          formData.locales.includes(option.value) ? 'bg-cyan-500/10 border-cyan-500' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Persona (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {personaOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setFormData({ ...formData, persona: option })}
                        className={`px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 rounded-full text-sm text-gray-300 transition-colors ${
                          formData.persona === option ? 'bg-cyan-500/10 border-cyan-500' : ''
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Brain Setup */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl text-white mb-2">Set up your Brain AI</h2>
                  <p className="text-gray-400">Your central knowledge base that powers all AI helpers</p>
                </div>

                {/* Upload Documents */}
                <div>
                  <label className="block text-gray-300 mb-3">Upload Knowledge Base (Optional)</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-white mb-2">Drop files or click to upload</p>
                      <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT up to 10MB each</p>
                      {formData.uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-center gap-2 text-sm text-cyan-400">
                              <FileText className="w-4 h-4" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Brand Tone */}
                <div>
                  <label className="block text-gray-300 mb-3">Describe your brand tone *</label>
                  <textarea
                    value={formData.brandTone}
                    onChange={(e) => setFormData({ ...formData, brandTone: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    rows={3}
                    placeholder="E.g., We're a friendly, innovative tech company that values transparency and customer success..."
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brandToneSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setFormData({ ...formData, brandTone: suggestion })}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 rounded-full text-sm text-gray-300 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brain Type */}
                <div>
                  <label className="block text-gray-300 mb-3">Brain AI Type</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, brainType: 'global' })}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        formData.brainType === 'global'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Sparkles className={`w-6 h-6 ${formData.brainType === 'global' ? 'text-cyan-400' : 'text-gray-500'}`} />
                        <div>
                          <h4 className="text-white mb-1">Global Brain AI</h4>
                          <p className="text-sm text-gray-400">All helpers share knowledge</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Best for teams and consistent brand voice</p>
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, brainType: 'personal' })}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        formData.brainType === 'personal'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Zap className={`w-6 h-6 ${formData.brainType === 'personal' ? 'text-purple-400' : 'text-gray-500'}`} />
                        <div>
                          <h4 className="text-white mb-1">Personal Brain AI</h4>
                          <p className="text-sm text-gray-400">Individual helper knowledge</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Best for specialized tasks per helper</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Plan Selection */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl text-white mb-2">Choose your plan</h2>
                  <p className="text-gray-400">You can change this anytime</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                      className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                        formData.selectedPlan === plan.id
                          ? 'border-white bg-gray-800/80 scale-105'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs text-white">
                          Most Popular
                        </div>
                      )}
                      <div className="mb-4">
                        <h3 className="text-xl text-white mb-1">{plan.name}</h3>
                        <div className="text-3xl text-white mb-1">{plan.price}</div>
                        <p className="text-sm text-gray-400">per month</p>
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-800">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">Step {currentStep} of 4</span>
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {currentStep === 4 ? 'Enter Workspace' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}