import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { FAQItem } from '../types';

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'How does Zoned improve focus?',
      answer: "Zoned uses neuro-scientifically backed interval techniques and a minimalist workspace UI to reduce the cognitive friction of starting and maintaining deep work periods. By eliminating visual tab clutter and tracking daily achievements, it establishes high-value momentum."
    },
    {
      id: 'faq-2',
      question: 'Can I sync across my devices?',
      answer: 'Yes! With a Premium membership, all active session targets, custom workspace preferences, sprint tasks, and historical focal logs are synchronized seamlessly, keeping you in sync on mobile, tablet, and desktop.'
    },
    {
      id: 'faq-3',
      question: 'Is there an API available?',
      answer: 'Absolutely. Developers can query focus minutes, sprint statistics, task completion rates, and historical logs. Real-time active soundscape hooks are available for direct developer workflow automation.'
    }
  ];

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 px-6 max-w-[800px] mx-auto select-none">
      {/* FAQ Title */}
      <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center mb-16 tracking-tighter text-zon-dark">
        Questions?
      </h2>

      {/* Accordions */}
      <div className="space-y-4">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          
          return (
            <div
              key={faq.id}
              className="border-b border-zon-dark/10 pb-4 transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex justify-between items-center text-left py-4 font-sans text-base sm:text-lg lg:text-xl font-bold text-zon-dark hover:text-zon-primary transition-colors group"
              >
                <span>{faq.question}</span>
                <span className={`w-8 h-8 rounded-full bg-zon-surface-low hover:bg-zon-lime hover:text-zon-primary text-zon-dark flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-45 bg-zon-lime text-zon-primary' : ''}`}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
              
              {/* Collapsible Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-[220px] opacity-100 mt-2 mb-4' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="p-4 bg-zon-surface-low rounded-2xl border border-zon-dark/5">
                  <p className="text-sm sm:text-base leading-relaxed text-zon-on-variant/80 font-sans font-light">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
