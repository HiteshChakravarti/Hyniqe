import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import karoHero from 'figma:asset/fb915b54c26a7ca9e50b3b3c699a69708b06edbd.png';
import karoDescription from 'figma:asset/e1c23deedb01c3b23b0ffcb389d1556f96160b0a.png';
import karoFeatures from 'figma:asset/f34269c995fd3856b69dc96b334808b578a47422.png';
import karoAvailable from 'figma:asset/e31c0e1dd4921da4d63bbb03bda06de9a3d96148.png';
import karoDelayedOrder from 'figma:asset/5a3dfd9eca69a44f6dcbaad9d98bae156c6dcb92.png';
import karoReport from 'figma:asset/101bdba8ea1bb7970bb280ed369de7474c1f94d8.png';
import karoDocumentation from 'figma:asset/71f62d46f279aa10a509974454578446b2a62a4d.png';
import karoReview from 'figma:asset/fb77f63eef045d000e289b9bc85c215131c11eec.png';
import karoFAQ from 'figma:asset/54a49480f94e9c9b60783df4e89735ff04ce79cc.png';
import karoTirelessly from 'figma:asset/b0b7afa6da8a35250fc23bda51f06eb6881860e7.png';
import karoMaster from 'figma:asset/dd62717becea396ee828a3b7132c4a70001a7429.png';
import karoEmpowered from 'figma:asset/09c243087a13540b9db2d6e7fec38a9495e41a5d.png';
import karoPowerUpsTitle from 'figma:asset/06a466e54aa7ea5c9c5984403b3cb169b965717c.png';
import karoPowerUpsExplain from 'figma:asset/8bb00f32d24f7bb9ecebd39b25da7515bb9e366a.png';
import karoPowerUpsTasks from 'figma:asset/c0d5ac34fd24429b04807fe68b0f6de165dd3a3c.png';
import karoMultiplePowerUps from 'figma:asset/a5144c7ca090278510d2e4cbf6f0a1bb710de63c.png';
import karoYourKnowledge from 'figma:asset/edac27396513cadfa7416e1f7fddf5ba750cf112.png';
import karoFinalCTA from 'figma:asset/33e4de5d6d6e22c0d33cda79fe1554b5571ec9a9.png';

