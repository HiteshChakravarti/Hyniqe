import { ImageWithFallback } from './figma/ImageWithFallback';
import { Building2, ShoppingCart, Briefcase, GraduationCap } from 'lucide-react';

const useCases = [
  {
    icon: Building2,
    title: 'Enterprise',
    description: 'Scale operations, automate workflows, and boost productivity across departments.',
    image: 'https://images.unsplash.com/photo-1496180470114-6ef490f3ff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY0NTQwNDI1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    stats: '500+ Companies',
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce',
    description: 'Handle customer service, manage inventory, and optimize sales funnels automatically.',
    image: 'https://images.unsplash.com/photo-1709715357510-b687304cee3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXN0b21lciUyMHNlcnZpY2UlMjB0ZWFtfGVufDF8fHx8MTc2NDU2NDU2NHww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: '1M+ Orders Processed',
  },
  {
    icon: Briefcase,
    title: 'Startups',
    description: 'Move fast with AI employees that handle tasks you don\'t have time for.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2NDQ5MjUwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: '2000+ Startups',
  },
  {
    icon: GraduationCap,
    title: 'Education',
    description: 'Provide instant support to students and automate administrative tasks.',
    image: 'https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY0NTYwMzY4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    stats: '10K+ Students Helped',
  },
];

export function UseCases() {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-white mb-4">
            Trusted Across Industries
          </h2>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            From startups to enterprises, businesses rely on our AI employees
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all"
            >
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <useCase.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white">{useCase.title}</h3>
                  <span className="text-blue-400 text-sm">{useCase.stats}</span>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
