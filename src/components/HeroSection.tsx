import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight } from 'lucide-react';
import heroImage1 from 'figma:asset/627d4eef9d880d925dfa2fa93675b8237d051c81.png';
import heroImage2 from 'figma:asset/dfdcf8fe9b00501ba3bea4eb46071cc870ffa3ef.png';
import heroImage3 from 'figma:asset/0efc057ab958e3dd65f3234614448f302dd02092.png';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 pt-24 w-full text-center">
        {/* Main Hero Image */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <ImageWithFallback
              src={heroImage2}
              alt="AI Employee"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Hero Text */}
        <h1 className="text-white mb-6 max-w-4xl mx-auto">
          AI Employees: Your Helpers That Never Sleep
        </h1>
        
        <p className="text-gray-400 text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
          HYNIQE, World's first AI helpers, developed for your business. There
          are specialized AI Employees for different workforces, helping businesses of
          all sizes prepare for the future. Making work seamless.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3.5 rounded-lg text-white transition-colors flex items-center justify-center gap-2 group">
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
