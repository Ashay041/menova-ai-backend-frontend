import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeInUp, staggerContainer, staggerItems } from '@/lib/animations';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';

type QuestionOption = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

const assessmentQuestions: Question[] = [
  {
    id: 'menopause_stage',
    text: 'Which stage of menopause are you currently experiencing?',
    options: [
      { id: 'pre', text: 'Perimenopause (before menopause, with changing periods)' },
      { id: 'early', text: 'Early menopause (periods stopped in the last year)' },
      { id: 'post', text: 'Postmenopause (periods stopped over a year ago)' },
      { id: 'unsure', text: 'I\'m not sure' },
    ],
  },
  {
    id: 'symptoms',
    text: 'Which symptoms are you experiencing? (Select all that apply)',
    options: [
      { id: 'hot_flashes', text: 'Hot flashes or night sweats' },
      { id: 'sleep', text: 'Sleep disturbances' },
      { id: 'mood', text: 'Mood changes (anxiety, irritability, depression)' },
      { id: 'physical', text: 'Physical discomfort (joint pain, headaches)' },
      { id: 'cognitive', text: 'Brain fog or difficulty concentrating' },
      { id: 'other', text: 'Other symptoms' },
    ],
  },
  {
    id: 'severity',
    text: 'How would you rate the severity of your symptoms?',
    options: [
      { id: 'mild', text: 'Mild - noticeable but not disruptive' },
      { id: 'moderate', text: 'Moderate - somewhat disruptive to daily life' },
      { id: 'severe', text: 'Severe - significantly impacting quality of life' },
      { id: 'variable', text: 'Variable - changes from day to day' },
    ],
  },
  {
    id: 'support',
    text: 'What support are you most interested in?',
    options: [
      { id: 'medical', text: 'Medical information and treatment options' },
      { id: 'lifestyle', text: 'Lifestyle and natural management strategies' },
      { id: 'emotional', text: 'Emotional and mental health support' },
      { id: 'community', text: 'Community and connecting with others' },
      { id: 'all', text: 'All of the above' },
    ],
  },
];

export default function Assessment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const currentQuestion = assessmentQuestions[currentQuestionIndex];

  // Handle when an option is selected
  const handleOptionSelect = (optionId: string) => {
    const questionId = currentQuestion.id;
    
    if (questionId === 'symptoms') {
      setIsMultiSelect(true);
      setAnswers(prev => {
        const existingAnswers = prev[questionId] || [];
        if (existingAnswers.includes(optionId)) {
          return {
            ...prev,
            [questionId]: existingAnswers.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...existingAnswers, optionId]
          };
        }
      });
    } else {
      setIsMultiSelect(false);
      setAnswers(prev => ({
        ...prev,
        [questionId]: [optionId]
      }));
      
      // Auto-advance if not the symptoms question
      if (currentQuestionIndex < assessmentQuestions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 500);
      }
    }
  };

  // Handle next question button
  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Handle previous question button
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Check if an option is selected
  const isOptionSelected = (optionId: string) => {
    const questionId = currentQuestion.id;
    return answers[questionId]?.includes(optionId) || false;
  };

  // Handle assessment completion
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // For demo purposes, we'll skip the actual API call
      // and simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Assessment completed",
        description: "Your personalized experience is ready!",
      });
      
      // Redirect to home page after assessment
      setLocation('/home');
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / assessmentQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-8 px-4">
      <motion.div 
        className="max-w-md mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Question {currentQuestionIndex + 1} of {assessmentQuestions.length}
          </p>
        </div>

        {/* Question card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center text-primary">
              {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div 
              className="space-y-3"
              variants={staggerItems}
            >
              {currentQuestion.options.map((option) => (
                <motion.div key={option.id} variants={fadeInUp}>
                  <Button
                    variant={isOptionSelected(option.id) ? "default" : "outline"}
                    className={`w-full justify-start text-left py-4 ${
                      isOptionSelected(option.id) 
                        ? "bg-primary text-white" 
                        : "hover:bg-primary/10"
                    }`}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    {option.text}
                  </Button>
                </motion.div>
              ))}
            </motion.div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="text-gray-500"
              >
                Previous
              </Button>

              {isMultiSelect && (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!answers[currentQuestion.id] || answers[currentQuestion.id].length === 0}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Next
                </Button>
              )}

              {currentQuestionIndex === assessmentQuestions.length - 1 && (
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting || !answers[currentQuestion.id]}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Complete'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip for now option */}
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => setLocation('/home')}
            className="text-gray-500"
          >
            Skip for now
          </Button>
        </div>
      </motion.div>
    </div>
  );
}