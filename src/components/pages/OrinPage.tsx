import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import orinHero from 'figma:asset/fad51b6476e289b071cf67f5f467963b54495811.png';
import orinDescription from 'figma:asset/914ef2beff1ff4818f05493e7d00c3ce275fdeaa.png';
import orinFeatures from 'figma:asset/08a2906a7f9477c055c771996e206d64a9ff24cf.png';
import orinAvailable from 'figma:asset/d427eec005c0ab4402dbf28ac533a58d7d614e31.png';
import orinROI from 'figma:asset/4e6c97281fd1770e2a4bc04026908b244723a982.png';
import orinForecast from 'figma:asset/ddaf35eb841d076d78fcdeaaa8d1869858e9b595.png';
import orinProfitLoss from 'figma:asset/df4a6d778f3404ddd91931b924cf2485fc61db59.png';
import orinBalanceSheet from 'figma:asset/4741a0f89193ccc3d72afe0db98b99a7ff07c68d.png';
import orinAnalyzeTrends from 'figma:asset/bee8809997f66a59b644662ea4ec05325e7eb888.png';
import orinPlainLanguage from 'figma:asset/edaa912c7d5f70bd792221b0482ea98b8826b9df.png';
import orinAnalytical from 'figma:asset/7659f3250d06220bf06e5fb6a8f86afb033b8d0b.png';
import orinBrainAI from 'figma:asset/07782f289b850b3f9488482f06675e51e41f025f.png';
import orinPowerUpsTitle from 'figma:asset/d66f2bd1a59e1c361e538008488e8ce021b4e9d4.png';
import orinPowerUpsDescription from 'figma:asset/1e107e1cb450b2200d92e25754fdedb795c22dd8.png';
import orinWhatCanDo from 'figma:asset/9ea0f6e7defb25c8407b0435f110de03444dcc35.png';
import orinMultiplePowerUps from 'figma:asset/70836fd54de6f90a1746a9d52bcd5dc66bc89ca5.png';
import orinUseKnowledge from 'figma:asset/93707097777e2de4253e62be9651d97e3859723b.png';
import orinFinalCTA from 'figma:asset/d548e5a2562177a12ddd93e43fdff565d1d82825.png';

export function OrinPage({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (page: 'auth') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Back Button */}
      <div className="container-custom py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to AI Employees
        </button>
      </div>

      {/* Full-Width Hero Banner */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-400 via-teal-400 to-green-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinHero}
            alt="ORIN - AI Data Analyst"
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
            src={orinDescription}
            alt="Meet Orin - Your personal AI data analyst"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Features Banner */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-400 via-teal-400 to-green-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinFeatures}
            alt="Orin specializes in transforming raw data into clarity and direction"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Available at all times */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinAvailable}
            alt="Available at all times - On your command type your request and start completing tasks in seconds"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Calculate ROI */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinROI}
            alt="Orin, calculate the ROI for our latest marketing campaign"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Sales Forecast */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinForecast}
            alt="Orin, provide a sales forecast for the upcoming quarter"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Profit and Loss Statement */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-400 via-teal-400 to-green-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinProfitLoss}
            alt="Orin, generate a profit and loss statement for this quarter"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Balance Sheet */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-400 via-teal-400 to-green-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinBalanceSheet}
            alt="Orin, can you create a balance sheet for our last quarter?"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Analyze Trends */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinAnalyzeTrends}
            alt="Orin, analyze trends in our sales data from the past year"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Plain Language Insights */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinPlainLanguage}
            alt="With Orin, users can ask questions in plain language and instantly uncover deep insights from their business data"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Analytical, Insightful, Always Accurate */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinAnalytical}
            alt="Analytical. Insightful. Always Accurate. AI Data Analyst Orin"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Empowered by your Brain AI */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinBrainAI}
            alt="Empowered by your Brain AI - Your unique knowledge. ORIN's expertise. Combined into one"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Unlock more power with POWER UPS */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinPowerUpsTitle}
            alt="Unlock more power with POWER UPS"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Power-Ups Description */}
      <section className="w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinPowerUpsDescription}
            alt="Orin can take your analysis even further with Power-Ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - What Can Orin Do For You */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinWhatCanDo}
            alt="So, what can AI Data Analyst manager ORIN do for you?"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Multiple Power-Ups */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinMultiplePowerUps}
            alt="ORIN can connect with MULTIPLE unique power-ups"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Use Your Knowledge */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinUseKnowledge}
            alt="ORIN use your knowledge across all your tasks"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Full-Width Banner - Final CTA */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-300 via-teal-300 to-green-400">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={orinFinalCTA}
            alt="ORIN - Your social media manager, on AI - BUY NOW"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* Integration Ecosystem */}
      <section className="w-full overflow-hidden bg-gradient-to-b from-black to-green-900/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6">
            Works with your tools
          </h2>
          <p className="text-xl text-gray-400 mb-16 max-w-3xl mx-auto">
            Orin seamlessly integrates with your existing analytics stack, databases, and business intelligence platforms.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'Google Analytics',
              'Tableau',
              'Power BI',
              'Excel',
              'SQL',
              'MongoDB',
              'Salesforce',
              'HubSpot',
              'Looker',
              'Snowflake',
              'BigQuery',
              'PostgreSQL',
            ].map((tool, index) => (
              <motion.div
                key={tool}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card p-6 text-center hover:bg-green-500/10 transition-all group"
              >
                <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
                  {tool}
                </div>
              </motion.div>
            ))}
          </div>
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
                title: 'E-commerce',
                description: 'Understand customer behavior, optimize pricing, and forecast demand with precision.',
                benefits: ['Sales forecasting', 'Customer segmentation', 'Inventory optimization'],
                color: 'green',
              },
              {
                title: 'SaaS & Tech',
                description: 'Track user engagement, analyze churn patterns, and identify growth opportunities.',
                benefits: ['User analytics', 'Churn prediction', 'Feature adoption tracking'],
                color: 'teal',
              },
              {
                title: 'Finance',
                description: 'Generate financial reports, analyze trends, and predict market movements.',
                benefits: ['Financial reporting', 'Risk analysis', 'Revenue forecasting'],
                color: 'green',
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 border-2 border-green-200"
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-gray-700 text-lg mb-6">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-gray-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ROI Section */}
      <section className="w-full overflow-hidden bg-gradient-to-b from-black to-green-900/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-12">
            Data-driven results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-green-400 mb-3">99%</div>
              <div className="text-gray-400 text-lg">Data Accuracy</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-green-400 mb-3">10x</div>
              <div className="text-gray-400 text-lg">Faster Analysis</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-green-400 mb-3">24/7</div>
              <div className="text-gray-400 text-lg">Real-time Insights</div>
            </div>
            <div className="glass-card p-8">
              <div className="text-6xl font-bold text-green-400 mb-3">85%</div>
              <div className="text-gray-400 text-lg">Time Saved</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="w-full overflow-hidden bg-gradient-to-br from-green-400 via-teal-400 to-green-500">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container-custom py-32 text-center"
        >
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6">
            Transform data into decisions
          </h2>
          <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Let Orin unlock the intelligence hidden in your data and drive better business outcomes.
          </p>
          <button 
            onClick={() => onNavigate?.('auth')}
            className="px-12 py-6 bg-white text-green-600 rounded-full text-xl font-semibold hover:scale-105 transition-all hover:shadow-2xl"
          >
            Get Started with Orin
          </button>
        </motion.div>
      </section>
    </div>
  );
}