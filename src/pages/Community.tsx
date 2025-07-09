import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { fadeInUp, staggerContainer } from '@/lib/animations';

type BlogPost = {
  id: string;
  title: string;
  author: string;
  authorInitial: string;
  age: number;
  content: string;
  duration: string;
  datePosted: string;
  readTime: string;
  comments: number;
  tags: string[];
  relatedPlan?: {
    name: string;
    participants: number;
  };
};

export default function CommunityPage() {
  const [, navigate] = useLocation();

  // AUTH GUARD: Redirect to /auth if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);
  const [activeTab, setActiveTab] = useState('blogs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Popular tags for filtering
  const popularTags = ['Sleep', 'Hot Flashes', 'Anxiety', 'Nutrition', 'Exercise', 'Mood'];

  // Sample groups data
  const groups = [
    {
      id: 'g1',
      name: 'Sleep Support',
      icon: '😴',
      description: 'A group for sharing sleep tips and support during menopause.',
      members: 120,
      created: 'Jan 2024',
      tags: ['Sleep', 'Insomnia'],
    },
    {
      id: 'g2',
      name: 'Hot Flash Warriors',
      icon: '🔥',
      description: 'Connect with others experiencing hot flashes and share remedies.',
      members: 98,
      created: 'Feb 2024',
      tags: ['Hot Flashes', 'Diet'],
    },
    {
      id: 'g3',
      name: 'Mindful Mood',
      icon: '🧘‍♀️',
      description: 'Discuss mood swings, mindfulness, and mental health.',
      members: 76,
      created: 'Mar 2024',
      tags: ['Mood', 'Mental Health'],
    },
    {
      id: 'g4',
      name: 'Nutrition Circle',
      icon: '🥗',
      description: 'Share recipes and nutrition tips for menopause wellness.',
      members: 63,
      created: 'Apr 2024',
      tags: ['Nutrition', 'Diet'],
    },
    {
      id: 'g5',
      name: 'Active Living',
      icon: '🏃‍♀️',
      description: 'Motivation and ideas for staying active and energized.',
      members: 84,
      created: 'May 2024',
      tags: ['Exercise', 'Energy'],
    },
  ];

  // Filter groups based on search and tags
  const getFilteredGroups = () => {
    let filtered = groups;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        group =>
          group.name.toLowerCase().includes(query) ||
          group.description.toLowerCase().includes(query) ||
          group.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        group => selectedTags.some(tag => group.tags.includes(tag))
      );
    }
    return filtered;
  };
  const filteredGroups = getFilteredGroups();

  // Sample blog posts data
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Goodbye Insomnia',
      author: 'Maria J.',
      authorInitial: 'M',
      age: 54,
      content: 'My journey to better sleep through lifestyle changes and mindfulness',
      duration: '4 weeks',
      datePosted: 'Feb 15',
      readTime: '4 min read',
      comments: 36,
      tags: ['Sleep', 'Insomnia', 'Mindfulness'],
      relatedPlan: {
        name: 'Better Sleep Plan',
        participants: 40
      }
    },
    {
      id: '2',
      title: 'Cooling the Fire Within',
      author: 'Maria J.',
      authorInitial: 'M',
      age: 54,
      content: 'How I reduced hot flashes by 70% using diet and environment changes',
      duration: '6 weeks',
      datePosted: 'Feb 22',
      readTime: '5 min read',
      comments: 42,
      tags: ['Hot Flashes', 'Diet', 'Environment'],
      relatedPlan: {
        name: 'Hot Flash Relief Plan',
        participants: 124
      }
    },
    {
      id: '3',
      title: 'Mind Over Menopause',
      author: 'Lisa T.',
      authorInitial: 'L',
      age: 49,
      content: 'My strategies for combating brain fog and improving cognitive function',
      duration: '5 weeks',
      datePosted: 'Mar 5',
      readTime: '6 min read',
      comments: 28,
      tags: ['Brain Fog', 'Cognitive', 'Mental Health']
    },
    {
      id: '4',
      title: 'Finding My Energy Again',
      author: 'Sarah P.',
      authorInitial: 'S',
      age: 52,
      content: 'How I overcame fatigue and found renewed energy through small lifestyle changes',
      duration: '8 weeks',
      datePosted: 'Mar 10',
      readTime: '7 min read',
      comments: 19,
      tags: ['Fatigue', 'Energy', 'Exercise']
    },
    {
      id: '5',
      title: 'Embracing the New Me',
      author: 'Jennifer R.',
      authorInitial: 'J',
      age: 56,
      content: 'My journey of acceptance and self-discovery during menopause',
      duration: '12 weeks',
      datePosted: 'Mar 18',
      readTime: '8 min read',
      comments: 45,
      tags: ['Self-Care', 'Mental Health', 'Identity']
    }
  ];
  
  // Discussions forum posts
  const discussionTopics = [
    {
      id: 'd1',
      title: 'What works for your night sweats?',
      author: 'Caroline M.',
      authorInitial: 'C',
      datePosted: 'Yesterday',
      replies: 24,
      tags: ['Night Sweats', 'Sleep']
    },
    {
      id: 'd2',
      title: 'Anyone else experiencing increased anxiety?',
      author: 'Beth S.',
      authorInitial: 'B',
      datePosted: '2 days ago',
      replies: 37,
      tags: ['Anxiety', 'Mental Health']
    },
    {
      id: 'd3',
      title: 'Best natural remedies for hot flashes',
      author: 'Dana W.',
      authorInitial: 'D',
      datePosted: '3 days ago',
      replies: 42,
      tags: ['Hot Flashes', 'Natural Remedies']
    }
  ];
  
  // My content for the "My Content" tab
  const myContent = [
    {
      id: 'mc1',
      title: 'My experience with CBT for sleep',
      type: 'blog',
      datePosted: 'Feb 28',
      interactions: 15,
      status: 'published'
    },
    {
      id: 'mc2',
      title: 'Question about HRT and anxiety',
      type: 'discussion',
      datePosted: 'Mar 12',
      interactions: 8,
      status: 'active'
    }
  ];
  
  // Toggle a tag filter
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Filter blog posts based on search and tags
  const getFilteredPosts = () => {
    let filtered = blogPosts;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        post => 
          post.title.toLowerCase().includes(query) || 
          post.content.toLowerCase().includes(query) ||
          post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        post => selectedTags.some(tag => post.tags.includes(tag))
      );
    }
    
    return filtered;
  };
  
  const filteredPosts = getFilteredPosts();
  
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="p-4">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-4">Community</h1>
        
        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-[#FFD7D0]/50 p-1 rounded-full">
            {/* Temporarily disable “Discussions” and introduce “Groups” */}
            {/* <TabsTrigger 
              value="discussions" 
              className={`rounded-full ${activeTab === 'discussions' ? 'bg-[#F26158] text-white' : ''}`}
            >
              Discussions
            </TabsTrigger> */}
            <TabsTrigger 
              value="groups" 
              className={`rounded-full ${activeTab === 'groups' ? 'bg-[#F26158] text-white' : ''}`}
            >
              Groups
            </TabsTrigger>
            <TabsTrigger 
              value="blogs" 
              className={`rounded-full ${activeTab === 'blogs' ? 'bg-[#FFE18B] text-black' : ''}`}
            >
              Blogs
            </TabsTrigger>
            <TabsTrigger 
              value="my-content" 
              className={`rounded-full ${activeTab === 'my-content' ? 'bg-[#F26158] text-white' : ''}`}
            >
              My Content
            </TabsTrigger>
          </TabsList>
          
          {/* Discussions Tab (temporarily disabled) */}
          {/* <TabsContent value="discussions">
            <div className="space-y-4">
              <Input
                placeholder="Search discussions..."
                className="w-full mb-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Latest Topics</h2>
                <Button 
                  size="sm" 
                  className="bg-[#F26158] hover:bg-[#F26158]/90 text-white rounded-full"
                >
                  New Topic
                </Button>
              </div>
              
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {discussionTopics.map((topic) => (
                  <motion.div key={topic.id} variants={fadeInUp}>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD7D0] flex items-center justify-center text-[#F26158] font-bold">
                            {topic.authorInitial}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{topic.title}</h3>
                            <div className="flex text-xs text-gray-500 gap-2 mt-1">
                              <span>{topic.author}</span>
                              <span>•</span>
                              <span>{topic.datePosted}</span>
                              <span>•</span>
                              <span>{topic.replies} replies</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {topic.tags.map((tag) => (
                                <span 
                                  key={tag} 
                                  className="bg-[#FFE18B]/80 text-xs px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
              
              <Button
                variant="outline"
                className="w-full border-[#F26158] text-[#F26158] hover:bg-[#F26158]/10 mt-2"
              >
                View More Topics
              </Button>
            </div>
          </TabsContent> */}
          
          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="space-y-4">
              <Input
                placeholder="Search groups..."
                className="w-full bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Popular Tags</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-xs"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                  }}
                >
                  Clear Filters
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {popularTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className={`rounded-full text-xs px-3 py-1 h-auto ${selectedTags.includes(tag) ? 'bg-[#F26158] text-white' : 'bg-transparent border-gray-300 text-gray-700'}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {filteredGroups.map((group) => (
                  <motion.div key={group.id} variants={fadeInUp}>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD7D0] flex items-center justify-center text-[#F26158] font-bold">
                            G
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg">{group.name}</h3>
                              <span className="text-sm">{group.members} members</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="bg-[#CBE2EA]/50 text-xs px-2 py-1 rounded-full">
                                Created: {group.created}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{group.description}</p>
                            <div className="flex text-xs text-gray-500 gap-2 mt-2">
                              {group.tags.map((tag) => (
                                <span key={tag} className="bg-[#FFE18B]/80 px-2 py-1 rounded-full text-xs">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No groups found matching your criteria.</p>
                    <Button
                      variant="link"
                      className="text-[#F26158] mt-2"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTags([]);
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </TabsContent>
          
          {/* Blogs Tab */}
          <TabsContent value="blogs">
            <div className="space-y-4">
              <Input
                placeholder="Search blogs..."
                className="w-full bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Popular Tags</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex items-center text-xs"
                >
                  Filter
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                  </svg>
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {popularTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className={`rounded-full text-xs px-3 py-1 h-auto ${
                      selectedTags.includes(tag)
                        ? 'bg-[#FFE18B] border-[#FFE18B] text-black'
                        : 'bg-transparent border-gray-300 text-gray-700'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {filteredPosts.map((post) => (
                  <motion.div key={post.id} variants={fadeInUp}>
                    <Card className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFD7D0] flex items-center justify-center text-[#F26158] font-bold">
                            {post.authorInitial}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg">{post.title}</h3>
                              <span className="text-sm">{post.author}</span>
                            </div>
                            
                            <div className="flex gap-2 mt-1">
                              <span className="bg-[#CBE2EA]/50 text-xs px-2 py-1 rounded-full">
                                Duration: {post.duration}
                              </span>
                              <span className="bg-[#FFD7D0]/50 text-xs px-2 py-1 rounded-full">
                                Age: {post.age}
                              </span>
                            </div>
                            
                            <p className="text-sm mt-2">{post.content}</p>
                            
                            <div className="flex text-xs text-gray-500 gap-2 mt-2">
                              <span>{post.datePosted}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                              <span>•</span>
                              <span>{post.comments} comments</span>
                            </div>
                            
                            {post.relatedPlan && (
                              <div className="flex justify-between items-center mt-2 text-xs">
                                <div className="flex items-center">
                                  <span className="text-gray-500 mr-1">Related:</span>
                                  <span className="text-[#F26158]">
                                    {post.relatedPlan.name} • {post.relatedPlan.participants} participants
                                  </span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F26158]">
                                  <path d="M5 12h14"/>
                                  <path d="m12 5 7 7-7 7"/>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {filteredPosts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No posts found matching your criteria.</p>
                    <Button 
                      variant="link" 
                      className="text-[#F26158] mt-2"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedTags([]);
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </TabsContent>
          
          {/* My Content Tab */}
          <TabsContent value="my-content">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Content</h2>
                <Button 
                  size="sm" 
                  className="bg-[#F26158] hover:bg-[#F26158]/90 text-white rounded-full"
                >
                  Create New
                </Button>
              </div>
              
              {myContent.length > 0 ? (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {myContent.map((item) => (
                    <motion.div key={item.id} variants={fadeInUp}>
                      <Card className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <div className="flex text-xs text-gray-500 gap-2 mt-1">
                                <span>{item.type}</span>
                                <span>•</span>
                                <span>{item.datePosted}</span>
                                <span>•</span>
                                <span>{item.interactions} {item.type === 'blog' ? 'comments' : 'replies'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs h-8"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs h-8 text-[#F26158] border-[#F26158]"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">You haven't created any content yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Share your experience or ask questions to connect with others</p>
                  <Button
                    className="bg-[#F26158] hover:bg-[#F26158]/90 text-white"
                  >
                    Create Your First Post
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
          className="flex flex-col items-center text-xs w-16 text-[#F26158]"
          onClick={() => {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F26158] mb-1">
            <path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 7 6 13 6 13s6-6 6-13Z"/>
            <circle cx="12" cy="8" r="2"/>
          </svg>
          Community
        </Button>
      </div>
    </div>
  );
}