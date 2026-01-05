import { useState } from 'react';
import { ArrowRight, Check, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const helperData: Record<string, any> = {
  daphne: {
    name: 'Daphne',
    role: 'Social Media Manager',
    icon: '🎨',
    gradient: 'from-pink-500 to-rose-500',
    tagline: 'Your 24/7 Social Media Expert',
    description: 'Daphne creates engaging content, schedules posts, and manages your social media presence across all platforms.',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Content creation and scheduling',
      'Multi-platform management',
      'Engagement analytics',
      'Trend monitoring',
      'Hashtag optimization',
      'Community management',
    ],
    useCases: [
      'Instagram Stories & Reels',
      'Twitter/X thread creation',
      'LinkedIn professional posts',
      'TikTok content strategy',
    ],
    stats: [
      { label: 'Posts Created', value: '1M+' },
      { label: 'Engagement Rate', value: '45%↑' },
      { label: 'Time Saved', value: '20hrs/week' },
    ],
  },
  dexter: {
    name: 'Dexter',
    role: 'Customer Support',
    icon: '💬',
    gradient: 'from-blue-500 to-cyan-500',
    tagline: 'Instant Support, Happy Customers',
    description: 'Dexter handles customer inquiries with empathy and efficiency, providing instant support 24/7 to keep your customers satisfied.',
    image: 'https://images.unsplash.com/photo-1709715357510-b687304cee3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      '24/7 instant responses',
      'Multi-language support',
      'Ticket management',
      'Knowledge base integration',
      'Sentiment analysis',
      'Escalation handling',
    ],
    useCases: [
      'Order tracking & status',
      'Product troubleshooting',
      'Returns & refunds',
      'General inquiries',
    ],
    stats: [
      { label: 'Tickets Resolved', value: '500K+' },
      { label: 'Response Time', value: '<30sec' },
      { label: 'Customer Satisfaction', value: '98%' },
    ],
  },
  orion: {
    name: 'Orion',
    role: 'Data Analyst',
    icon: '📊',
    gradient: 'from-purple-500 to-indigo-500',
    tagline: 'Turn Data Into Decisions',
    description: 'Orion analyzes your business data, identifies trends, and generates actionable insights to drive growth.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Automated reporting',
      'Trend analysis',
      'Predictive analytics',
      'Data visualization',
      'KPI tracking',
      'Custom dashboards',
    ],
    useCases: [
      'Sales performance analysis',
      'Customer behavior insights',
      'Revenue forecasting',
      'Marketing ROI tracking',
    ],
    stats: [
      { label: 'Data Points Analyzed', value: '10B+' },
      { label: 'Reports Generated', value: '250K+' },
      { label: 'Accuracy Rate', value: '99.2%' },
    ],
  },
  buddy: {
    name: 'Buddy',
    role: 'Business Strategist',
    icon: '💼',
    gradient: 'from-orange-500 to-red-500',
    tagline: 'Strategic Insights for Growth',
    description: 'Buddy provides strategic business advice, market analysis, and growth recommendations tailored to your industry.',
    image: 'https://images.unsplash.com/photo-1496180470114-6ef490f3ff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Market research',
      'Competitive analysis',
      'Growth strategy planning',
      'Risk assessment',
      'Business model optimization',
      'Industry insights',
    ],
    useCases: [
      'Market entry strategies',
      'Product launch planning',
      'Competitive positioning',
      'Growth opportunities',
    ],
    stats: [
      { label: 'Strategies Created', value: '50K+' },
      { label: 'Success Rate', value: '87%' },
      { label: 'ROI Improvement', value: '3.5x' },
    ],
  },
  emelia: {
    name: 'Emelia',
    role: 'Email Marketer',
    icon: '📧',
    gradient: 'from-green-500 to-emerald-500',
    tagline: 'Email Campaigns That Convert',
    description: 'Emelia creates, schedules, and optimizes email campaigns that drive engagement and conversions.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Campaign creation',
      'A/B testing',
      'List segmentation',
      'Automation workflows',
      'Performance analytics',
      'Personalization',
    ],
    useCases: [
      'Newsletter campaigns',
      'Welcome sequences',
      'Abandoned cart recovery',
      'Re-engagement campaigns',
    ],
    stats: [
      { label: 'Emails Sent', value: '50M+' },
      { label: 'Open Rate', value: '42%' },
      { label: 'Conversion Rate', value: '8.5%' },
    ],
  },
  gigi: {
    name: 'Gigi',
    role: 'Personal Growth Coach',
    icon: '🌱',
    gradient: 'from-teal-500 to-cyan-500',
    tagline: 'Your Personal Development Partner',
    description: 'Gigi provides personalized coaching, goal tracking, and motivation to help you achieve your personal and professional goals.',
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Goal setting & tracking',
      'Habit formation',
      'Motivation & accountability',
      'Progress analytics',
      'Personalized recommendations',
      'Daily check-ins',
    ],
    useCases: [
      'Career development',
      'Skill building',
      'Wellness tracking',
      'Time management',
    ],
    stats: [
      { label: 'Goals Achieved', value: '100K+' },
      { label: 'Active Users', value: '25K+' },
      { label: 'Success Rate', value: '78%' },
    ],
  },
  scotty: {
    name: 'Scotty',
    role: 'Recruiter',
    icon: '👥',
    gradient: 'from-indigo-500 to-blue-500',
    tagline: 'Find Your Perfect Team Members',
    description: 'Scotty streamlines recruitment by sourcing candidates, screening resumes, and scheduling interviews.',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Candidate sourcing',
      'Resume screening',
      'Interview scheduling',
      'Applicant tracking',
      'Skill assessment',
      'Onboarding automation',
    ],
    useCases: [
      'Job posting creation',
      'Candidate outreach',
      'Interview coordination',
      'Offer management',
    ],
    stats: [
      { label: 'Candidates Screened', value: '500K+' },
      { label: 'Positions Filled', value: '15K+' },
      { label: 'Time to Hire', value: '-60%' },
    ],
  },
  ash: {
    name: 'Ash',
    role: 'Copywriter',
    icon: '✍️',
    gradient: 'from-yellow-500 to-orange-500',
    tagline: 'Words That Sell',
    description: 'Ash crafts compelling copy for ads, websites, emails, and more that resonates with your audience and drives action.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Ad copywriting',
      'Website content',
      'Product descriptions',
      'Email copy',
      'Blog posts',
      'SEO optimization',
    ],
    useCases: [
      'Landing page copy',
      'Ad campaigns',
      'Product launches',
      'Brand messaging',
    ],
    stats: [
      { label: 'Words Written', value: '10M+' },
      { label: 'Conversion Lift', value: '35%' },
      { label: 'Projects Completed', value: '75K+' },
    ],
  },
  carmen: {
    name: 'Carmen',
    role: 'eCom Specialist',
    icon: '🛒',
    gradient: 'from-pink-500 to-purple-500',
    tagline: 'Optimize Your Online Store',
    description: 'Carmen manages your e-commerce operations, from inventory to customer experience, maximizing sales and efficiency.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Inventory management',
      'Product optimization',
      'Order processing',
      'Customer reviews',
      'Pricing strategy',
      'Sales analytics',
    ],
    useCases: [
      'Product listing optimization',
      'Inventory forecasting',
      'Abandoned cart recovery',
      'Upsell strategies',
    ],
    stats: [
      { label: 'Orders Processed', value: '2M+' },
      { label: 'Revenue Increase', value: '42%' },
      { label: 'Cart Recovery', value: '28%' },
    ],
  },
  mike: {
    name: 'Mike',
    role: 'Sales Strategist',
    icon: '📈',
    gradient: 'from-green-500 to-teal-500',
    tagline: 'Close More Deals, Faster',
    description: 'Mike helps qualify leads, manage pipelines, and close deals with proven sales strategies and insights.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Lead qualification',
      'Pipeline management',
      'Sales forecasting',
      'Meeting scheduling',
      'Follow-up automation',
      'Deal tracking',
    ],
    useCases: [
      'Lead scoring',
      'Sales outreach',
      'Deal closing',
      'Revenue optimization',
    ],
    stats: [
      { label: 'Deals Closed', value: '100K+' },
      { label: 'Win Rate', value: '67%' },
      { label: 'Sales Cycle', value: '-40%' },
    ],
  },
  simon: {
    name: 'Simon',
    role: 'SEO Mastermind',
    icon: '🔍',
    gradient: 'from-blue-500 to-purple-500',
    tagline: 'Rank Higher, Get Found',
    description: 'Simon optimizes your content and website for search engines, driving organic traffic and improving rankings.',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Keyword research',
      'On-page optimization',
      'Content strategy',
      'Technical SEO',
      'Link building',
      'Rank tracking',
    ],
    useCases: [
      'Content optimization',
      'Keyword targeting',
      'Backlink analysis',
      'Competitor research',
    ],
    stats: [
      { label: 'Keywords Ranked', value: '500K+' },
      { label: 'Traffic Increase', value: '156%' },
      { label: 'Page 1 Rankings', value: '85%' },
    ],
  },
  vicky: {
    name: 'Vicky',
    role: 'Virtual Assistant',
    icon: '🤖',
    gradient: 'from-cyan-500 to-blue-500',
    tagline: 'Your All-Purpose Assistant',
    description: 'Vicky handles administrative tasks, schedules, emails, and more, freeing up your time for what matters most.',
    image: 'https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'Calendar management',
      'Email organization',
      'Task scheduling',
      'Document preparation',
      'Meeting coordination',
      'Travel booking',
    ],
    useCases: [
      'Appointment scheduling',
      'Email management',
      'Document creation',
      'Research tasks',
    ],
    stats: [
      { label: 'Tasks Completed', value: '5M+' },
      { label: 'Time Saved', value: '30hrs/week' },
      { label: 'Accuracy', value: '99.5%' },
    ],
  },
  'full-team': {
    name: 'Sintra X',
    role: 'Full Team',
    icon: '🚀',
    gradient: 'from-purple-500 to-pink-500',
    tagline: 'Your Complete AI Workforce',
    description: 'Get access to all AI employees working together seamlessly to handle every aspect of your business.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    features: [
      'All AI employees included',
      'Unlimited tasks',
      'Cross-functional collaboration',
      'Priority support',
      'Custom workflows',
      'Advanced analytics',
    ],
    useCases: [
      'Complete business automation',
      'Enterprise-wide deployment',
      'Multi-department coordination',
      'Scalable operations',
    ],
    stats: [
      { label: 'Team Members', value: '12 AI Employees' },
      { label: 'Productivity Boost', value: '10x' },
      { label: 'ROI', value: '500%+' },
    ],
  },
};

