import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItems } from '@/lib/animations';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: string[];
  actionButtons?: {
    text: string;
    action: string;
  }[];
};

const commands = [
  { label: 'Maya', command: '/vent ' },
  { label: 'Book Appointment', command: '/appointment ' },
  { label: 'Log Symptom', command: '/log-symptom ' },
  { label: 'Should I?', command: '/should-i ' },
  { label: 'Ask Gyn', command: '/ask-gyn ' },
  { label: 'Remind Me', command: '/remind-me ' },
  { label: 'Share with Partner', command: '/share-with-partner ' },
  { label: 'Find Doctor', command: '/find-doctor ' },
];

export default function ChatPage() {
  const [, navigate] = useLocation();

  // AUTH GUARD: Redirect to /auth if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandList, setShowCommandList] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chatMode, setChatMode] = useState<'menova' | 'maya'>('menova');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if(chatMode === 'maya') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
              `Hi I'm Maya, your friend and emotional support agent. I'm here to listen and help you with your feelings. This conversation is completely private. You can talk to me about anything that's on your mind!`,

          timestamp: new Date().toISOString()
        }
      ]);
    } else {
      const userName = localStorage.getItem('userName') || 'Vidhi';
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
               `Hi ${userName}, I’m Menova.ai — your trusted advisor for everything menopause. How can I support you today?`,

          timestamp: new Date().toISOString()
        }
      ]);
    }
}, [chatMode]);

  // Load chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // Simulate loading delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));
        setInitialLoading(false);
        
        // Get user name from localStorage
        const userName = localStorage.getItem('userName') || 'Vidhi';
        
        // Just add a welcome message - no mock conversations
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
                 `Hi ${userName}, I’m Menova.ai — your trusted advisor for everything menopause. How can I support you today?`,

            timestamp: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setInitialLoading(false);
        toast({
          title: "Error loading chat",
          description: "Could not load your chat history. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchChatHistory();
  }, [toast]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Send message to API and get response
  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // // Check if auth token exists
      // if (!token) {
      //   throw new Error('Authentication information missing. Please log in again.');
      // }

      console.log('Sending message to API:', userMessage.content);
      
      // Get user_id from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID missing. Please log in again.');
      }

      // Call the new Menova chat API
      const BASE_URL = "http://localhost:8000";
      const response = await fetch(`${BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          query: userMessage.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API responded with status: ${response.status}`);
      }
      const data = await response.json();
      // Extract references in square brackets at the end of the response
      let content = data.response || 'Sorry, I could not generate a response.';
      let references: string[] = [];
      // Match [ ... ] at the end of the string
      const refMatch = content.match(/\[(.*?)\]\s*$/);
      if (refMatch) {
        // Remove the reference part from the main content
        content = content.replace(/\[(.*?)\]\s*$/, '').trim();
        // Split references by comma, trim, and filter out empty
        references = refMatch[1].split(',').map(ref => ref.trim()).filter(Boolean);
      }
      const assistantMessage: ChatMessage = {
        id: 'ai-' + Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        // @ts-ignore
        references,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your message. Please try again.",
        variant: "destructive",
      });
      
      // Handle common errors
      if (error instanceof Error) {
        // If it's an authentication error, we should redirect to login
        if (error.message.includes('Authentication') || 
            error.message.includes('log in again') || 
            error.message.includes('status: 401')) {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          
          // Clear local storage and redirect to auth page after a short delay
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mock emotional support response
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    // setIsLoading(true);
    
    try {
      if (true) {
        const mockResponse = `I'm so sorry you're feeling angry today. It's completely understandable, and you're not alone in feeling this way. Anger can be a really common emotion during this phase of life. It can feel like it comes out of nowhere sometimes, doesn't it? I remember one day I was standing in line at the grocery store, and the cashier was taking a little longer than usual, and I felt this wave of anger wash over me. It was surprising even to me!
        
        Is there anything in particular you feel angry about, or is it more of a general feeling? Sometimes just talking about it can help. If you'd like to share, I'm here to listen without judgment. If not, that's okay too.
        
        Even if we can't pinpoint the exact cause, there are a few things that might help ease the feeling. A brisk walk outside can sometimes do wonders for shifting my mood, or even just a few minutes of deep breathing. I also find that having a warm cup of chamomile tea or listening to some calming music can be soothing.
        
        Remember, it's okay to feel angry. Allow yourself to feel the emotion, and don't beat yourself up about it. If this feeling persists or becomes overwhelming, please reach out to your doctor or a therapist. They can offer additional support and guidance. Sending you a big virtual hug. ❤️`;
        const assistantMessage : ChatMessage = {
          id: 'mock-' + Date.now().toString(),
          role: 'assistant',
          content: mockResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Check if auth token exists
      if (!token) {
        throw new Error('Authentication information missing. Please log in again.');
      }

      console.log('Sending message to API:', userMessage.content);
      
      // Get user_id from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID missing. Please log in again.');
      }

      // Call the new Menova chat API
      const BASE_URL = "http://localhost:8000";
      const response = await fetch(`${BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          query: userMessage.content
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API responded with status: ${response.status}`);
      }
      const data = await response.json();
      // Extract references in square brackets at the end of the response
      let content = data.response || 'Sorry, I could not generate a response.';
      let references: string[] = [];
      // Match [ ... ] at the end of the string
      const refMatch = content.match(/\[(.*?)\]\s*$/);
      if (refMatch) {
        // Remove the reference part from the main content
        content = content.replace(/\[(.*?)\]\s*$/, '').trim();
        // Split references by comma, trim, and filter out empty
        references = refMatch[1].split(',').map(ref => ref.trim()).filter(Boolean);
      }
      const assistantMessage: ChatMessage = {
        id: 'ai-' + Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        // @ts-ignore
        references,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your message. Please try again.",
        variant: "destructive",
      });
      
      // Handle common errors
      if (error instanceof Error) {
        // If it's an authentication error, we should redirect to login
        if (error.message.includes('Authentication') || 
            error.message.includes('log in again') || 
            error.message.includes('status: 401')) {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          
          // Clear local storage and redirect to auth page after a short delay
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format chat bubble based on role
  const getChatBubbleClasses = (role: 'user' | 'assistant') => {
    return role === 'user'
      ? "bg-[#FFE18B] text-black self-end"
      : "bg-white border border-gray-200 text-black self-start";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    // your submit logic
    console.log('Submitting:', inputValue);
    setInputValue('');
    setShowCommandList(false);
  };

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowCommandList(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.startsWith('/')) {
      const filtered = commands.filter(cmd =>
        cmd.command.toLowerCase().startsWith(value.toLowerCase())
      );
      setFilteredCommands(filtered);
      setShowCommandList(true);
    } else {
      setShowCommandList(false);
    }
  };
  
  // Handle action button clicks
  const handleActionButtonClick = (action: string) => {
    console.log(`Action button clicked: ${action}`);
    if (action === 'sleep-tips') {
      navigate('/wellness-plans/sleep');
    } else if (action === 'track-sleep') {
      navigate('/track/sleep');
    }
  };

  // Go back to home page
  const goBack = () => {
    navigate('/home');
  };

  // Suggested questions to ask
  const suggestedQuestions = [
    "What causes hot flashes?",
    "How can I improve my sleep during menopause?",
    "What are natural remedies for mood swings?",
    "Should I talk to my doctor about HRT?"
  ];

  // Handle clicking a suggested question
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative pb-16">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white relative">
        <Button variant="ghost" onClick={goBack} className="mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Button>
        {/* <div>
          <h1 className="text-xl font-bold">Menova AI</h1>
          <p className="text-xs text-muted-foreground">Ask me anything!</p>
        </div> */}
       <div className="absolute left-1/2 transform -translate-x-[45%]">
          {/* Toggle Tabs */}
          <div className="inline-flex bg-[#FFF7F4] border border-[#FFD7D0] rounded-full p-1 shadow-inner space-x-1">
            <button
              onClick={() => setChatMode('menova')}
              className={`w-28 text-sm px-3 py-1 rounded-full transition-all duration-200 ${
                chatMode === 'menova'
                  ? 'bg-white text-primary font-semibold shadow'
                  : 'text-gray-600'
              }`}
            >
              Menova AI
            </button>
            <button
              onClick={() => setChatMode('maya')}
              className={`w-28 text-sm px-3 py-1 rounded-full transition-all duration-200 ${
                chatMode === 'maya'
                  ? 'bg-white text-pink-600 font-semibold shadow'
                  : 'text-gray-600'
              }`}
            >
              Maya
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-muted-foreground mt-1 text-center px-2">
            {chatMode === 'maya'
              ? 'I’m Maya, your emotional companion'
              : 'Ask me anything — I’m here to help.'}
          </p>
        </div>
        </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 border-t border-gray-200">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              variants={fadeInUp}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
        <div className="flex flex-col items-center ml-1">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0a8078] text-s text-white font-bold shadow">
          M
        </div>
        </div>
        )}
