import { motion } from "framer-motion";
import { ClipboardCheck, MessageSquare, ActivitySquare, BookOpen } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Take the Assessment",
    description: "Complete our comprehensive assessment to help us understand your menopause stage and symptoms.",
    icon: ClipboardCheck
  },
  {
    number: 2,
    title: "Get Personalized Insights",
    description: "Receive a detailed analysis of your menopause stage with personalized recommendations.",
    icon: BookOpen
  },
  {
    number: 3,
    title: "Track Your Symptoms",
    description: "Use our symptom tracker to monitor changes and identify patterns that affect your wellbeing.",
    icon: ActivitySquare
  },
  {
    number: 4,
    title: "Access Ongoing Support",
    description: "Get continuous support through our AI assistant, community, and evidence-based wellness plans.",
    icon: MessageSquare
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-subheading">How It Works</h2>
          <p className="section-heading">
            Your journey to better menopause management
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Menova.ai provides a comprehensive approach to understanding and managing your menopause symptoms.
          </p>
        </div>

        <div className="mt-20">
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden absolute top-24 w-full border-t-2 border-[#fbcfdf] lg:block" aria-hidden="true"></div>
            
            {/* Steps */}
            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <motion.div 
                  key={index} 
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="icon-circle">
                    <step.icon className="h-7 w-7" />
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-white text-primary border-2 border-primary font-bold text-lg shadow-sm">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center mt-6">{step.title}</h3>
                  <p className="text-base text-gray-600 text-center">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
