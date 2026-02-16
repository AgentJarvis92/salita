'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tagalog?: string;
  english?: string;
  hint?: string;
  examples?: string[];
  timestamp: Date;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const persona = searchParams.get('persona') || 'ate_maria';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const personaInfo = {
    ate_maria: {
      name: 'Ate Maria',
      status: 'Online',
      avatar: 'blue'
    },
    kuya_josh: {
      name: 'Kuya Josh',
      status: 'Online',
      avatar: 'gray'
    }
  };

  const currentPersona = personaInfo[persona as keyof typeof personaInfo] || personaInfo.ate_maria;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Send initial greeting from AI
    if (user && messages.length === 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(async () => {
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: 'Hi, I want to learn Tagalog',
                persona,
              }),
            });
            
            const data = await response.json();
            setIsTyping(false);
            
            if (response.ok) {
              setMessages([{
                id: '1',
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
              }]);
            }
          } catch (error) {
            setIsTyping(false);
            console.error('Initial greeting error:', error);
          }
        }, 500);
      }, 500);
    }
  }, [user, messages.length, persona]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    
    // Call OpenAI API
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          persona,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setIsTyping(false);
      console.error('Chat error:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <div className="bg-[#0f0f14]/80 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3 flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
          currentPersona.avatar === 'blue' 
            ? 'from-blue-400 to-purple-500' 
            : 'from-gray-500 to-gray-700'
        }`} />

        {/* Name & Status */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold">{currentPersona.name}</h2>
          <p className="text-xs text-gray-400">{currentPersona.status}</p>
        </div>

        {/* Menu */}
        <button className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Timestamp */}
        <div className="text-center">
          <span className="text-xs text-gray-500">TODAY, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {messages.map((message, idx) => (
          <div key={message.id}>
            {message.role === 'assistant' ? (
              // AI Message
              <div className="flex gap-2 items-start">
                {idx === 0 || messages[idx - 1]?.role !== 'assistant' ? (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br flex-shrink-0 ${
                    currentPersona.avatar === 'blue' 
                      ? 'from-blue-400 to-purple-500' 
                      : 'from-gray-500 to-gray-700'
                  }`} />
                ) : (
                  <div className="w-8" />
                )}
                
                <div className="flex-1 max-w-[75%]">
                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl rounded-tl-sm p-4 shadow-lg">
                    {/* Tagalog */}
                    {message.tagalog && (
                      <p className="text-base mb-2">{message.tagalog}</p>
                    )}
                    
                    {/* English Translation */}
                    {message.english && (
                      <p className="text-sm text-gray-400">{message.english}</p>
                    )}
                    
                    {/* Hint */}
                    {message.hint && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <p className="text-sm text-yellow-400 italic">{message.hint}</p>
                      </div>
                    )}
                  </div>

                  {/* Example Buttons */}
                  {message.examples && message.examples.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.examples.map((example, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(example)}
                          className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-sm rounded-full border border-gray-700 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // User Message
              <div className="flex justify-end">
                <div className="max-w-[75%] bg-gray-700/50 rounded-2xl rounded-tr-sm p-4">
                  <p className="text-base">{message.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2 items-start">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
              currentPersona.avatar === 'blue' 
                ? 'from-blue-400 to-purple-500' 
                : 'from-gray-500 to-gray-700'
            }`} />
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl rounded-tl-sm p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#0f0f14]/80 backdrop-blur-sm border-t border-gray-800/50 p-4">
        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800/60 text-white placeholder-gray-500 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-600/50"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