<div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
  <div
    className={
      message.role === 'assistant'
        ? 'max-w-[70vw] bg-[#FFD7D0] text-gray-900 px-4 py-3 rounded-2xl rounded-tl-md mb-1 shadow'
        : 'max-w-[70vw] bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl rounded-tr-md mb-1 shadow'
    }
    style={{ wordBreak: 'break-word' }}
  >
    <p className="text-sm whitespace-pre-line">
      {message.content.split(/\*\*(.*?)\*\*/g).map((part, idx) =>
        idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
      )}
    </p>
  </div>
  {/* Show references for assistant messages */}
  {message.role === 'assistant' && message.references && message.references.length > 0 && (
    <div className="mt-2 text-[11px] italic text-gray-400 bg-gray-50 border border-gray-100 rounded px-3 py-1">
      <span className="font-semibold text-gray-400 italic">Sources:</span> {message.references.join(', ')}
    </div>
  )}
  
  {/* Action buttons for assistant messages */}
  {message.role === 'assistant' && message.actionButtons && message.actionButtons.length > 0 && (
    <div className="flex space-x-2 mt-2">
      {message.actionButtons.map((button, index) => (
        <Button
          key={index}
          variant="outline"
          className="text-[#F26158] border-[#F26158] hover:bg-[#F26158]/10 rounded-full text-sm"
          onClick={() => handleActionButtonClick(button.action)}
        >
          {button.text}
        </Button>
      ))}
    </div>
  )}
