import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

import { useEffect } from 'react';

// --- Remove hardcoded symptoms, fetch from backend instead ---

export default function LogSymptomPage() {
  const [, navigate] = useLocation();
  const [symptomTypes, setSymptomTypes] = useState<string[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [severity, setSeverity] = useState(3); // 1-5 scale
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch symptom types from backend
    fetch(`${import.meta.env.VITE_API_BASE_URL}/symptoms/types`)
      .then(res => res.json())
      .then(data => {
        setSymptomTypes((data.symptom_types || []).map((s: string) => s.toLowerCase()));
        if (data.symptom_types && data.symptom_types.length > 0) {
          setSelectedSymptom(data.symptom_types[0]);
        }
      });
  }, []);

  // Helper for displaying a pretty date
  const formattedDate = (() => {
    const d = new Date(date);
    return d.toLocaleString('default', { month: 'long' }) + ' ' + d.getDate() + ', ' + d.getFullYear();
  })();

  const handleSaveSymptom = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/symptoms/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          date,
          symptom: selectedSymptom,
          severity
        })
      });
      if (!res.ok) {
        setError('Failed to log symptom.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/track'), 1000);
    } catch (e) {
      setError('Network error');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/track');
  };

  const handleViewCommunityStories = () => {
    navigate('/community?tag=insomnia');
  };

  const handleJoinPlan = () => {
    navigate('/wellness-plans/sleep');
  };

  const handleViewLater = () => {
    navigate('/track');
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Log Symptom</h1>
          <Button variant="ghost" onClick={handleCancel} className="text-gray-500">
            Cancel
          </Button>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={fadeInUp} className="space-y-2">
            <h2 className="text-xl font-semibold">{selectedSymptom}</h2>
            <p className="text-gray-500">{date}</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-3">
            <h2 className="text-xl font-semibold">Symptom</h2>
            <select
              className="w-full border rounded-lg p-2"
              value={selectedSymptom}
              onChange={e => setSelectedSymptom(e.target.value)}
            >
              {symptomTypes.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-3">
            <h2 className="text-xl font-semibold">Severity (1-5)</h2>
            <select
              className="w-full border rounded-lg p-2"
              value={severity}
              onChange={e => setSeverity(Number(e.target.value))}
            >
              {[1,2,3,4,5].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-3">
            <h2 className="text-xl font-semibold">Date</h2>
            <input
              type="date"
              className="w-full border rounded-lg p-2"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </motion.div>

          {error && <div className="text-red-600">{error}</div>}
          {success && <div className="text-green-600">Symptom logged!</div>}
          <motion.div variants={fadeInUp} className="space-y-4 pt-4">
            <Button
              className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 py-6 rounded-full"
              onClick={handleSaveSymptom}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Symptom'}
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-3 mt-6">
            <Card className="border border-[#F26158]/30 rounded-lg">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Recommended for Your Symptoms</h2>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-bold">Better Sleep Plan</h3>
                  <p className="text-sm mt-1">
                    A 21-day guided program to improve sleep quality and reduce insomnia
                  </p>
                  <p className="text-sm text-gray-500 mt-1">40 women currently active</p>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 bg-[#F26158] text-white hover:bg-[#F26158]/90 rounded-full"
                    onClick={handleJoinPlan}
                  >
                    Join Now
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1 border-[#F26158] text-[#F26158] hover:bg-[#F26158]/10 rounded-full"
                    onClick={handleViewLater}
                  >
                    View Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-4 pt-4">
            <Button
              className="w-full bg-[#F26158] text-white hover:bg-[#F26158]/90 py-6 rounded-full"
              onClick={handleSaveSymptom}
            >
              Save Symptom
            </Button>

            <Button
              variant="outline"
              className="w-full border-[#F26158] bg-[#FFE18B]/50 text-black hover:bg-[#FFE18B]/70 py-6 rounded-full"
              onClick={handleViewCommunityStories}
            >
              View Community Stories
            </Button>
          </motion.div>
        </motion.div>
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