import { useState } from 'react';
import { Menu, X, ChevronDown, User, LogOut, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HoverScrambleText } from './effects/HoverScrambleText';
import { SwipeLettersNav } from './SwipeLettersNav';
import { RollingText } from './RollingText';
import { SwipeLettersButton } from './SwipeLettersButton';

type PageView = 'home' | 'esha' | 'karo' | 'nivi' | 'orin' | 'turbo' | 'pricing' | 'auth' | 'brain' | 'integrations' | 'features';

interface NavigationProps {
  onNavigate?: (page: PageView) => void;
  currentPage?: PageView;
  isAuthenticated?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function Navigation({ onNavigate, currentPage = 'home', isAuthenticated = false, userName = '', onLogout }: NavigationProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);

  const handleNavClick = (page: PageView) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsOpen(false);
    setShowAIDropdown(false);
  };

  const aiHelpers = [
    { id: 'esha', name: 'Esha', role: 'AI Recruiter' },
    { id: 'karo', name: 'Karo', role: 'Customer Success' },
    { id: 'nivi', name: 'Nivi', role: 'Social Media Manager' },
    { id: 'orin', name: 'Orin', role: 'Data Analyst' },
    { id: 'turbo', name: 'Turbo', role: 'Sales Specialist' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-border-subtle bg-white/70">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')}
            className="text-2xl font-bold text-gradient"
          >
            HYNÍQÉ
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* AI Employees Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowAIDropdown(true)}
                onMouseLeave={() => setShowAIDropdown(false)}
                className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <SwipeLettersNav text="AI Employees" direction="bottom" />
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showAIDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setShowAIDropdown(true)}
                    onMouseLeave={() => setShowAIDropdown(false)}
                    className="absolute top-full left-0 mt-2 w-64 glass-card p-2"
                  >
                    {aiHelpers.map((helper) => (
                      <a
                        key={helper.id}
                        href={`#${helper.id}`}
                        onClick={() => handleNavClick(helper.id as PageView)}
                        className="block px-4 py-3 rounded-lg hover:bg-accent-primary/10 transition-colors"
                      >
                        <div className="font-medium text-text-primary">{helper.name}</div>
                        <div className="text-sm text-text-tertiary">{helper.role}</div>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => handleNavClick('features')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <SwipeLettersNav text="Features" direction="bottom" />
            </button>
            <button 
              onClick={() => handleNavClick('integrations')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <SwipeLettersNav text="Integrations" direction="bottom" />
            </button>
            <button 
              onClick={() => handleNavClick('brain')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <SwipeLettersNav text="Brain AI" direction="bottom" />
            </button>
            <button 
              onClick={() => handleNavClick('pricing')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <SwipeLettersNav text="Pricing" direction="bottom" />
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-tertiary border border-border-soft text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{userName || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setShowUserDropdown(true)}
                      onMouseLeave={() => setShowUserDropdown(false)}
                      className="absolute top-full right-0 mt-2 w-48 glass-card p-2"
                    >
                      <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => handleNavClick('auth')}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <SwipeLettersNav text="Login" direction="bottom" />
                </button>
                <SwipeLettersButton
                  onClick={() => handleNavClick('auth')}
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-5 h-5" />}
                  direction="bottom"
                >
                  Get Started
                </SwipeLettersButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-text-primary"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-border-subtle bg-white/95 backdrop-blur-md"
          >
            <div className="container-custom py-6 space-y-4">
              {/* AI Employees */}
              <div>
                <button
                  onClick={() => setShowAIDropdown(!showAIDropdown)}
                  className="flex items-center justify-between w-full text-text-primary font-medium"
                >
                  AI Employees
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAIDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAIDropdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 space-y-2 pl-4"
                    >
                      {aiHelpers.map((helper) => (
                        <a
                          key={helper.id}
                          href={`#${helper.id}`}
                          onClick={() => handleNavClick(helper.id as PageView)}
                          className="block py-2 text-text-secondary hover:text-text-primary"
                        >
                          {helper.name} - {helper.role}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => handleNavClick('features')}
                className="block text-left text-text-primary font-medium w-full"
              >
                <HoverScrambleText text="Features" />
              </button>
              <button 
                onClick={() => handleNavClick('integrations')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <HoverScrambleText text="Integrations" />
              </button>
              <button 
                onClick={() => handleNavClick('brain')}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <HoverScrambleText text="Brain AI" />
              </button>
              <button 
                onClick={() => handleNavClick('pricing')}
                className="block text-left text-text-primary font-medium w-full"
              >
                <HoverScrambleText text="Pricing" />
              </button>

              <div className="pt-4 space-y-3 border-t border-border-subtle">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3 text-text-primary font-medium">
                      <User className="w-5 h-5" />
                      {userName || 'User'}
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full py-3 text-red-600 font-medium border border-red-500/30 rounded-full hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleNavClick('auth')}
                      className="w-full py-3 text-text-primary font-medium border border-border-soft rounded-full hover:bg-bg-tertiary transition-colors"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => handleNavClick('auth')}
                      className="w-full py-3 bg-accent-primary text-white rounded-full font-medium hover:bg-accent-primary/90 transition-colors"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}