interface HelperPageProps {
  helperId: string;
}

export function HelperPage({ helperId }: HelperPageProps) {
  const helper = helperData[helperId] || helperData.dexter;
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 lg:px-8 bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br ${helper.gradient} rounded-full blur-3xl opacity-10 animate-pulse`}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 mb-6">
                <span className="text-3xl">{helper.icon}</span>
                <span className="text-gray-400">{helper.role}</span>
              </div>

              <h1 className="text-white mb-6">
                Meet {helper.name}:
                <span className={`block bg-gradient-to-r ${helper.gradient} bg-clip-text text-transparent`}>
                  {helper.tagline}
                </span>
              </h1>

              <p className="text-gray-400 text-xl mb-8 leading-relaxed">
                {helper.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button className={`bg-gradient-to-r ${helper.gradient} px-8 py-3.5 rounded-lg text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 group`}>
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setShowDemo(true)}
                  className="border border-gray-700 hover:border-gray-600 px-8 py-3.5 rounded-lg text-white transition-colors"
                >
                  Try Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {helper.stats.map((stat: any, index: number) => (
                  <div key={index}>
                    <div className={`bg-gradient-to-r ${helper.gradient} bg-clip-text text-transparent mb-1`}>
                      {stat.value}
                    </div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-gray-800">
                <ImageWithFallback
                  src={helper.image}
                  alt={helper.name}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gray-900 border border-gray-800 rounded-full px-4 py-2 mb-4">
              <Sparkles className={`w-4 h-4 bg-gradient-to-r ${helper.gradient} text-transparent mr-2`} />
              <span className="text-gray-400">Capabilities</span>
            </div>
            <h2 className="text-white mb-4">
              What {helper.name} Can Do
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Powerful features designed to handle your {helper.role.toLowerCase()} needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helper.features.map((feature: string, index: number) => (
              <div
                key={index}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${helper.gradient} flex items-center justify-center mb-4`}>
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="text-white">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white mb-4">
              Common Use Cases
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              See how {helper.name} can help with your daily tasks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helper.useCases.map((useCase: string, index: number) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${helper.gradient} p-6 rounded-xl`}
              >
                <Zap className="w-8 h-8 text-white mb-3" />
                <p className="text-white">{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-12">
            <div className="text-5xl mb-6">{helper.icon}</div>
            <h2 className="text-white mb-6">
              Ready to Get Started with {helper.name}?
            </h2>
            <p className="text-gray-400 text-xl mb-8">
              Join thousands of businesses already using {helper.name} to streamline their operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className={`bg-gradient-to-r ${helper.gradient} px-8 py-3.5 rounded-lg text-white hover:opacity-90 transition-all flex items-center justify-center gap-2`}>
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border border-gray-700 hover:border-gray-600 px-8 py-3.5 rounded-lg text-white transition-colors">
                Talk to Sales
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
