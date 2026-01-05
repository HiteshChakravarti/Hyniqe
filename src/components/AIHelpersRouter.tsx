import { useState } from 'react';
import { AIHelpers } from './AIHelpers';
import { EstelPage } from './pages/EstelPage';
import { KaroPage } from './pages/KaroPage';
import { NikiPage } from './pages/NikiPage';
import { OrinPage } from './pages/OrinPage';
import { TurboPage } from './pages/TurboPage';

type HelperView = 'gallery' | 'estel' | 'karo' | 'niki' | 'orin' | 'turbo';

export function AIHelpersRouter() {
  const [currentView, setCurrentView] = useState<HelperView>('gallery');

  const handleNavigate = (helper: string) => {
    setCurrentView(helper as HelperView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentView('gallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthNavigation = (page: 'auth') => {
    // Navigate to auth page - this will be handled by the AppRouter
    window.location.hash = '#auth';
  };

  switch (currentView) {
    case 'estel':
      return <EstelPage onBack={handleBack} onNavigate={handleAuthNavigation} />;
    case 'karo':
      return <KaroPage onBack={handleBack} onNavigate={handleAuthNavigation} />;
    case 'niki':
      return <NikiPage onBack={handleBack} onNavigate={handleAuthNavigation} />;
    case 'orin':
      return <OrinPage onBack={handleBack} onNavigate={handleAuthNavigation} />;
    case 'turbo':
      return <TurboPage onBack={handleBack} onNavigate={handleAuthNavigation} />;
    case 'gallery':
    default:
      return <AIHelpers onNavigate={handleNavigate} />;
  }
}