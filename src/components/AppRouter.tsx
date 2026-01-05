import { useState } from 'react';
import { Navigation } from './Navigation';
import { Hero } from './Hero';
import { AIHelpers } from './AIHelpers';
import { HelpersShowcase } from './HelpersShowcase';
import { JourneyStepper } from './JourneyStepper';
import { IntegrationsShowcase } from './IntegrationsShowcase';
import { FAQ } from './FAQ';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';
import { AuthPages } from './AuthPages';
import { EshaPage } from './pages/EshaPage';
import { KaroPage } from './pages/KaroPage';
import { NiviPage } from './pages/NiviPage';
import { OrinPage } from './pages/OrinPage';
import { TurboPage } from './pages/TurboPage';
import { PricingPage } from './pages/PricingPage';
import { BrainPage } from './pages/BrainPage';
import { IntegrationsPage } from './IntegrationsPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HeaderEffectsDemo } from './HeaderEffectsDemo';
import { HelperDashboard } from './HelperDashboard';
import { OnboardingFlow } from './OnboardingFlow';
import { PowerUpsPage } from './PowerUpsPage';
import { HelpersPage } from './HelpersPage';
import { BrainKnowledgePage } from './BrainKnowledgePage';
import { HistoryPage } from './HistoryPage';
import { HomeDashboard } from './HomeDashboard';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { useApp } from '../contexts/AppContext';
import { Workspace, Profile, OrgType, PlanTier } from '../types';

// Import new pages
import { ProfilesManagerPage } from './ProfilesManagerPage';
import { ActivityPage } from './ActivityPage';
import { AppIntegrationsPage } from './AppIntegrationsPage';
import { BillingPage } from './BillingPage';
import { OverridesPage } from './OverridesPage';
import { WorkflowsPage } from './WorkflowsPage';
import { AgencyOverviewPage } from './AgencyOverviewPage';
import { AgencyClientsPage } from './AgencyClientsPage';
import { DashboardHomePage } from './DashboardHomePage';

type PageView = 
  | 'home' 
  | 'esha' 
  | 'karo' 
  | 'nivi'
  | 'orin' 
  | 'turbo' 
  | 'pricing' 
  | 'auth' 
  | 'brain' 
  | 'integrations' 
  | 'features'
  | 'effects-demo'
  | 'esha-dashboard'
  | 'karo-dashboard'
  | 'nivi-dashboard'
  | 'orin-dashboard'
  | 'turbo-dashboard'
  | 'onboarding'
  | 'dashboard'
  | 'powerups'
  | 'helpers'
  | 'brain-knowledge'
  | 'history'
  | 'profile'
  | 'settings'
  | 'profiles-manager'
  | 'profiles'
  | 'activity'
  | 'app-integrations'
  | 'billing'
  | 'overrides'
  | 'workflows'
  | 'agency-overview'
  | 'agency-clients';

export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (name: string) => {
    setIsAuthenticated(true);
    setUserName(name);
    setUserEmail(name); // Using name as email for now
    // After login, go to onboarding
    setCurrentPage('onboarding');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingComplete = (data: any) => {
    setHasCompletedOnboarding(true);
    setUserData(data);
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setUserEmail('');
    setHasCompletedOnboarding(false);
    setUserData(null);
    setCurrentPage('home');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render auth page
  if (currentPage === 'auth') {
    return <AuthPages onLogin={handleLogin} setCurrentPage={(page) => setCurrentPage(page as PageView)} />;
  }

  // Render individual pages
  if (currentPage === 'esha') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <EshaPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'karo') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <KaroPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'nivi') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <NiviPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'orin') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <OrinPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'turbo') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <TurboPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'pricing') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <PricingPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'brain') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <BrainPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'integrations') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <IntegrationsPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  if (currentPage === 'features') {
    return (
      <>
        <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
        <FeaturesPage onBack={handleBack} onNavigate={handleNavigate} />
        <Footer />
      </>
    );
  }

  // Effects Demo
  if (currentPage === 'effects-demo') {
    return <HeaderEffectsDemo onBack={handleBack} />;
  }

  // Render helper dashboards
  if (currentPage === 'esha-dashboard') {
    return <HelperDashboard helperId="esha" onBack={hasCompletedOnboarding ? handleBackToDashboard : handleBack} />;
  }

  if (currentPage === 'karo-dashboard') {
    return <HelperDashboard helperId="karo" onBack={hasCompletedOnboarding ? handleBackToDashboard : handleBack} />;
  }

  if (currentPage === 'nivi-dashboard') {
    return <HelperDashboard helperId="nivi" onBack={hasCompletedOnboarding ? handleBackToDashboard : handleBack} />;
  }

  if (currentPage === 'orin-dashboard') {
    return <HelperDashboard helperId="orin" onBack={hasCompletedOnboarding ? handleBackToDashboard : handleBack} />;
  }

  if (currentPage === 'turbo-dashboard') {
    return <HelperDashboard helperId="turbo" onBack={hasCompletedOnboarding ? handleBackToDashboard : handleBack} />;
  }

  // Onboarding flow
  if (currentPage === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} userEmail={userEmail} />;
  }

  // Power-Ups page
  if (currentPage === 'powerups') {
    return <PowerUpsPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Helpers page
  if (currentPage === 'helpers') {
    return <HelpersPage onNavigateToHelper={handleNavigate} onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Brain Knowledge page
  if (currentPage === 'brain-knowledge') {
    return <BrainKnowledgePage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // History page
  if (currentPage === 'history') {
    return <HistoryPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Home dashboard
  if (currentPage === 'dashboard') {
    return <DashboardHomePage onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Profile page
  if (currentPage === 'profile') {
    return <ProfilePage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Settings page
  if (currentPage === 'settings') {
    return <SettingsPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Profiles Manager page
  if (currentPage === 'profiles-manager' || currentPage === 'profiles') {
    return <ProfilesManagerPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Activity page
  if (currentPage === 'activity') {
    return <ActivityPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // App Integrations page
  if (currentPage === 'app-integrations') {
    return <AppIntegrationsPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Billing page
  if (currentPage === 'billing') {
    return <BillingPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Overrides page
  if (currentPage === 'overrides') {
    return <OverridesPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Workflows page
  if (currentPage === 'workflows') {
    return <WorkflowsPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Agency Overview page
  if (currentPage === 'agency-overview') {
    return <AgencyOverviewPage onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Agency Clients page
  if (currentPage === 'agency-clients') {
    return <AgencyClientsPage onBack={handleBackToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // Home page (default)
  return (
    <>
      <Navigation 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        isAuthenticated={isAuthenticated}
        userName={userName}
        onLogout={handleLogout}
      />
      <Hero onGetStarted={() => handleNavigate('auth')} />
      <AIHelpers onNavigate={(helper) => handleNavigate(helper as PageView)} />
      <HelpersShowcase onNavigate={(helper) => handleNavigate(helper as PageView)} />
      <JourneyStepper onGetStarted={() => handleNavigate('auth')} />
      <IntegrationsShowcase />
      <FAQ />
      <FinalCTA onGetStarted={() => handleNavigate('auth')} />
      <Footer />
    </>
  );
}