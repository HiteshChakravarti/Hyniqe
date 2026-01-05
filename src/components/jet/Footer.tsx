import { Twitter, Linkedin, Github, Youtube } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export function JetFooter({ setCurrentPage }: FooterProps) {
  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#222633] bg-[#050509]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
          {/* Company */}
          <div className="col-span-2">
            <div className="mb-6">
              <h3 className="text-white text-xl font-bold mb-3">HYNIQE</h3>
              <p className="text-[#A6A7B0] body-m">
                Lightning fast AI employees for modern teams. Deploy in seconds, scale instantly.
              </p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-[#0B0E13] border border-[#222633] hover:border-[#F7FF5C] flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-[#A6A7B0] hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-[#0B0E13] border border-[#222633] hover:border-[#F7FF5C] flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5 text-[#A6A7B0] hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-[#0B0E13] border border-[#222633] hover:border-[#F7FF5C] flex items-center justify-center transition-colors">
                <Github className="w-5 h-5 text-[#A6A7B0] hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-[#0B0E13] border border-[#222633] hover:border-[#F7FF5C] flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5 text-[#A6A7B0] hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* AI Employees */}
          <div>
            <h4 className="text-white font-semibold mb-4">AI Employees</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleNavClick('estel')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Estel - Recruiter
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('karo')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Karo - Customer Success
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('niki')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Niki - Social Media
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('orin')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Orin - Data Analyst
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('turbo')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Turbo - Sales
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleNavClick('brain-ai')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Brain AI
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('integrations')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Integrations
                </button>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => handleNavClick('blog')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Blog
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('case-studies')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Case Studies
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('help-center')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => handleNavClick('documentation')} className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Documentation
                </button>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
                  Partners
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#222633] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#A6A7B0] text-sm">
            © 2025 HYNIQE. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-[#A6A7B0] hover:text-white transition-colors text-sm">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
