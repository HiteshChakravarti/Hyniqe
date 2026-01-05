import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Do I need coding skills to use HYNIQE?',
    answer: 'Not at all! HYNIQE is designed for everyone. Simply sign up, choose your AI employees, and start chatting with them like you would with any team member. No technical knowledge required.',
  },
  {
    question: 'How is this different from ChatGPT or other AI tools?',
    answer: 'While ChatGPT is a general-purpose AI, HYNIQE provides specialized AI employees trained for specific roles like recruiting, sales, and analytics. Each AI helper has context about your business and can take actions across your tools and workflows.',
  },
  {
    question: 'What integrations do you support?',
    answer: 'We integrate with 100+ platforms including Slack, Gmail, Google Calendar, HubSpot, Salesforce, LinkedIn, and many more. Our AI employees can work across your entire tech stack seamlessly.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level encryption (AES-256), are SOC 2 Type II certified, and never train our models on your data. Your information stays private and secure. We also offer on-premise deployment for enterprise customers.',
  },
  {
    question: 'Can I customize the AI employees?',
    answer: 'Yes! You can train each AI employee on your specific processes, brand voice, and business context. They learn from your feedback and adapt to your workflows over time.',
  },
  {
    question: 'What happens after the free trial?',
    answer: 'Your 14-day free trial includes full access to all features. After the trial, you can choose a plan that fits your needs. If you decide not to continue, your data is safely exported and deleted upon request.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <p className="text-[#52525b] text-lg">
            Everything you need to know about HYNIQE. Can't find what you're looking for? Chat with our team.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left glass-card p-6 hover:bg-[#f9fafb] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg text-[#18181b] group-hover:text-[#a78bfa] transition-colors flex-grow font-medium">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronDown className="w-6 h-6 text-[#a78bfa] transform rotate-180 transition-transform" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-[#52525b] group-hover:text-[#a78bfa] transition-colors" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-[#52525b] mt-4 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[#52525b] mb-4 text-lg font-medium">Still have questions?</p>
          <button className="px-6 py-3 border-2 border-[#a78bfa]/30 hover:border-[#a78bfa] text-[#18181b] bg-white/50 hover:bg-white rounded-full transition-all shadow-sm hover:shadow-md">
            Contact our team
          </button>
        </motion.div>
      </div>
    </section>
  );
}