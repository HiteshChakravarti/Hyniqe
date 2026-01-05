import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const testimonials = [
  {
    quote: "HYNÍQÉ transformed our recruitment process. Esha screened 200+ candidates and found our perfect hire in just 3 days. Absolutely game-changing.",
    author: "Sarah Chen",
    role: "Head of HR",
    company: "TechFlow Inc",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop",
  },
  {
    quote: "Our sales pipeline has never been healthier. Turbo qualifies leads while I focus on closing deals. We've increased conversions by 40% in two months.",
    author: "Marcus Rodriguez",
    role: "Sales Director",
    company: "GrowthLabs",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&fit=crop",
  },
  {
    quote: "The analytics from Orin are incredible. We finally have real-time insights into our business. It's like having a data scientist on call 24/7.",
    author: "Emily Watson",
    role: "CEO",
    company: "DataDrive",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&fit=crop",
  },
];

export function Testimonials() {
  return (
    <section className="section-padding bg-[#131318]/30">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <h2 className="mb-4">
            Loved by <span className="text-gradient">10,000+ teams</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-2xl mx-auto">
            See how businesses are transforming their operations with AI employees.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card p-6 lg:p-8 h-full flex flex-col hover:bg-[#1a1a24]/60 transition-all">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[#a1a1aa] mb-6 flex-grow leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <ImageWithFallback
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-16 h-16 rounded-full object-cover bg-[#1a1a24]"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-[#71717a]">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 lg:mt-24"
        >
          <p className="text-center text-sm text-[#52525b] mb-8 font-medium">Trusted by innovative companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {['Acme Corp', 'TechFlow', 'GrowthLabs', 'BrandBoost', 'Innovate', 'StartupCo'].map((company) => (
              <div key={company} className="text-[#71717a] font-semibold text-lg">
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}