import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { fadeInUp, staggerContainer } from '@/lib/animations';

type WellnessPlan = {
  id: string;
  title: string;
  description: string;
  duration: string;
  activeUsers: number;
  category: string;
  featured: boolean;
};

// Sample wellness plans data
const wellnessPlansData: WellnessPlan[] = [
  {
    id: 'sleep',
    title: 'Better Sleep Plan',
    description: 'A 21-day guided program to improve sleep quality and reduce insomnia',
    duration: '21 days',
    activeUsers: 40,
    category: 'sleep',
    featured: true
  },
  {
    id: 'hot-flashes',
    title: 'Hot Flash Relief Plan',
    description: 'A 14-day plan to reduce hot flash frequency and intensity through dietary and environmental changes',
    duration: '14 days',
    activeUsers: 124,
    category: 'symptoms',
    featured: true
  },
  {
    id: 'mood',
    title: 'Mood Balance',
    description: 'An 18-day program focused on managing mood swings and emotional well-being through mindfulness',
    duration: '18 days',
    activeUsers: 86,
    category: 'mental',
    featured: false
  },
  {
    id: 'energy',
    title: 'Energy Boost',
    description: 'A 10-day plan to combat fatigue and increase energy levels naturally',
    duration: '10 days',
    activeUsers: 52,
    category: 'physical',
    featured: false
  },
  {
    id: 'brain-fog',
    title: 'Mental Clarity',
    description: 'A 15-day program to improve focus and reduce brain fog through diet and exercises',
    duration: '15 days',
    activeUsers: 34,
    category: 'mental',
    featured: false
  }
];

interface WellnessPlansPageProps {
  planId?: string;
}

export default function WellnessPlansPage(props: WellnessPlansPageProps = {}) {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ planId: string }>('/wellness-plans/:planId');
  const urlPlanId = match ? params.planId : undefined;
  const planId = urlPlanId || props.planId;
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // If a specific plan is targeted, show that plan's details
  const currentPlan = planId ? wellnessPlansData.find(plan => plan.id === planId) : undefined;
  
  useEffect(() => {
    if (planId && planId === 'sleep') {
      setActiveTab('sleep');
    } else if (planId && planId === 'hot-flashes') {
      setActiveTab('symptoms');
    }
  }, [planId]);
  
  // Filtered plans based on active tab and search query
  const getFilteredPlans = () => {
    let filtered = wellnessPlansData;
    
    // Filter by category/tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(plan => plan.category === activeTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        plan => 
          plan.title.toLowerCase().includes(query) || 
          plan.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  const filteredPlans = getFilteredPlans();
  
  const handlePlanSelect = (planId: string) => {
    navigate(`/wellness-plans/${planId}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Wellness Plans</h1>
          <Button 
            variant="ghost" 
            className="flex items-center"
            onClick={() => navigate('/home')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back
          </Button>
        </div>
        
        {/* Plan Detail View */}
        {currentPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Button 
              variant="ghost" 
              className="mb-2"
              onClick={() => navigate('/wellness-plans')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to Plans
            </Button>
            
            <Card className="shadow-sm border border-[#F26158]/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{currentPlan.title}</h2>
                  <span className="text-sm bg-[#FFE18B] px-3 py-1 rounded-full">
                    {currentPlan.duration}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{currentPlan.description}</p>
                
                <div className="bg-[#FFD7D0]/30 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">What You'll Get</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-1 flex-shrink-0">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Daily activities and exercises tailored to your needs</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-1 flex-shrink-0">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Access to a community of {currentPlan.activeUsers} women currently on this plan</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-1 flex-shrink-0">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Personalized AI insights based on your progress</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F26158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-1 flex-shrink-0">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>Expert advice and scientifically-backed strategies</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 mt-6">
                  <Button
                    className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 rounded-full py-2 text-sm"
                    onClick={() => handlePlanSelect(currentPlan.id)}
                  >
                    Join this plan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-[#FFD7D0] text-[#F26158] hover:bg-[#FFD7D0]/30 py-2 text-sm"
                    onClick={() => navigate('/community')}
                  >
                    See community stories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Plans List View */}
        {!currentPlan && (
          <>
            {/* Search bar */}
            <div className="mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wellness plans..."
                className="w-full"
              />
            </div>
            
            {/* Category tabs */}
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-4 bg-[#FFD7D0]/50 p-1 rounded-full">
                <TabsTrigger 
                  value="all" 
                  className={`rounded-full ${activeTab === 'all' ? 'bg-[#F26158] text-white' : ''}`}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="sleep" 
                  className={`rounded-full ${activeTab === 'sleep' ? 'bg-[#F26158] text-white' : ''}`}
                >
                  Sleep
                </TabsTrigger>
                <TabsTrigger 
                  value="symptoms" 
                  className={`rounded-full ${activeTab === 'symptoms' ? 'bg-[#F26158] text-white' : ''}`}
                >
                  Symptoms
                </TabsTrigger>
                <TabsTrigger 
                  value="mental" 
                  className={`rounded-full ${activeTab === 'mental' ? 'bg-[#F26158] text-white' : ''}`}
                >
                  Mental
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Featured plans */}
            {(activeTab === 'all' || activeTab === 'featured') && searchQuery === '' && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Featured Plans</h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {wellnessPlansData.filter(plan => plan.featured).map((plan) => (
                    <motion.div key={plan.id} variants={fadeInUp}>
                      <Card className="shadow-sm border border-[#F26158]/20">
                        <CardContent className="p-4">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg">{plan.title}</h3>
                              <span className="text-xs bg-[#FFE18B] px-2 py-1 rounded-full">
                                {plan.duration}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{plan.description}</p>
                            <p className="text-xs text-gray-500 mt-2">{plan.activeUsers} women currently active</p>
                            
                            <div className="flex gap-2 mt-4">
                              <Button
                                className="flex-1 bg-[#F26158] text-white hover:bg-[#F26158]/90 rounded-full"
                                onClick={() => handlePlanSelect(plan.id)}
                              >
                                Join Plan
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="flex-1 border-[#F26158] text-[#F26158] hover:bg-[#F26158]/10 rounded-full"
                                onClick={() => handlePlanSelect(plan.id)}
                              >
                                Learn More
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
            
            {/* All plans or filtered results */}
            <div>
              {activeTab !== 'all' || searchQuery !== '' ? (
                <h2 className="text-lg font-semibold mb-3">
                  {searchQuery ? 'Search Results' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plans`}
                </h2>
              ) : (
                <h2 className="text-lg font-semibold mb-3">All Plans</h2>
              )}
              
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredPlans.map((plan) => (
                  <motion.div key={plan.id} variants={fadeInUp}>
                    <Card className={`shadow-sm ${plan.featured ? 'border-[#F26158]/20' : ''}`}>
                      <CardContent className="p-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold">{plan.title}</h3>
                            <span className="text-xs bg-[#FFD7D0]/50 px-2 py-1 rounded-full">
                              {plan.duration}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{plan.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{plan.activeUsers} women currently active</p>
                          
                          <Button
                            className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 mt-3 rounded-full py-2 text-sm"
                            onClick={() => handlePlanSelect(plan.id)}
                          >
                            View Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {filteredPlans.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No plans found matching your criteria.</p>
                    <Button 
                      variant="link" 
                      className="text-[#F26158] mt-2"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveTab('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-10">
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigate('/home')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigate('/chat')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16 text-[#F26158]"
          onClick={() => navigate('/track')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F26158] mb-1">
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
          onClick={() => navigate('/community')}
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