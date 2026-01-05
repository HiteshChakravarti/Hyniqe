import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from './Button';

const helpers = [
  { id: 'estel', name: 'Estel - Recruiter', icon: '👔' },
  { id: 'karo', name: 'Karo - Customer Success', icon: '🎯' },
  { id: 'niki', name: 'Niki - Social Media Manager', icon: '📱' },
  { id: 'orin', name: 'Orin - Data Analyst', icon: '📊' },
  { id: 'turbo', name: 'Turbo - Sales Specialist', icon: '💼' },
];

const featuresMenu = [
  { id: 'brain-ai', name: 'Brain AI', subtitle: 'Advanced Intelligence', icon: '🧠' },
  { id: 'integrations', name: 'Integrations', subtitle: 'Connect Your Tools', icon: '🔗' },
];

const resourcesMenu = [
  { id: 'blog', name: 'Blog', icon: '📰' },
  { id: 'case-studies', name: 'Case Studies', icon: '📊' },
  { id: 'help-center', name: 'Help Center', icon: '❓' },
];

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isLoggedIn?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function JetNavigation({ currentPage, setCurrentPage, isLoggedIn, userName, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const featuresDropdownRef = useRef<HTMLDivElement>(null);
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
      if (featuresDropdownRef.current && !featuresDropdownRef.current.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false);
      }
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target as Node)) {
        setResourcesDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    setProductsDropdownOpen(false);
    setFeaturesDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 w-full bg-[#050509]/80 backdrop-blur-xl z-50 border-b border-[#222633]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="text-white text-xl font-bold tracking-tight hover:text-[#F7FF5C] transition-colors"
          >
            HYNIQE
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Products Dropdown */}
            <div className="relative" ref={productsDropdownRef}>
              <button 
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                className="body-m text-[#A6A7B0] hover:text-white transition-colors flex items-center gap-1"
              >
                AI Employees
                <ChevronDown className={`w-4 h-4 transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {productsDropdownOpen && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-[#0B0E13] border border-[#222633] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-2">
                    {helpers.map((helper) => (
                      <button
                        key={helper.id}
                        onClick={() => handleNavClick(helper.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                      >
                        <span className="text-xl">{helper.icon}</span>
                        <span className="body-m text-white">{helper.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Features Dropdown */}
            <div className="relative" ref={featuresDropdownRef}>
              <button 
                onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                className="body-m text-[#A6A7B0] hover:text-white transition-colors flex items-center gap-1"
              >
                Features
                <ChevronDown className={`w-4 h-4 transition-transform ${featuresDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {featuresDropdownOpen && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-[#0B0E13] border border-[#222633] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-2">
                    {featuresMenu.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={() => handleNavClick(feature.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                      >
                        <span className="text-xl">{feature.icon}</span>
                        <div>
                          <div className="body-m text-white">{feature.name}</div>
                          <div className="text-xs text-[#A6A7B0]">{feature.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesDropdownRef}>
              <button 
                onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                className="body-m text-[#A6A7B0] hover:text-white transition-colors flex items-center gap-1"
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${resourcesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {resourcesDropdownOpen && (
                <div className="absolute top-full left-0 mt-4 w-56 bg-[#0B0E13] border border-[#222633] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-2">
                    {resourcesMenu.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => handleNavClick(resource.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                      >
                        <span className="text-xl">{resource.icon}</span>
                        <span className="body-m text-white">{resource.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="body-m text-[#A6A7B0] hover:text-white transition-colors">
              Pricing
            </button>
          </div>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => handleNavClick('dashboard')}
                  className="body-m text-[#A6A7B0] hover:text-white transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={onLogout}
                  className="body-m text-[#A6A7B0] hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleNavClick('login')}
                  className="body-m text-[#A6A7B0] hover:text-white transition-colors"
                >
                  Log In
                </button>
                <Button rolling onClick={() => handleNavClick('signup')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B0E13] border-t border-[#222633] max-h-[80vh] overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Products */}
            <div>
              <p className="label-s text-[#A6A7B0] mb-3">AI Employees</p>
              <div className="space-y-2">
                {helpers.map((helper) => (
                  <button
                    key={helper.id}
                    onClick={() => handleNavClick(helper.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                  >
                    <span className="text-xl">{helper.icon}</span>
                    <span className="body-m text-white">{helper.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="label-s text-[#A6A7B0] mb-3">Features</p>
              <div className="space-y-2">
                {featuresMenu.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleNavClick(feature.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                  >
                    <span className="text-xl">{feature.icon}</span>
                    <span className="body-m text-white">{feature.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="label-s text-[#A6A7B0] mb-3">Resources</p>
              <div className="space-y-2">
                {resourcesMenu.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleNavClick(resource.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#10141E] transition-colors text-left"
                  >
                    <span className="text-xl">{resource.icon}</span>
                    <span className="body-m text-white">{resource.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auth buttons */}
            <div className="pt-4 space-y-3 border-t border-[#222633]">
              {isLoggedIn ? (
                <>
                  <Button variant="ghost" onClick={() => handleNavClick('dashboard')} className="w-full">
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={onLogout} className="w-full">
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => handleNavClick('login')} className="w-full">
                    Log In
                  </Button>
                  <Button rolling onClick={() => handleNavClick('signup')} className="w-full">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