</div>
{message.role === 'user' && (
  <div className="flex flex-col items-center">
    <div className="w-3 h-3 flex items-center justify-center rounded-full bg-[#d97307] text-xs shadow">
      V
    </div>
  </div>
)}
</motion.div>
))}
</motion.div>
        
        {/* Loading indicator when waiting for response */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
              <LoadingSpinner size="small" />
              Just a sec — checking the facts for you!
            </div>
          </div>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggested questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Agent Quick Actions - horizontally scrollable chips */}
      <div className="w-full px-2 py-1 bg-[#FFF7F4] border-t border-b border-[#FFD7D0] fixed bottom-32 left-0 right-0 z-30 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Small agent tags, no emoji, compact style */}
           {[
            { label: 'Maya', command: '/vent ' },
            { label: 'Book Appointment', command: '/appointment ' },
            { label: 'Log Symptom', command: '/log-symptom ' },
            { label: 'Should I?', command: '/should-i ' },
            { label: 'Ask Gyn', command: '/ask-gyn ' },
            { label: 'Remind Me', command: '/remind-me ' },
            { label: 'Share with Partner', command: '/share-with-partner '},
            { label: 'Find Doctor', command: '/find-doctor ' },
          ].map((agent, idx) => (
            <button
              key={agent.command}
              type="button"
              className="px-3 py-1 rounded-md border border-[#FFD7D0] bg-white text-[#F26158] font-medium text-xs hover:bg-[#FFE18B]/40 focus:outline-none focus:ring-2 focus:ring-[#F26158] whitespace-nowrap transition"
              style={{ minWidth: 0 }}
              onClick={() => {
                document.querySelector('input[placeholder="Type a message..."]')?.focus();
              }}
              aria-label={`Use ${agent.label} agent`}
            >
              {agent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area - flush with nav bar */}
      <div className="p-4 bg-white fixed bottom-14 left-0 right-0 z-20 border-b border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleCommandKeyDown}
            placeholder="Type a message..."
            className="flex-1 border border-[#FFD7D0] rounded-full py-6 px-4 bg-[#FFF7F4] placeholder-gray-500 focus:ring-0"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="bg-[#F26158] text-white rounded-full w-12 h-12 flex items-center justify-center p-0 hover:bg-[#F26158]/90"
          >
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </Button>

          {/* Slash Command Dropdown */}
          {showCommandList && filteredCommands.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-br from-white via-[#FFF4F4] to-[#FFEFEF] border border-gray-200 rounded-xl shadow-md z-30 max-h-60 overflow-y-auto backdrop-blur-md transition-all duration-150">
                {filteredCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setInputValue(cmd.command);
                      setShowCommandList(false);
                    }}
                    className="px-4 py-2 hover:bg-[#FFE2E2] transition-colors duration-150 cursor-pointer rounded-lg mx-2 my-1"
                  >
                    <div className="text-sm font-semibold text-gray-800">{cmd.label}</div>
                    {/* <div className="text-xs text-gray-500">{cmd.command}</div> */}
                  </div>
                ))}
              </div>
            )}
        </form>
      </div>
      
      {/* Bottom navigation - ensure nav bar is always at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-10">
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
          className="flex flex-col items-center text-xs w-16 text-primary"
          onClick={() => {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mb-1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </Button>
        
        <Button
          variant="ghost"
          className="flex flex-col items-center text-xs w-16"
          onClick={() => navigate('/track')}
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
