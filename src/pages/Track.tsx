import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Symptom = {
  id: string;
  name: string;
  severity: number;
  date: string;
  timeOfDay: string;
  notes?: string;
};

type WellnessPlan = {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  currentDay: number;
  activeUsers: number;
  percentComplete: number;
};

export default function TrackPage() {
  const [, navigate] = useLocation();

  // AUTH GUARD: Redirect to /auth if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sample data for the symptom tracker
  const recentSymptoms: Symptom[] = [
    {
      id: '1',
      name: 'Hot Flashes',
      severity: 3,
      date: '2025-04-03',
      timeOfDay: 'Evening',
      notes: 'Woke up sweating at 2am'
    },
    {
      id: '2',
      name: 'Sleep Quality',
      severity: 2,
      date: '2025-04-03',
      timeOfDay: 'Night',
      notes: 'Had trouble falling asleep'
    }
  ];
  
  // Sample data for the active plan
  const activePlan: WellnessPlan = {
    id: '1',
    title: 'Better Sleep Plan',
    description: 'A 21-day guided program to improve sleep quality and reduce insomnia',
    totalDays: 21,
    currentDay: 14,
    activeUsers: 40,
    percentComplete: 67
  };
  
  // --- Dynamic chart data from backend ---
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWeeklySymptoms = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      // Default to this week's Monday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const startDate = monday.toISOString().slice(0, 10);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/symptoms/weekly`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, start_date: startDate })
        });
        if (!res.ok) {
          setError('Failed to fetch symptoms');
          setLoading(false);
          return;
        }
        const data = await res.json();
        console.log('Weekly symptoms API response:', data); // DEBUG
        // Map backend response to recharts format
        // Assume: data.symptoms = [{date: 'YYYY-MM-DD', symptoms: [{name, severity}]}]
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        data.symptoms.forEach((d: any, idx: number) => {
          console.log(`Day ${days[idx]}:`, d.symptoms);
        });
        const chartRows = data.symptoms.map((d: any, idx: number) => {
          const row: any = { name: days[idx] };
          (d.symptoms || []).forEach((sym: any) => {
            row[sym.name] = sym.severity;
          });
          return row;
        });
        setChartData(chartRows);
        setLoading(false);
      } catch (e) {
        setError('Network error');
        setLoading(false);
      }
    };
    fetchWeeklySymptoms();
  }, []);
  
  // Handle logging a new symptom
  const handleLogSymptom = () => {
    navigate('/log-symptom');
  };
  
  // Go to plan details
  const handleGoToPlan = () => {
    navigate('/wellness-plans/sleep');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Symptom Tracker</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#FFD7D0]/50 p-1 rounded-full">
            <TabsTrigger 
              value="overview" 
              className={`rounded-full ${activeTab === 'overview' ? 'bg-[#F26158] text-white' : ''}`}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="symptoms" 
              className={`rounded-full ${activeTab === 'symptoms' ? 'bg-[#F26158] text-white' : ''}`}
            >
              Symptoms
            </TabsTrigger>
            <TabsTrigger 
              value="plans" 
              className={`rounded-full ${activeTab === 'plans' ? 'bg-[#F26158] text-white' : ''}`}
            >
              Plans
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <motion.div variants={fadeInUp}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Weekly Summary</h2>
                  <span className="text-sm text-gray-500">This Week</span>
                </div>
                
                <Card className="shadow-sm border">
                  <CardContent className="p-4">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} domain={[0, 5]} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line 
                            type="monotone" 
                            dataKey="hot flashes" 
                            name="Hot Flashes" 
                            stroke="#F26158" 
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#F26158' }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sleep issues" 
                            name="Sleep Issues" 
                            stroke="#FFE18B" 
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#FFE18B' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <h2 className="text-lg font-semibold mb-2">Active Plan Progress</h2>
                <Card className="shadow-sm border border-[#F26158]/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{activePlan.title}</h3>
                        <p className="text-sm">Day {activePlan.currentDay} of {activePlan.totalDays}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activePlan.activeUsers} others</span>
                    </div>
                    
                    <div className="mt-2 bg-[#F26158]/20 h-2 rounded-full w-full">
                      <div 
                        className="bg-[#F26158] h-2 rounded-full"
                        style={{ width: `${activePlan.percentComplete}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{activePlan.percentComplete}% complete</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Card className="shadow-sm border bg-[#FFE18B]/30">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Today's Sleep Task</h3>
                        <p className="text-sm mt-1">Optimize bedroom temperature between 65-68°F and use blackout curtains.</p>
                      </div>
                      <Button 
                        className="bg-[#F26158] text-white hover:bg-[#F26158]/90 rounded-full"
                        onClick={handleGoToPlan}
                      >
                        Go to Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              
              <motion.div variants={fadeInUp} className="mt-6">
                <Button 
                  className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 py-6 rounded-full"
                  onClick={handleLogSymptom}
                >
                  Log Today
                </Button>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="symptoms">
            <div className="mt-4 space-y-4">
              <h2 className="text-lg font-semibold">Your Logged Symptoms</h2>
              
              {recentSymptoms.map((symptom) => (
                <Card key={symptom.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <h3 className="font-bold">{symptom.name}</h3>
                      <span className="text-sm text-gray-500">{new Date(symptom.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <span className="text-sm mr-2">Severity:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`w-4 h-4 rounded-full ${
                              level <= symptom.severity 
                                ? 'bg-[#F26158]' 
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-sm">Time of Day: {symptom.timeOfDay}</span>
                    </div>
                    
                    {symptom.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{symptom.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 py-6 rounded-full"
                onClick={handleLogSymptom}
              >
                Log New Symptom
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="plans">
            <div className="mt-4 space-y-4">
              <h2 className="text-lg font-semibold">Your Active Plans</h2>
              
              <Card className="shadow-sm border border-[#F26158]/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{activePlan.title}</h3>
                      <p className="text-sm">Day {activePlan.currentDay} of {activePlan.totalDays}</p>
                      <p className="text-sm mt-1">{activePlan.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 bg-[#F26158]/20 h-2 rounded-full w-full">
                    <div 
                      className="bg-[#F26158] h-2 rounded-full"
                      style={{ width: `${activePlan.percentComplete}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <span className="text-xs text-gray-500">{activePlan.percentComplete}% complete</span>
                    <span className="text-xs text-gray-500">{activePlan.activeUsers} others on this plan</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 mt-4 rounded-full"
                    onClick={handleGoToPlan}
                  >
                    Continue Plan
                  </Button>
                </CardContent>
              </Card>
              
              <h2 className="text-lg font-semibold mt-6">Recommended Plans</h2>
              
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-bold">Hot Flash Relief Plan</h3>
                  <p className="text-sm mt-1">A 14-day plan to reduce hot flash frequency and intensity</p>
                  <p className="text-xs text-gray-500 mt-2">124 women currently active</p>
                  
                  <Button 
                    className="w-full border border-[#F26158] text-[#F26158] hover:bg-[#F26158]/10 mt-4 rounded-full"
                    variant="outline"
                    onClick={() => navigate('/wellness-plans/hot-flashes')}
                  >
                    View Plan
                  </Button>
                </CardContent>
              </Card>
              
              <Button 
                variant="outline"
                className="w-full border-[#F26158] text-[#F26158] hover:bg-[#F26158]/10 mt-4"
                onClick={() => navigate('/wellness-plans')}
              >
                Browse All Plans
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#FFD7D0] p-2 flex justify-around z-10">
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
          onClick={() => {}}
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