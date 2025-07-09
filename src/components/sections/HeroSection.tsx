import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus2 } from "lucide-react";

interface WaitlistCountResponse {
  count: number;
}

export default function HeroSection() {
  // Fetch waitlist count from API
  const { data } = useQuery<WaitlistCountResponse>({
    queryKey: ['/api/waitlist/count'],
    staleTime: 60000, // 1 minute
  });

  const waitlistCount = data?.count || 250;

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-1/2 gradient-pink-bg hidden lg:block" aria-hidden="true"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative pt-16 pb-20 lg:pb-24 lg:pt-24">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Hero Content */}
            <motion.div 
              className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="lg:py-12">
                <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight xl:text-6xl xl:tracking-tight">
                  <span className="block">Your personalized</span>
                  <span className="block bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">menopause companion</span>
                </h1>
                <p className="mt-6 text-lg text-gray-600 sm:text-xl">
                  Navigate menopause confidently with personalized insights, symptom tracking, and a supportive community. Menova.ai is your all-in-one companion through this journey.
                </p>
                <div className="mt-8 sm:mt-12 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button size="lg" className="bg-primary hover:bg-primary-600" asChild>
                      <a href="#waitlist" className="w-full flex items-center">
                        Take Assessment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button size="lg" variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
                      <a href="#signin" className="w-full flex items-center">
                        Sign In
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="mt-10">
                  <p className="text-center lg:text-left text-xl font-medium text-gray-700">
                    You are not alone in this journey
                  </p>
                  <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 sm:justify-center lg:justify-start">
                    <div className="flex -space-x-2 overflow-hidden">
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white" style={{ backgroundColor: 'var(--menova-pink-200)' }}></div>
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white" style={{ backgroundColor: 'var(--menova-pink-300)' }}></div>
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white" style={{ backgroundColor: 'var(--menova-pink-400)' }}></div>
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary flex items-center justify-center text-white">
                        <UserPlus2 size={14} />
                      </div>
                    </div>
                    <span>
                      <span className="font-medium text-primary">{waitlistCount}+</span> women in our community
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Hero Image */}
            <motion.div 
              className="mt-12 lg:relative lg:mt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                <div className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none">
                  <div className="relative rounded-xl overflow-hidden shadow-xl">
                    <div className="aspect-video gradient-pink-bg p-4 w-full lg:h-full">
                      <div className="hero-card">
                        <div className="flex items-center mb-4">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="h-5 w-5 rounded-full bg-primary"></div>
                          </div>
                          <div className="ml-3">
                            <div className="font-medium">Welcome, Karen!</div>
                            <div className="text-sm text-gray-500">You're in Perimenopause Day 45</div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="bg-gray-100 rounded-md p-3">
                            <div className="text-sm font-medium">Today's Insights</div>
                            <ul className="mt-1 text-xs text-gray-600 space-y-1">
                              <li className="flex items-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5"></span>
                                Your sleep pattern has improved
                              </li>
                              <li className="flex items-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mr-1.5"></span>
                                Hot flashes decreased by 30%
                              </li>
                            </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-primary/10 rounded-md p-3 text-center flex flex-col items-center">
                              <div className="text-xs font-medium text-primary">Log Symptoms</div>
                            </div>
                            <div className="rounded-md p-3 text-center flex flex-col items-center" style={{ backgroundColor: 'var(--menova-pink-100)' }}>
                              <div className="text-xs font-medium text-primary">Ask AI Assistant</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
