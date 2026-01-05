import { useState } from 'react';
import { AppRouter } from './components/AppRouter';
import { HeaderEffectsDemo } from './components/HeaderEffectsDemo';
import { AppProvider } from './contexts/AppContext';
import './styles/globals.css';

export default function App() {
  const [showDemo, setShowDemo] = useState(false);

  if (showDemo) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <HeaderEffectsDemo onBack={() => setShowDemo(false)} />
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-bg-primary">
        {/* Demo Access Button - Temporary */}
        <button
          onClick={() => setShowDemo(true)}
          className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
        >
          <span className="text-xl">🎬</span>
          View Effects Demo
        </button>
        
        <AppRouter />
      </div>
    </AppProvider>
  );
}