export function KaroPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: 'auth') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ea580c] via-[#f97316] to-[#0a0a0f] pt-20"> {/* Changed from black to orange gradient */}
      {/* Back Button */}
      <div className="container-custom py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Employees
        </button>
      </div>

      {/* Full-Width Hero Banner */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoHero}
            alt="KARO - The AI-powered customer experience specialist who never sleeps"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Description Banner */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoDescription}
            alt="Meet Kairo - Your AI-powered customer support specialist"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Kairo Works Tirelessly */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoTirelessly}
            alt="Kairo works tirelessly behind the scenes to keep your customer support seamless and efficient"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Features Banner - Customer Conversations */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoFeatures}
            alt="Kairo manages customer conversations and support tickets"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Calm, Reliable, Master of Assistance */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoMaster}
            alt="Calm, reliable, a master of assistance - AI Support Specialist Kairo"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Available at all times */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoAvailable}
            alt="Available at all times - On your command type your request and start completing tasks in seconds"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Real-Time Support Banner */}
      <section className="w-full overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-8">
                Handle thousands of conversations simultaneously
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-6">
                Unlike human agents who can only handle one conversation at a time, 
                Karo can manage unlimited customer interactions simultaneously without 
                any drop in quality or speed.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <div className="text-5xl font-bold text-orange-400 mb-2">98%</div>
                  <div className="text-gray-400">Customer Satisfaction</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-orange-400 mb-2">{'<'}2min</div>
                  <div className="text-gray-400">Average Response Time</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-20 blur-3xl rounded-full" />
              <div className="relative glass-card p-8 space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Customer: John D.</p>
                  <p className="text-white">"Where is my order? It's been 3 days."</p>
                </div>
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-sm text-orange-400 mb-2">Karo responding...</p>
                  <p className="text-white">"I've checked your order #12345. It's currently in transit and will arrive tomorrow by 5 PM. I've sent tracking details to your email!"</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Intelligent Support Features */}
      <section className="w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-center text-white mb-20">
            Intelligent Customer Support Powered by AI
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Ticket Management',
                description: 'Automatically categorize, prioritize, and route support tickets to the right department or handle them directly.',
                icon: '🎫',
              },
              {
                title: 'FAQ Updates',
                description: 'Identify common questions and automatically update your help center with new articles and solutions.',
                icon: '📚',
              },
              {
                title: 'Sentiment Analysis',
                description: 'Detect customer emotions and escalate urgent or frustrated customers to human agents immediately.',
                icon: '❤️',
              },
              {
                title: 'Multi-Language Support',
                description: 'Communicate with customers in their preferred language, breaking down global support barriers.',
                icon: '🌍',
              },
              {
                title: 'Proactive Outreach',
                description: 'Send check-ins, gather feedback, and prevent issues before they become problems.',
                icon: '📬',
              },
              {
                title: 'Integration Magic',
                description: 'Connect with your CRM, helpdesk, and all customer tools for seamless data flow.',
                icon: '🔗',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 hover:bg-orange-500/5 transition-all group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Full-Width Banner - Delayed Order Response */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoDelayedOrder}
            alt="Kairo, respond to a customer query about a delayed order"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Onboarding Excellence */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-yellow-400 opacity-20 blur-3xl rounded-full" />
              <div className="relative">
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">Welcome to our platform! 🎉</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm flex-shrink-0">1</div>
                      <p className="text-gray-700">Set up your profile and preferences</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm flex-shrink-0">2</div>
                      <p className="text-gray-700">Connect your integrations</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm flex-shrink-0">3</div>
                      <p className="text-gray-700">Invite your team members</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm flex-shrink-0">4</div>
                      <p className="text-gray-700">Launch your first campaign!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
                Onboarding that converts trials to customers
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                Karo guides every new user through a personalized onboarding journey, 
                ensuring they understand your product and experience value from day one.
              </p>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 text-2xl">✓</span>
                  <span>Personalized welcome messages and tutorials</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 text-2xl">✓</span>
                  <span>Step-by-step guidance through setup</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 text-2xl">✓</span>
                  <span>Proactive check-ins at critical milestones</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 text-2xl">✓</span>
                  <span>Automatic escalation if users get stuck</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Full-Width Banner - Customer Support Report */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoReport}
            alt="Kairo, generate a report on last month's customer support performance"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Customer Health Monitoring */}
      <section className="w-full overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8">
            Prevent churn before it happens
          </h2>
          <p className="text-2xl text-gray-400 max-w-4xl mx-auto mb-16 leading-relaxed">
            Karo continuously monitors customer engagement, usage patterns, and satisfaction scores 
            to identify at-risk accounts and take proactive action.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="glass-card p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">87%</div>
              <div className="text-sm text-gray-400">Healthy Accounts</div>
              <div className="mt-4 h-2 bg-green-500/20 rounded-full overflow-hidden">
                <div className="h-full w-[87%] bg-green-500 rounded-full" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">10%</div>
              <div className="text-sm text-gray-400">Needs Attention</div>
              <div className="mt-4 h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                <div className="h-full w-[10%] bg-yellow-500 rounded-full" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-bold text-red-400 mb-2">3%</div>
              <div className="text-sm text-gray-400">At Risk</div>
              <div className="mt-4 h-2 bg-red-500/20 rounded-full overflow-hidden">
                <div className="h-full w-[3%] bg-red-500 rounded-full" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-bold text-orange-400 mb-2">-67%</div>
              <div className="text-sm text-gray-400">Churn Reduction</div>
              <div className="mt-4 h-2 bg-orange-500/20 rounded-full overflow-hidden">
                <div className="h-full w-[67%] bg-orange-500 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Full-Width Banner - Update Support Documentation */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoDocumentation}
            alt="Kairo, update our support documentation"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Respond to Customer Review */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoReview}
            alt="Kairo, respond to a customer review on our page"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - FAQ Based on Customer Tickets */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoFAQ}
            alt="Kairo, what should we add to our FAQ based on recent customer tickets?"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Integration Ecosystem */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-center text-white mb-12">
            Seamlessly integrates with your stack
          </h2>
          <p className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-16">
            Connect Karo to all your customer tools for a unified support experience
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'Zendesk',
              'Intercom',
              'HubSpot',
              'Salesforce',
              'Slack',
              'Discord',
              'Stripe',
              'Shopify',
              'Gmail',
              'Notion',
              'Jira',
              'Asana',
            ].map((tool, index) => (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card p-6 text-center hover:bg-orange-500/10 transition-all group"
              >
                <div className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  {tool}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Full-Width Banner - Unlock More Power with Power-Ups Title */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoPowerUpsTitle}
            alt="Unlock more power with POWER UPS"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Power-Ups Explanation */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoPowerUpsExplain}
            alt="Kairo can automate your support workflows even further with power-ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - What Can Karo Do For You */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoPowerUpsTasks}
            alt="So, what can AI social media manager KARO do for you? - Handle customer support tasks instantly"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Multiple Power-Ups */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoMultiplePowerUps}
            alt="KARO can connect with MULTIPLE unique power-ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Use Your Knowledge */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoYourKnowledge}
            alt="KARO can use your knowledge across all your tasks"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Final CTA */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoFinalCTA}
            alt="KARO - Your support genius, powered by AI"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Use Cases */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-center text-gray-900 mb-20">
            Perfect for every industry
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: 'SaaS & Tech',
                description: 'Reduce churn, improve onboarding, and scale support without adding headcount.',
                benefits: ['Technical troubleshooting', 'Feature education', 'Usage analytics'],
                color: 'orange',
              },
              {
                title: 'E-commerce',
                description: 'Turn shoppers into loyal customers with instant support and personalized recommendations.',
                benefits: ['Order tracking', 'Product recommendations', 'Return handling'],
                color: 'yellow',
              },
              {
                title: 'Service Businesses',
                description: 'Automate appointment scheduling, answer FAQs, and manage client relationships.',
                benefits: ['Appointment booking', 'Service inquiries', 'Follow-up automation'],
                color: 'orange',
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-2 border-orange-200"
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">{useCase.description}</p>
                <ul className="space-y-3">
                  {useCase.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Full-Width Banner - Empowered by your Brain AI */}
      <section className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={karoEmpowered}
            alt="Empowered by your Brain AI - Your unique knowledge. KARO's expertise. Combined into one."
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* ROI Section */}
      <section className="w-full overflow-hidden bg-gradient-to-b from-black to-orange-900/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-12">
            The numbers don't lie
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-orange-400 mb-3">98%</div>
              <div className="text-gray-400 text-lg">Customer Satisfaction</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-orange-400 mb-3">67%</div>
              <div className="text-gray-400 text-lg">Reduction in Churn</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-orange-400 mb-3">10x</div>
              <div className="text-gray-400 text-lg">Faster Response Time</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-orange-400 mb-3">24/7</div>
              <div className="text-gray-400 text-lg">Always Available</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8">
            Ready to transform customer success?
          </h2>
          <p className="text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of companies using Karo to deliver exceptional customer experiences at scale.
          </p>
          <button 
            onClick={() => onNavigate?.('auth')}
            className="px-12 py-6 bg-white text-orange-600 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl hover:shadow-white/20"
          >
            Get Started with Karo Today
          </button>
          <p className="text-white/80 mt-6">No credit card required • Setup in 5 minutes</p>
        </motion.div>
      </section>
    </div>
  );
}