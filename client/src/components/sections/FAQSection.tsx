import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What makes Menova.ai different from other menopause apps?",
    answer: "Menova.ai combines AI technology with evidence-based medical insights to provide personalized support. Unlike most apps that only track symptoms, we offer personalized assessments, AI-powered chat assistance, comprehensive symptom tracking, community support, and personalized wellness plans all in one integrated platform."
  },
  {
    question: "Is the Menova.ai AI assistant medically trained?",
    answer: "Yes, our AI assistant is trained on peer-reviewed medical literature about menopause and women's health. It provides evidence-based information, but it's important to note that it doesn't replace professional medical advice. We always recommend consulting with your healthcare provider for medical decisions."
  },
  {
    question: "How accurate is the menopause stage assessment?",
    answer: "Our assessment is based on clinically validated questionnaires and algorithms. It analyzes your symptoms, medical history, and other relevant factors to determine your likely menopause stage. While our assessment is highly accurate, we recommend confirming your stage with a healthcare provider, especially if you're experiencing severe symptoms."
  },
  {
    question: "How is my health data protected?",
    answer: "We take data protection extremely seriously. All your health information is encrypted, stored securely, and never shared with third parties without your explicit consent. We comply with all relevant healthcare data protection regulations, and you have complete control over your data at all times."
  },
  {
    question: "Can I connect with healthcare providers through Menova.ai?",
    answer: "Currently, Menova.ai focuses on providing information, tracking, and community support. We're working on features to help you share your symptom data with your healthcare provider and to connect with menopause specialists through our platform in the future."
  },
  {
    question: "Is there a cost to use Menova.ai?",
    answer: "We offer a free basic version with essential features like symptom tracking and limited AI assistant interactions. Our premium subscription provides full access to all features including unlimited AI assistant usage, detailed analytics, personalized wellness plans, and premium community features."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 bg-gradient-to-b from-[#fce7ef] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-subheading">FAQ</h2>
          <p className="section-heading">
            Common questions about Menova.ai
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Find answers to frequently asked questions about our menopause companion app.
          </p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border-b border-gray-200 ${index === faqs.length - 1 ? '' : 'pb-6 mb-6'}`}
            >
              <button 
                className="flex w-full justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <h3 className="text-lg font-bold text-gray-900">{faq.question}</h3>
                <div className={`transition-colors duration-200 ${openIndex === index ? 'text-primary' : 'text-gray-400'}`}>
                  {openIndex === index ? (
                    <ChevronUp className="h-6 w-6 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-6 w-6 flex-shrink-0" />
                  )}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <p className="text-base text-gray-600 bg-white p-4 rounded-lg shadow-sm border border-[#fbcfdf]/30">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
