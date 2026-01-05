import { ArrowRight, Sparkles, Zap, Users } from 'lucide-react';
import { Button } from './Button';
import { Pill } from './Pill';

interface HeroSectionProps {
  setCurrentPage?: (page: string) => void;
}

export function JetHeroSection({ setCurrentPage }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7FF5C]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4AF2FF]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8 animate-fadeInUp">
            {/* Pill */}
            <Pill variant="accent">
              <Sparkles className="w-3 h-3" />
              NEW: AI WORKFORCE 2025
            </Pill>

            {/* Headline */}
            <h1 className="display-xl text-white">
              Lightning fast AI employees.{' '}
              <span className="bg-gradient-to-r from-[#F7FF5C] to-[#4AF2FF] bg-clip-text text-transparent">
                In a single click.
              </span>
            </h1>

            {/* Description */}
            <p className="body-l text-[#A6A7B0] max-w-xl">
              HYNIQE delivers a complete AI workforce that handles recruiting, customer success, social media, data analysis, and sales. Deploy in seconds, scale instantly.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button rolling onClick={() => setCurrentPage?.('signup')}>
                Start Free Trial
              </Button>
              <Button variant="ghost" onClick={() => setCurrentPage?.('dashboard')}>
                View Dashboard
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-[#222633]">
              <div>
                <div className="text-white text-2xl font-semibold mb-1">500+</div>
                <div className="text-[#A6A7B0] text-sm">Companies</div>
              </div>
              <div>
                <div className="text-white text-2xl font-semibold mb-1">10,000+</div>
                <div className="text-[#A6A7B0] text-sm">AI Employees</div>
              </div>
              <div>
                <div className="text-white text-2xl font-semibold mb-1">99.9%</div>
                <div className="text-[#A6A7B0] text-sm">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            {/* Main card */}
            <div className="relative bg-[#0B0E13] border border-[#222633] rounded-3xl p-8 shadow-2xl">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#F7FF5C]/10 to-[#4AF2FF]/10 blur-xl opacity-50" />
              
              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[#A6A7B0] text-sm mb-1">AI Workforce Dashboard</div>
                    <div className="text-white text-2xl font-semibold">95% Performance</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#050509]" />
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#A6A7B0]">Tasks Completed</span>
                      <span className="text-white">156/160</span>
                    </div>
                    <div className="h-2 bg-[#10141E] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#F7FF5C] to-[#4AF2FF] rounded-full" style={{ width: '97.5%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#A6A7B0]">Active Employees</span>
                      <span className="text-white">5/5</span>
                    </div>
                    <div className="h-2 bg-[#10141E] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4AF2FF] to-[#F7FF5C] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#A6A7B0]">Time Saved</span>
                      <span className="text-white">142 hours</span>
                    </div>
                    <div className="h-2 bg-[#10141E] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#F7FF5C] to-[#4AF2FF] rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-[#10141E] rounded-2xl p-4 border border-[#222633]">
                    <div className="text-[#4AF2FF] text-2xl font-semibold mb-1">24</div>
                    <div className="text-[#A6A7B0] text-sm">Today</div>
                  </div>
                  <div className="bg-[#10141E] rounded-2xl p-4 border border-[#222633]">
                    <div className="text-[#F7FF5C] text-2xl font-semibold mb-1">+15%</div>
                    <div className="text-[#A6A7B0] text-sm">Growth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF] rounded-2xl flex items-center justify-center animate-float shadow-lg shadow-[#F7FF5C]/30">
              <Users className="w-10 h-10 text-[#050509]" />
            </div>

            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#0B0E13] border border-[#F7FF5C]/30 rounded-2xl flex items-center justify-center animate-float shadow-lg" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-8 h-8 text-[#F7FF5C]" />
            </div>
          </div>
        </div>

        {/* Trusted by logos */}
        <div className="mt-24 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <p className="text-center text-[#A6A7B0] text-sm mb-8">Trusted by innovative companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
            <div className="text-white text-xl font-semibold">TechCorp</div>
            <div className="text-white text-xl font-semibold">DataFlow</div>
            <div className="text-white text-xl font-semibold">CloudScale</div>
            <div className="text-white text-xl font-semibold">AI Ventures</div>
            <div className="text-white text-xl font-semibold">FutureNow</div>
          </div>
        </div>
      </div>
    </section>
  );
}
