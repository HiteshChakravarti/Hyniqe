import { Calendar, Users, BookOpen, Code, Video, MessageCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const blogPosts = [
  {
    title: '10 Ways AI Employees Are Transforming Customer Service',
    category: 'Customer Service',
    date: 'Dec 1, 2024',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1709715357510-b687304cee3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    title: 'The Future of Work: AI and Human Collaboration',
    category: 'Industry Insights',
    date: 'Nov 28, 2024',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    title: 'How to Scale Your Business with AI Automation',
    category: 'Business Growth',
    date: 'Nov 25, 2024',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
];

const caseStudies = [
  {
    company: 'TechCorp Inc.',
    industry: 'SaaS',
    result: '300% increase in customer satisfaction',
    description: 'How TechCorp automated their support and scaled to 10,000+ customers.',
    image: 'https://images.unsplash.com/photo-1496180470114-6ef490f3ff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    company: 'ShopFast',
    industry: 'E-commerce',
    result: '$2M+ additional revenue',
    description: 'Recovering abandoned carts and optimizing sales with AI.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    company: 'DataAnalytics Pro',
    industry: 'Analytics',
    result: '80% reduction in reporting time',
    description: 'Automating data analysis and report generation.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
];

interface ResourcePageProps {
  pageId: string;
}

export function ResourcePage({ pageId }: ResourcePageProps) {
  if (pageId === 'blog') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <span className="text-2xl">📰</span>
                <span className="text-gray-400">Blog & Articles</span>
              </div>
              <h1 className="text-white mb-6">Latest from Sintra</h1>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Insights, updates, and best practices for leveraging AI in your business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group cursor-pointer">
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className="text-blue-400">{post.category}</span>
                      <span className="text-gray-500">{post.date}</span>
                      <span className="text-gray-500">{post.readTime}</span>
                    </div>
                    <h3 className="text-white mb-3">{post.title}</h3>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">Read More →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (pageId === 'case-studies') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <span className="text-2xl">📊</span>
                <span className="text-gray-400">Case Studies</span>
              </div>
              <h1 className="text-white mb-6">Success Stories</h1>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                See how businesses are achieving remarkable results with Sintra AI
              </p>
            </div>

            <div className="space-y-8">
              {caseStudies.map((study, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto">
                      <ImageWithFallback
                        src={study.image}
                        alt={study.company}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <span className="text-blue-400 mb-2">{study.industry}</span>
                      <h2 className="text-white mb-4">{study.company}</h2>
                      <p className="text-gray-400 mb-6">{study.description}</p>
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-4">
                        {study.result}
                      </div>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors self-start">
                        Read Full Case Study →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (pageId === 'help-center') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <span className="text-2xl">❓</span>
                <span className="text-gray-400">Help Center</span>
              </div>
              <h1 className="text-white mb-6">How can we help you?</h1>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: '🚀', title: 'Getting Started', desc: 'Learn the basics of Sintra AI' },
                { icon: '💡', title: 'Best Practices', desc: 'Tips for optimal use' },
                { icon: '🔧', title: 'Troubleshooting', desc: 'Fix common issues' },
                { icon: '📖', title: 'User Guide', desc: 'Comprehensive documentation' },
                { icon: '💳', title: 'Billing & Plans', desc: 'Manage your subscription' },
                { icon: '🔐', title: 'Security & Privacy', desc: 'Data protection info' },
              ].map((item, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (pageId === 'documentation') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <Code className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">API Documentation</span>
              </div>
              <h1 className="text-white mb-6">Developer Documentation</h1>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Everything you need to integrate Sintra AI into your applications
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Code className="w-6 h-6" />, title: 'API Reference', desc: 'Complete API documentation' },
                { icon: <BookOpen className="w-6 h-6" />, title: 'SDKs & Libraries', desc: 'Python, JavaScript, Ruby' },
                { icon: <Video className="w-6 h-6" />, title: 'Video Tutorials', desc: 'Step-by-step guides' },
              ].map((item, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-blue-500/50 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4 text-white">
                    {item.icon}
                  </div>
                  <h3 className="text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 mb-4">{item.desc}</p>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    View Docs →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (pageId === 'tutorials') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <span className="text-2xl">🎓</span>
                <span className="text-gray-400">Tutorials & Guides</span>
              </div>
              <h1 className="text-white mb-6">Learn Sintra AI</h1>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Step-by-step guides to master AI automation
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Setting up your first AI employee',
                'Automating customer support workflows',
                'Building custom AI integrations',
                'Advanced prompt engineering',
                'Scaling AI across your organization',
                'Measuring ROI from AI automation',
              ].map((tutorial, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{tutorial}</h3>
                    <p className="text-gray-400 text-sm">15-20 min • Beginner</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (pageId === 'community') {
    return (
      <div className="pt-16">
        <section className="py-20 px-6 lg:px-8 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3 mb-6">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Community</span>
              </div>
              <h1 className="text-white mb-6">Join the Sintra Community</h1>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Connect with thousands of AI automation enthusiasts
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <MessageCircle className="w-6 h-6" />, title: 'Discord Server', members: '10K+ members', desc: 'Real-time chat and support' },
                { icon: <Users className="w-6 h-6" />, title: 'Forum', members: '5K+ discussions', desc: 'Share knowledge and ideas' },
                { icon: <Calendar className="w-6 h-6" />, title: 'Events', members: 'Weekly webinars', desc: 'Learn from experts' },
              ].map((item, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-blue-500/50 transition-all text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4 text-white mx-auto">
                    {item.icon}
                  </div>
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-blue-400 mb-3">{item.members}</p>
                  <p className="text-gray-400 mb-4">{item.desc}</p>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all">
                    Join Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
