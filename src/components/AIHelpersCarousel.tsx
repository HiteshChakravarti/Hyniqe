import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import estelImage from 'figma:asset/d8b1b79c9918d3d4a6cd73091e9b8a979ab511ff.png';
import karoImage from 'figma:asset/dc52e3f2d941d1a747f54b33e4933a9938c74d6b.png';
import nikiImage from 'figma:asset/f49b3d012c317bec730b62a0ae47b5621fa40ac6.png';
import orinImage from 'figma:asset/9d2219c92c5dcdc3c0d8ce430e2da4aba264e80a.png';
import turboImage from 'figma:asset/11464600c439aa9f3f2e8d58bdd401a64c29ac14.png';

const helpers = [
  {
    id: 'estel',
    name: 'Estel',
    role: 'Recruiter',
    description: 'Finds top talent, screens candidates, and streamlines your hiring process with AI-powered recruitment.',
    image: estelImage,
    gradient: 'from-purple-500 to-pink-500',
    color: '#a855f7',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    tasksToday: 24,
    accuracy: 96,
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success AI',
    description: 'Handle support tickets, onboard users, and maintain relationships. Karo ensures your customers are always delighted.',
    image: karoImage,
    gradient: 'from-orange-500 to-yellow-500',
    color: '#f97316',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    tasksToday: 32,
    accuracy: 98,
  },
  {
    id: 'niki',
    name: 'Niki',
    role: 'Social Media Manager',
    description: 'Creates engaging content, schedules posts, and manages your social media presence across all platforms.',
    image: nikiImage,
    gradient: 'from-blue-500 to-cyan-500',
    color: '#06b6d4',
    buttonColor: 'bg-cyan-600 hover:bg-cyan-700',
    tasksToday: 28,
    accuracy: 94,
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    description: 'Analyze trends, generate insights, and create reports. Orin transforms your data into actionable intelligence.',
    image: orinImage,
    gradient: 'from-green-500 to-emerald-500',
    color: '#10b981',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    tasksToday: 18,
    accuracy: 99,
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    description: 'Helps qualify leads, manage pipelines, and close deals with proven sales strategies and lightning-fast responses.',
    image: turboImage,
    gradient: 'from-orange-500 to-red-500',
    color: '#ef4444',
    buttonColor: 'bg-red-600 hover:bg-red-700',
    tasksToday: 41,
    accuracy: 97,
  },
];

interface AIHelpersCarouselProps {
  setCurrentPage: (page: string) => void;
}

export function AIHelpersCarousel({ setCurrentPage }: AIHelpersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentHelper = helpers[currentIndex];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= helpers.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAutoPlaying(false);
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev <= 0 ? helpers.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAutoPlaying(false);
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev >= helpers.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleThumbnailClick = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAutoPlaying(false);
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <section className="py-20 px-6 lg:px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-white mb-4">
            Meet your <span className="text-blue-400">AI employees</span>
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Five specialized AI teammates ready to transform your business operations.<br />
            Each one expertly trained for their role.
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all border border-white/20 disabled:opacity-50 hover:scale-110 active:scale-95"
            aria-label="Previous helper"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all border border-white/20 disabled:opacity-50 hover:scale-110 active:scale-95"
            aria-label="Next helper"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Carousel Content */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 px-16 lg:px-20">
            {/* Left Side - Character Image */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative aspect-[4/5] max-w-md mx-auto">
                {/* Character Image with smooth transition */}
                <div 
                  className="absolute inset-0 transition-all duration-700 ease-out rounded-3xl overflow-hidden"
                  key={currentHelper.id}
                  style={{
                    animation: 'fadeSlideIn 0.7s ease-out',
                  }}
                >
                  <img
                    src={currentHelper.image}
                    alt={currentHelper.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${currentHelper.gradient} opacity-20`} />
                </div>

                {/* Name Badge */}
                <div 
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full text-white shadow-2xl z-10 transition-all duration-500"
                  style={{ backgroundColor: currentHelper.color }}
                >
                  {currentHelper.name}
                </div>
              </div>
            </div>

            {/* Right Side - Info Card */}
            <div className="w-full lg:w-1/2">
              <div 
                className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 lg:p-10 transition-all duration-700"
                key={`card-${currentHelper.id}`}
                style={{
                  animation: 'fadeSlideIn 0.7s ease-out 0.1s backwards',
                }}
              >
                {/* Online Status */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Online</span>
                </div>

                {/* Name & Role */}
                <h3 className="text-white mb-2">{currentHelper.name}</h3>
                <p className="text-gray-400 mb-6">{currentHelper.role}</p>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed mb-8">
                  {currentHelper.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-white text-3xl mb-1">{currentHelper.tasksToday}</div>
                    <div className="text-gray-500 text-sm">Tasks Today</div>
                  </div>
                  <div>
                    <div className="text-white text-3xl mb-1">{currentHelper.accuracy}%</div>
                    <div className="text-gray-500 text-sm">Accuracy</div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full ${currentHelper.buttonColor} text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 shadow-lg`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with {currentHelper.name}
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex justify-center gap-4 mt-16">
            {helpers.map((helper, index) => (
              <button
                key={helper.id}
                onClick={() => handleThumbnailClick(index)}
                disabled={isAnimating}
                className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
                  currentIndex === index
                    ? 'ring-4 ring-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                    : 'opacity-50 hover:opacity-100 hover:scale-105 ring-2 ring-gray-700'
                } disabled:opacity-30`}
              >
                <img
                  src={helper.image}
                  alt={helper.name}
                  className="w-full h-full object-cover"
                />
                {currentIndex !== index && (
                  <div className="absolute inset-0 bg-black/40" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
