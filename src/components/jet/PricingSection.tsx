import { Check, Sparkles } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Button } from './Button';
import { Pill } from './Pill';

export function JetPricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '49',
      description: 'Perfect for small teams getting started with AI',
      features: [
        'Up to 2 AI employees',
        '1,000 tasks per month',
        'Basic analytics',
        'Email support',
        'API access'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: '149',
      description: 'For growing teams that need more power',
      features: [
        'Up to 5 AI employees',
        'Unlimited tasks',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Team collaboration',
        'Advanced security'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited AI employees',
        'Unlimited everything',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom AI training',
        'SLA guarantee',
        'On-premise deployment'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F7FF5C]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] relative z-10">
        <SectionHeader
          overline="PRICING"
          title="Simple, transparent pricing"
          description="Start free, scale as you grow. All plans include a 14-day free trial."
          centered
          className="mb-20"
        />

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                relative
                bg-[#0B0E13] border rounded-3xl p-8
                transition-all duration-300 hover:-translate-y-1
                ${plan.popular 
                  ? 'border-[#F7FF5C] shadow-2xl shadow-[#F7FF5C]/20' 
                  : 'border-[#222633] hover:border-[#F7FF5C]/50'
                }
              `}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Pill variant="accent">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </Pill>
                </div>
              )}

              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="heading-h3 text-white mb-2">{plan.name}</h3>
                  <p className="text-[#A6A7B0] text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  {plan.price === 'Custom' ? (
                    <div className="text-white text-4xl font-semibold">Custom</div>
                  ) : (
                    <>
                      <div className="text-white text-4xl font-semibold">${plan.price}</div>
                      <div className="text-[#A6A7B0]">/month</div>
                    </>
                  )}
                </div>

                {/* CTA */}
                <Button 
                  variant={plan.popular ? 'primary' : 'ghost'} 
                  rolling={plan.popular}
                  className="w-full"
                >
                  {plan.cta}
                </Button>

                {/* Features */}
                <div className="pt-6 border-t border-[#222633] space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                        ${plan.popular 
                          ? 'bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF]' 
                          : 'bg-[#10141E] border border-[#222633]'
                        }
                      `}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-[#050509]' : 'text-[#4AF2FF]'}`} />
                      </div>
                      <span className="text-[#A6A7B0] text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ link */}
        <div className="text-center mt-16">
          <p className="text-[#A6A7B0]">
            Have questions?{' '}
            <a href="#faq" className="text-[#F7FF5C] hover:text-[#FFFF8F] transition-colors">
              Check our FAQ
            </a>
            {' '}or{' '}
            <a href="#contact" className="text-[#4AF2FF] hover:text-[#6FF5FF] transition-colors">
              contact sales
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
