import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface FAQItem {
  question: string;
  answer: string;
}

export function JetFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Do I need coding skills to use HYNIQE?',
      answer: 'Not at all! HYNIQE is designed for everyone. Simply sign up, select your AI employees, and start chatting with them in natural language. No technical knowledge required.'
    },
    {
      question: 'How do the AI employees actually work?',
      answer: 'Each AI employee is powered by advanced language models trained specifically for their role. They can understand context, learn from your preferences, and complete tasks autonomously while keeping you in the loop.'
    },
    {
      question: 'Can I integrate HYNIQE with my existing tools?',
      answer: 'Yes! HYNIQE integrates with 100+ popular tools including Slack, Gmail, Salesforce, HubSpot, and more. We also offer REST and GraphQL APIs for custom integrations.'
    },
    {
      question: 'Is my data safe and secure?',
      answer: 'Absolutely. We use bank-level encryption, are SOC 2 Type II certified, and comply with GDPR and CCPA. Your data is encrypted at rest and in transit, and we never train our models on your private data.'
    },
    {
      question: 'How fast will I see results?',
      answer: 'Most customers see immediate value. Tasks that used to take hours can be completed in minutes. Our analytics show the average customer saves 142 hours per month within the first 30 days.'
    },
    {
      question: 'What happens if an AI employee makes a mistake?',
      answer: 'AI employees always keep you in the loop on important decisions. You can review and approve tasks before they\'re finalized. Plus, our built-in quality checks ensure high accuracy across all tasks.'
    },
    {
      question: 'Can I customize the AI employees?',
      answer: 'Yes! You can train AI employees on your company\'s specific processes, provide them with custom instructions, and adjust their behavior to match your workflow and brand voice.'
    },
    {
      question: 'What\'s included in the free trial?',
      answer: 'The 14-day free trial includes full access to all features in your selected plan. No credit card required to start. You can cancel anytime during the trial with no charges.'
    }
  ];

  return (
    <section id="faq" className="py-32 bg-[#0B0E13] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] relative z-10">
        <SectionHeader
          overline="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about HYNIQE and our AI employees."
          centered
          className="mb-20"
        />

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#050509] border border-[#222633] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#F7FF5C]/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="heading-h3 text-white pr-8">{faq.question}</span>
                <ChevronDown 
                  className={`w-6 h-6 text-[#A6A7B0] flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`
                  overflow-hidden transition-all duration-200
                  ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="px-6 pb-6">
                  <p className="body-m text-[#A6A7B0] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="body-l text-[#A6A7B0] mb-6">
            Still have questions?
          </p>
          <button className="bg-gradient-to-r from-[#F7FF5C] to-[#4AF2FF] hover:from-[#FFFF8F] hover:to-[#6FF5FF] text-[#050509] px-6 py-3 rounded-lg font-medium transition-all shadow-lg">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
