import { motion } from "framer-motion";
import { 
  ClipboardCheck, MessageSquare, ActivitySquare, Users, HeartPulse, Sparkles
} from "lucide-react";

const features = [
  {
    title: "Personalized Assessment",
    description: "Take our comprehensive assessment to receive personalized insights and recommendations tailored to your menopause stage.",
    icon: ClipboardCheck,
  },
  {
    title: "AI Health Assistant",
    description: "Chat with our AI assistant for immediate answers to your menopause questions and concerns, available 24/7.",
    icon: MessageSquare,
  },
  {
    title: "Symptom Tracker",
    description: "Monitor and track your symptoms over time to identify patterns and see the effectiveness of different interventions.",
    icon: ActivitySquare,
  },
  {
    title: "Community Support",
    description: "Connect with women sharing similar experiences in our supportive community for advice, encouragement, and understanding.",
    icon: Users,
  },
  {
    title: "Wellness Plans",
    description: "Access customized wellness plans addressing sleep, nutrition, exercise, and mental health designed for your specific needs.",
    icon: HeartPulse,
  },
  {
    title: "Expert Insights",
    description: "Get evidence-based information and the latest research on menopause management from medical professionals.",
    icon: Sparkles,
  }
];

export default function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-16 bg-gradient-to-b from-white to-[#fce7ef] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="section-subheading">Features</h2>
          <p className="section-heading">
            Your complete menopause companion
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
            Menova.ai combines AI technology with medical expertise to provide comprehensive support through your menopause journey.
          </p>
        </div>

        <motion.div 
          className="mt-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div key={index} className="pt-6" variants={itemVariants}>
                <div className="feature-card">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 gradient-primary-bg rounded-md shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold text-gray-900 tracking-tight">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
