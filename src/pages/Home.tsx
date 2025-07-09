import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookAppointmentCard from '@/components/BookAppointmentCard';
import BookAppointmentFlow from './BookAppointmentFlow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fadeInUp, staggerContainer, staggerItems } from '@/lib/animations';
import { LoadingSpinner } from '@/components/ui';

// Type for the home screen data
type HomeScreenData = {
  userName: string;
  todaysInsight: string;
  streakCount: number;
  upcomingEvent?: {
    title: string;
    date: string;
  };
  recentSymptoms: {
    label: string;
    severity: number;
    date: string;
  }[];
  recommendations: {
    id: string;
    title: string;
    description: string;
    type: 'article' | 'video' | 'plan';
  }[];
};

export default function HomePage() {
  const [showBookFlow, setShowBookFlow] = useState(false);
  const [, navigate] = useLocation();

  // AUTH GUARD: Redirect to /auth if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HomeScreenData | null>(null);
  const [activeTab, setActiveTab] = useState('blogs');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // For demo purposes, simulate a successful data fetch
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get username from localStorage or use default
        const storedUserName = localStorage.getItem('userName');
        
        // Sample data for demonstration
        const sampleData: HomeScreenData = {
          userName: storedUserName || 'Guest',
          todaysInsight: 'Taking a moment for self-care can help manage stress levels, which may reduce the frequency of hot flashes.',
          streakCount: 3,
          recentSymptoms: [
            { label: 'Hot flashes', severity: 2, date: '2025-04-03' },
            { label: 'Sleep issues', severity: 3, date: '2025-04-03' }
          ],
          recommendations: [
            {
              id: '1',
              title: 'Managing Hot Flashes Naturally',
              description: 'Learn evidence-based techniques to reduce hot flash frequency and intensity.',
              type: 'article'
            },
            {
              id: '2',
              title: 'Sleep Improvement Plan',
              description: 'A 7-day plan to help you establish better sleep patterns during menopause.',
              type: 'plan'
            },
            {
              id: '3',
              title: 'Mindfulness for Mood Balance',
              description: 'Quick daily practices to help stabilize mood swings and reduce anxiety.',
              type: 'video'
            }
          ]
        };
        
        setData(sampleData);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Book Appointment Modal/Section
  if (showBookFlow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7F0] p-4">
        <BookAppointmentFlow onComplete={() => setShowBookFlow(false)} />
        <Button className="mt-4" variant="outline" onClick={() => setShowBookFlow(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  // Fallback data if the API call fails
  const homeData = data || {
    userName: 'Guest',
    todaysInsight: 'Taking a moment for self-care can help manage stress levels, which may reduce the frequency of hot flashes.',
    streakCount: 0,
    recentSymptoms: [],
    recommendations: [
      {
        id: '1',
        title: 'Managing Hot Flashes Naturally',
        description: 'Learn evidence-based techniques to reduce hot flash frequency and intensity.',
        type: 'article'
      },
      {
        id: '2',
        title: 'Sleep Improvement Plan',
        description: 'A 7-day plan to help you establish better sleep patterns during menopause.',
        type: 'plan'
      },
      {
        id: '3',
        title: 'Mindfulness for Mood Balance',
        description: 'Quick daily practices to help stabilize mood swings and reduce anxiety.',
        type: 'video'
      }
    ]
  };

  // Handle navigation to different sections
  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white pb-16">

      {/* Top greeting section as a card */}
      <div className="px-4 pt-2 space-y-4 bg-white">
  {/* Abstract top card section inspired by the image */}
  <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden mb-4" style={{background: '#FFD7D0', minHeight: '175px'}}>
  {/* Date and icon row */}
  <div className="flex justify-between items-center px-5 pt-4">
    <div className="w-8 h-8 bg-[#F1F1F1] rounded-full flex items-center justify-center">
      {/* Placeholder for user icon */}
      <span role="img" aria-label="cat" className="text-lg">🐱</span>
    </div>
    <div className="text-gray-900 font-semibold">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
    <div className="w-8 h-8 flex items-center justify-center">
      {/* Placeholder for calendar icon */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>
    </div>
  </div>
  {/* Motivational text */}
  <div className="flex flex-col items-center justify-center px-5 pt-2 pb-6">
    <div className="text-xs text-gray-700 mt-2 font-medium">Recall that sense of calm you had last time?</div>
    <div className="text-2xl font-bold text-gray-900 text-center mt-2 leading-tight">Set aside 5 minutes for guided meditation.</div>
  </div>
</div>
</div>

      {/* Quick Access & Today's Insights Card */}
      <div className="px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 mb-10">
          <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
          <div className="flex space-x-4 mb-8">
            <button type="button" onClick={() => navigate('/log-symptom')} className="flex-1 bg-orange-100 rounded-2xl py-4 flex items-center justify-center text-base font-medium shadow-sm">Log Symptoms</button>
            <button type="button" onClick={() => navigate('/chat')} className="flex-1 bg-blue-100 rounded-2xl py-4 flex items-center justify-center text-base font-medium shadow-sm">Ask Menova AI</button>
          </div>
          <h2 className="text-2xl font-bold mb-4">Today's Insights</h2>
          <div className="bg-[#FFF7F0] rounded-2xl border border-[#FFD7D0] p-6 shadow-sm">
            <ul className="space-y-2 text-base text-gray-800">
              <li>Your sleep pattern has improved</li>
              <li>Hot flashes decreased by 30%</li>
              <li>Mood seems stable this week</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mb-10"></div>
      {/* Main content */}
      <motion.div 
        className="max-w-md mx-auto px-4 -mt-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Card className="border border-gray-200 shadow-xl rounded-3xl mx-auto max-w-md mt-4">
  <CardHeader className="pb-2 bg-white rounded-t-3xl">
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="flex space-x-4 bg-primary/80 rounded-full p-1 mt-4 mb-4 w-fit mx-auto shadow-sm">
        <TabsTrigger
          value="blogs"
          className="px-5 py-2 rounded-full text-white font-semibold data-[state=active]:bg-white data-[state=active]:text-primary transition-colors"
        >
          Blogs
        </TabsTrigger>
        <TabsTrigger
          value="plans"
          className="px-5 py-2 rounded-full text-white font-semibold data-[state=active]:bg-white data-[state=active]:text-primary transition-colors"
        >
          Plans
        </TabsTrigger>
        <TabsTrigger
          value="videos"
          className="px-5 py-2 rounded-full text-white font-semibold data-[state=active]:bg-white data-[state=active]:text-primary transition-colors"
        >
          Videos
        </TabsTrigger>
      </TabsList>
              
              <TabsContent value="blogs" className="mt-4 space-y-4">
                <motion.div variants={staggerItems} className="space-y-4">
                  {homeData.recommendations.filter(item => item.type === 'article').map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <Card className="cursor-pointer hover:bg-slate-50 transition-colors border border-[#FFD7D0] shadow-lg rounded-3xl p-1">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{item.title}</h3>
                              <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigateTo('/wellness-plans')}
                >
                  View All Blogs
                </Button>
              </TabsContent>
              
              <TabsContent value="plans" className="mt-4 space-y-4">
                <motion.div variants={staggerItems} className="space-y-4">
                  {homeData.recommendations.filter(item => item.type === 'plan').map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <Card className="cursor-pointer hover:bg-slate-50 transition-colors border border-[#FFD7D0] shadow-lg rounded-3xl p-1">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                <rect width="18" height="18" x="3" y="3" rx="2"/>
                                <path d="M9 14v1"/>
                                <path d="M9 8v1"/>
                                <path d="M15 14v1"/>
                                <path d="M15 8v1"/>
                                <path d="M9 12h6"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{item.title}</h3>
                              <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigateTo('/wellness-plans')}
                >
                  View All Plans
                </Button>
              </TabsContent>
              
              <TabsContent value="videos" className="mt-4 space-y-4">
                <motion.div variants={staggerItems} className="space-y-4">
                  {homeData.recommendations.filter(item => item.type === 'video').map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <Card className="cursor-pointer hover:bg-slate-50 transition-colors border border-[#FFD7D0] shadow-lg rounded-3xl p-1">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                <polygon points="6 3 18 12 6 21 6 3"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">{item.title}</h3>
                              <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigateTo('/videos')}
                >
                  View All Videos
                </Button>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardContent>
            {/* Content moved inside Tabs component above */}
          </CardContent>
        </Card>
      </motion.div>

      {/* Book Appointment Card at the end */}
      <div className="px-4 mb-10">
        <BookAppointmentCard onBook={() => setShowBookFlow(true)} />
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#FFD7D0] p-2 flex justify-around z-10">
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16 text-primary"
          onClick={() => {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mb-1">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigateTo('/chat')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigateTo('/track')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
            <path d="M2 12h20"/>
            <path d="M2 20h20"/>
            <path d="M2 4h20"/>
            <path d="M16 8V4"/>
            <path d="M8 16v4"/>
            <path d="M12 10v2"/>
          </svg>
          Track
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigateTo('/community')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
            <path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7 6 13 6 13s6-6 6-13Z"/>
            <circle cx="12" cy="8" r="2"/>
          </svg>
          Community
        </Button>
      </div>
    </div>
  );
}