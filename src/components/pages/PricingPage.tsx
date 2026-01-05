import { motion } from 'motion/react';
import { Check, ArrowLeft, ChevronDown, Zap, Users, Crown, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';

const plans = [
  {
    name: 'Starter',
    subtitle: 'For individuals',
    price: '39',
    priceInr: '3,499',
    yearlyPrice: '312',
    yearlyPriceInr: '28,008',
    description: 'Perfect for freelancers & solo operators',
    features: [
      'Choose any 2 AI Employees',
      '1 workspace',
      '150 credits/month',
      'Standard integrations',
      'Community support'
    ],
    popular: false,
    cta: 'Start Free Trial',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-500',
    forWho: 'individuals'
  },
  {
    name: 'Hyniqé X',
    subtitle: 'Best value',
    price: '97',
    priceInr: '8,699',
    yearlyPrice: '780',
    yearlyPriceInr: '69,912',
    description: 'Everything you need to scale',
    features: [
      'All 5 AI Employees',
      'Unlimited workspaces',
      '250 credits/month',
      'All integrations + Brain',
      'Priority support'
    ],
    popular: true,
    cta: 'Start Free Trial',
    icon: Zap,
    gradient: 'from-purple-500 to-pink-500',
    forWho: 'most teams'
  },
  {
    name: 'Agency / Team',
    subtitle: 'For teams & agencies',
    price: '149',
    priceInr: '13,349',
    yearlyPrice: '1188',
    yearlyPriceInr: '106,512',
    description: 'Built for collaboration at scale',
    features: [
      'Everything in Hyniqé X',
      'Team controls & roles',
      '3 seats included',
      '750 credits/month',
      'Shared knowledge + audit log'
    ],
    seatAddOn: {
      priceRange: '$9-19',
      priceRangeInr: '₹799-1,699',
      description: 'per additional user/month'
    },
    popular: false,
    cta: 'Start Free Trial',
    icon: Crown,
    gradient: 'from-orange-500 to-red-500',
    forWho: 'agencies'
  },
];

const creditTopUps = [
  {
    credits: 100,
    price: '$15',
    priceInr: '₹1,349',
    popular: false
  },
  {
    credits: 500,
    price: '$49',
    priceInr: '₹4,399',
    popular: true
  },
  {
    credits: 2000,
    price: '$149',
    priceInr: '₹13,349',
    popular: false
  }
];

const faqs = [
  {
    question: 'What are credits and how do they work?',
    answer: 'Credits are used ONLY for Power-Ups and heavy AI actions (like multi-doc generation, deep research, ATS scans, bulk workflows). Basic chat with your AI employees is unlimited and completely free—no credits needed! Credits reset monthly and unused credits don\'t roll over.',
  },
  {
    question: 'Can I buy more credits if I run out?',
    answer: 'Yes! You can purchase credit top-ups anytime. Unlike monthly credits, top-ups never expire and carry over month-to-month until you use them.',
  },
  {
    question: 'How does the Team plan seat pricing work?',
    answer: 'The Team plan includes 3 seats for $149/month. You can add additional team members at $9-19/user/month depending on their role and access level. Add or remove seats anytime with prorated billing.',
  },
  {
    question: 'What\'s the difference between workspaces and helpers?',
    answer: 'Workspaces are separate environments for different projects or clients. Helpers (AI Employees) are your AI specialists like Esha, Karo, Nivi, Orin, and Turbo. On Starter, you get 1 workspace with any 2 helpers. On Hyniqé X and Team plans, you get unlimited workspaces with all 5 helpers.',
  },
  {
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at your next billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, UPI (for INR), and bank transfers for annual plans.',
  },
  {
    question: 'Is there a long-term commitment?',
    answer: 'No! All plans are month-to-month with no contracts. Annual plans offer 2 months free and can be purchased upfront, but there\'s no obligation.',
  },
  {
    question: 'What happens after my free trial ends?',
    answer: 'Your 14-day free trial includes full access to the Hyniqé X plan features. We\'ll remind you 3 days before it ends. If you don\'t add payment, your account pauses (but your data stays safe for 30 days).',
  },
];

interface PricingPageProps {
  onBack?: () => void;
  onNavigate?: (page: 'auth') => void;
}

export function PricingPage({ onBack, onNavigate }: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'usd' | 'inr'>('usd');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const calculateSavings = (monthlyPrice: string, yearlyPrice: string) => {
    const monthly = Number(monthlyPrice) * 12;
    const yearly = Number(yearlyPrice);
    return monthly - yearly;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50/50 via-white to-cyan-50/30">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 text-[#18181b]">
              Simple, <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 bg-clip-text text-transparent">transparent pricing</span>
            </h1>
            <p className="text-xl text-[#52525b] max-w-2xl mx-auto mb-8">
              Start free, scale as you grow. All plans include a 14-day free trial with full access.
            </p>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-purple-200/50 shadow-lg rounded-full p-2">
                <button
                  className={`px-8 py-3 rounded-full shadow-md transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                      : 'text-[#52525b] hover:text-[#18181b] hover:bg-white/50'
                  }`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`px-8 py-3 rounded-full transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                      : 'text-[#52525b] hover:text-[#18181b] hover:bg-white/50'
                  }`}
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual
                  <span className={`ml-2 text-xs font-medium ${
                    billingCycle === 'annual' ? 'text-cyan-200' : 'text-green-600'
                  }`}>2 months free</span>
                </button>
              </div>

              {/* Currency Toggle */}
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-xl border border-purple-200/50 shadow-lg rounded-full p-2">
                <button
                  className={`px-6 py-3 rounded-full transition-all text-sm ${
                    currency === 'usd'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                      : 'text-[#52525b] hover:text-[#18181b] hover:bg-white/50'
                  }`}
                  onClick={() => setCurrency('usd')}
                >
                  USD ($)
                </button>
                <button
                  className={`px-6 py-3 rounded-full transition-all text-sm ${
                    currency === 'inr'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                      : 'text-[#52525b] hover:text-[#18181b] hover:bg-white/50'
                  }`}
                  onClick={() => setCurrency('inr')}
                >
                  INR (₹)
                </button>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-full shadow-lg z-10">
                    {plan.subtitle}
                  </div>
                )}

                <div
                  className={`bg-white/60 backdrop-blur-xl border-2 rounded-3xl p-8 h-full flex flex-col shadow-xl hover:shadow-2xl transition-all ${
                    plan.popular 
                      ? 'border-purple-400/50 hover:border-purple-500/70 ring-4 ring-purple-100/50 scale-105' 
                      : 'border-purple-200/50 hover:border-purple-300/70'
                  }`}
                >
                  {/* Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                        <plan.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl text-[#18181b]">{plan.name}</h3>
                        <p className="text-sm text-[#71717a]">{plan.forWho}</p>
                      </div>
                    </div>
                    <p className="text-[#52525b] text-sm mb-6">{plan.description}</p>
                    
                    {/* Pricing */}
                    <div className="mb-4">
                      {billingCycle === 'monthly' ? (
                        <div className="flex items-baseline gap-2">
                          {currency === 'usd' ? (
                            <>
                              <span className="text-5xl text-[#18181b]">${plan.price}</span>
                              <span className="text-[#71717a]">/month</span>
                            </>
                          ) : (
                            <>
                              <span className="text-5xl text-[#18181b]">₹{plan.priceInr}</span>
                              <span className="text-[#71717a]">/month</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-2 mb-2">
                            {currency === 'usd' ? (
                              <>
                                <span className="text-5xl text-[#18181b]">${plan.yearlyPrice}</span>
                                <span className="text-[#71717a]">/year</span>
                              </>
                            ) : (
                              <>
                                <span className="text-5xl text-[#18181b]">₹{plan.yearlyPriceInr}</span>
                                <span className="text-[#71717a]">/year</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-green-600 font-medium">
                            Save {currency === 'usd' 
                              ? `$${calculateSavings(plan.price, plan.yearlyPrice)}` 
                              : `₹${calculateSavings(plan.priceInr.replace(/,/g, ''), plan.yearlyPriceInr.replace(/,/g, '')).toLocaleString()}`
                            } (2 months free!)
                          </p>
                        </div>
                      )}
                    </div>

                    {plan.seatAddOn && (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <p className="text-xs text-purple-600 font-medium">
                          + {currency === 'usd' ? plan.seatAddOn.priceRange : plan.seatAddOn.priceRangeInr} {plan.seatAddOn.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-[#52525b]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => onNavigate?.('auth')}
                    className={`w-full py-4 rounded-full font-medium transition-all shadow-md hover:shadow-xl ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:scale-105'
                        : 'bg-white/80 backdrop-blur-sm border-2 border-purple-300 text-[#18181b] hover:bg-white hover:border-purple-400'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Credit Top-Ups Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl mb-4 text-[#18181b]">
                Need more <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">credits</span>?
              </h2>
              <p className="text-lg text-[#52525b] max-w-3xl mx-auto mb-3">
                Credits power your heavy workflows like multi-doc generation, deep research, and bulk automations.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-full">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <p className="text-sm text-cyan-700 font-medium">
                  Basic chat is always free & unlimited—no credits needed!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {creditTopUps.map((topup, index) => (
                <motion.div
                  key={topup.credits}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className={`bg-white/60 backdrop-blur-xl border-2 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all ${
                    topup.popular 
                      ? 'border-cyan-400/50 ring-2 ring-cyan-100 scale-105' 
                      : 'border-purple-200/50 hover:border-purple-300'
                  }`}
                >
                  {topup.popular && (
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium rounded-full mb-3">
                      Best Value
                    </div>
                  )}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl text-[#18181b] font-bold">{topup.credits}</span>
                    <span className="text-[#71717a] ml-2">credits</span>
                  </div>
                  <p className="text-2xl text-purple-600 mb-2">
                    {currency === 'usd' ? topup.price : topup.priceInr}
                  </p>
                  <p className="text-xs text-[#71717a] mb-4">Never expires • Rolls over</p>
                  <button className="w-full py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all">
                    Purchase Credits
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mb-20"
          >
            <p className="text-[#52525b] mb-8 text-lg">
              All plans include: End-to-end encryption • 99.9% uptime SLA • GDPR compliant • No credit card required for trial
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12">
              <div>
                <div className="text-4xl mb-1 bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">10K+</div>
                <div className="text-sm text-[#71717a]">Active Users</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-purple-200" />
              <div>
                <div className="text-4xl mb-1 bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">99.9%</div>
                <div className="text-sm text-[#71717a]">Uptime SLA</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-purple-200" />
              <div>
                <div className="text-4xl mb-1 bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-[#71717a]">Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl mb-4 text-[#18181b]">Pricing FAQs</h2>
            <p className="text-xl text-[#52525b]">
              Common questions about our pricing and plans
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full text-left bg-white/60 backdrop-blur-xl border-2 border-purple-200/50 shadow-lg hover:shadow-xl hover:border-purple-300/70 transition-all rounded-2xl p-6 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg text-[#18181b] group-hover:text-purple-600 transition-colors flex-grow">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <ChevronDown
                        className={`w-6 h-6 transition-all ${
                          openFaqIndex === index
                            ? 'text-purple-600 rotate-180'
                            : 'text-[#71717a] group-hover:text-purple-600'
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="text-[#52525b] leading-relaxed mt-4">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-[#52525b] mb-4 text-lg font-medium">Still have questions about pricing?</p>
            <button 
              onClick={() => onNavigate?.('auth')}
              className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-purple-300 hover:border-purple-400 text-[#18181b] hover:bg-white rounded-full transition-all shadow-md hover:shadow-xl"
            >
              Contact our sales team
            </button>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-purple-50/30 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 relative overflow-hidden shadow-2xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            <div className="relative">
              <h2 className="text-4xl md:text-5xl text-white mb-6">
                Start your <span className="text-cyan-300">free trial</span> today
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                14 days free. Full access to Hyniqé X features. No credit card required.
              </p>
              <button 
                onClick={() => onNavigate?.('auth')}
                className="px-8 py-4 bg-white text-purple-600 rounded-full hover:scale-105 transition-transform shadow-xl font-medium"
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}