import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";

const testimonials = [
  {
    quote: "This product has completely transformed how our team collaborates. The intuitive interface and powerful features have made a significant impact on our productivity.",
    author: {
      name: "Sarah Thompson",
      role: "Product Manager, TechCorp",
      avatar: "bg-indigo-300"
    }
  },
  {
    quote: "I've tried numerous solutions in the past, but this platform stands out for its ease of use and comprehensive feature set. It's become an essential part of our workflow.",
    author: {
      name: "Michael Rodriguez",
      role: "CTO, InnovateCo",
      avatar: "bg-blue-300"
    }
  },
  {
    quote: "The analytics capabilities alone are worth the investment. We're now able to make data-driven decisions that have significantly improved our outcomes.",
    author: {
      name: "Emma Chen",
      role: "Data Analyst, AnalyticsPro",
      avatar: "bg-green-300"
    }
  },
  {
    quote: "As someone who manages multiple teams, the collaboration features have been a game-changer. I can't imagine going back to our previous tools.",
    author: {
      name: "David Johnson",
      role: "Team Lead, EnterpriseX",
      avatar: "bg-purple-300"
    }
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gradient-to-br from-primary-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What our beta users are saying
          </p>
        </div>

        <motion.div 
          className="mt-12 space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index} 
              className="bg-white rounded-lg shadow-sm p-6 relative"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
              }}
            >
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MessageSquareQuote className="h-4 w-4 text-white" />
              </div>
              <div className="mt-2">
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                <div className="mt-4 flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full ${testimonial.author.avatar}`}></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{testimonial.author.name}</h3>
                    <div className="text-sm text-gray-500">{testimonial.author.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
