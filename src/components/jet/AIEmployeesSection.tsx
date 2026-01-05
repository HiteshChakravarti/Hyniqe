import { useState } from 'react';
import { ArrowRight, Briefcase, Users, TrendingUp, BarChart3, MessageSquare } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Button } from './Button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import estelImage from 'figma:asset/d8b1b79c9918d3d4a6cd73091e9b8a979ab511ff.png';
import karoImage from 'figma:asset/dc52e3f2d941d1a747f54b33e4933a9938c74d6b.png';
import nikiImage from 'figma:asset/f49b3d012c317bec730b62a0ae47b5621fa40ac6.png';
import orinImage from 'figma:asset/9d2219c92c5dcdc3c0d8ce430e2da4aba264e80a.png';
import turboImage from 'figma:asset/11464600c439aa9f3f2e8d58bdd401a64c29ac14.png';

interface AIEmployeesSectionProps {
  setCurrentPage: (page: string) => void;
}

const employees = [
  {
    id: 'estel',
    name: 'Estel',
    role: 'AI Recruiter',
    image: estelImage,
    gradient: 'from-purple-500 to-pink-500',
    icon: Users,
    description: 'Screen candidates, schedule interviews, and find top talent instantly.',
    stats: { tasks: '24', performance: '95%' }
  },
  {
    id: 'karo',
    name: 'Karo',
    role: 'Customer Success',
    image: karoImage,
    gradient: 'from-orange-500 to-yellow-500',
    icon: MessageSquare,
    description: 'Handle support tickets, onboard customers, and boost retention rates.',
    stats: { tasks: '32', performance: '98%' }
  },
  {
    id: 'niki',
    name: 'Niki',
    role: 'Social Media Manager',
    image: nikiImage,
    gradient: 'from-blue-500 to-cyan-500',
    icon: TrendingUp,
    description: 'Create content, schedule posts, and analyze engagement across platforms.',
    stats: { tasks: '45', performance: '92%' }
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Data Analyst',
    image: orinImage,
    gradient: 'from-green-500 to-emerald-500',
    icon: BarChart3,
    description: 'Transform data into insights with visualizations and forecasting.',
    stats: { tasks: '18', performance: '97%' }
  },
  {
    id: 'turbo',
    name: 'Turbo',
    role: 'Sales Specialist',
    image: turboImage,
    gradient: 'from-orange-500 to-red-500',
    icon: Briefcase,
    description: 'Qualify leads, manage pipeline, and close deals faster.',
    stats: { tasks: '38', performance: '94%' }
  }
];

export function AIEmployeesSection({ setCurrentPage }: AIEmployeesSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#4AF2FF]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] relative z-10">
        <SectionHeader
          overline="YOUR AI WORKFORCE"
          title="Meet your new AI employees"
          description="Five specialized AI employees ready to transform how you work. Each one is an expert in their domain, working 24/7 to help you succeed."
          centered
          className="mb-20"
        />

        {/* Main showcase - large character */}
        <div className="mb-16">
          <div className="bg-[#0B0E13] border border-[#222633] rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 p-12">
              {/* Character image */}
              <div className="relative flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-br ${employees[activeIndex].gradient} opacity-10 blur-3xl`} />
                <div className="relative h-80 w-80">
                  <ImageWithFallback
                    src={employees[activeIndex].image}
                    alt={employees[activeIndex].name}
                    className="w-full h-full object-contain drop-shadow-2xl animate-float"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#F7FF5C]/10 to-[#4AF2FF]/10 border border-[#F7FF5C]/20 rounded-full mb-4">
                    <div className="w-2 h-2 bg-[#F7FF5C] rounded-full animate-pulse" />
                    <span className="label-s text-[#F7FF5C]">ONLINE NOW</span>
                  </div>
                  <h3 className="display-xl mb-2">{employees[activeIndex].name}</h3>
                  <p className="body-l text-[#4AF2FF] mb-4">{employees[activeIndex].role}</p>
                  <p className="body-l text-[#A6A7B0] max-w-lg">{employees[activeIndex].description}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                  <div className="bg-[#10141E] border border-[#222633] rounded-2xl p-4">
                    <div className="text-[#F7FF5C] text-2xl font-semibold mb-1">{employees[activeIndex].stats.tasks}</div>
                    <div className="text-[#A6A7B0] text-sm">Tasks Today</div>
                  </div>
                  <div className="bg-[#10141E] border border-[#222633] rounded-2xl p-4">
                    <div className="text-[#4AF2FF] text-2xl font-semibold mb-1">{employees[activeIndex].stats.performance}</div>
                    <div className="text-[#A6A7B0] text-sm">Performance</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-4">
                  <Button rolling onClick={() => setCurrentPage(`helper-dashboard-${employees[activeIndex].id}`)}>
                    Start Conversation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="ghost" onClick={() => setCurrentPage(employees[activeIndex].id)}>
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All employees grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {employees.map((employee, index) => {
            const Icon = employee.icon;
            const isActive = index === activeIndex;
            const isHovered = hoveredId === employee.id;
            
            return (
              <button
                key={employee.id}
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setHoveredId(employee.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  relative group
                  bg-[#0B0E13] border rounded-2xl p-6
                  transition-all duration-300
                  ${isActive 
                    ? 'border-[#F7FF5C] shadow-lg shadow-[#F7FF5C]/20 -translate-y-1' 
                    : 'border-[#222633] hover:border-[#F7FF5C]/50 hover:-translate-y-1'
                  }
                `}
              >
                {/* Glow on hover/active */}
                {(isHovered || isActive) && (
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${employee.gradient} opacity-5 pointer-events-none`} />
                )}

                <div className="relative space-y-4">
                  {/* Image */}
                  <div className="w-20 h-20 mx-auto">
                    <ImageWithFallback
                      src={employee.image}
                      alt={employee.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <div className="text-white font-semibold mb-1">{employee.name}</div>
                    <div className="text-[#A6A7B0] text-xs">{employee.role}</div>
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-10 h-10 mx-auto rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${employee.gradient} opacity-20
                    ${isActive && 'opacity-30'}
                  `}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#F7FF5C]' : 'text-[#A6A7B0]'}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
