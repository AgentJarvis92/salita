'use client';

import { Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface AIResponse {
  tagalog: string;
  english: string;
  hint: string;
  examples: string[];
  correction?: string;
  note?: string;
  tone: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string; // For user messages
  aiResponse?: AIResponse; // For AI messages
  timestamp: Date;
}

function ChatPageContent() {
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
      avatar: '/avatars/ate-maria-avatar.webp',
    },
    kuya_josh: {
      name: 'Kuya Josh',
      avatar: '/avatars/kuya-josh-avatar.webp',
    },
  };

  const currentPersona = personaInfo[persona as keyof typeof personaInfo] || personaInfo.ate_maria;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Send initial greeting when chat loads
    if (messages.length === 0) {
      handleSendMessage('', true);
    }
  }, []);

  const handleSendMessage = async (text?: string, isInitial?: boolean) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !isInitial) return;

    // Add user message (unless it's initial greeting request)
    if (!isInitial) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
    }

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText || '',
          persona,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response with full structure
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        aiResponse: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error fallback
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        aiResponse: {
          tagalog: 'Sandali lang, may problema ako.',
          english: 'Give me a moment, having trouble.',
          hint: "Sabihin: 'Sige' o 'Okay'",
          examples: ['Sige', 'Okay'],
          tone: 'warm',
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    handleSendMessage(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0f]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            ← Back
          </button>
          <img
            src={currentPersona.avatar}
            alt={currentPersona.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="text-white font-medium">{currentPersona.name}</div>
            <div className="text-white/40 text-sm">
              {isTyping ? 'Typing...' : 'Online'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#D4AF37] text-[#0a0a0f]">
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[85%] space-y-3">
                  {/* AI Response Card */}
                  <div className="rounded-2xl px-4 py-3 bg-white/[0.08] backdrop-blur-sm text-white">
                    {/* Tagalog (Primary) */}
                    <p className="text-[17px] font-semibold leading-relaxed">
                      {msg.aiResponse?.tagalog}
                    </p>
                    
                    {/* English (Secondary) */}
                    <p className="text-[12px] text-white/50 mt-1">
                      {msg.aiResponse?.english}
                    </p>
                  </div>

                  {/* Hint Box */}
                  {msg.aiResponse?.hint && (
                    <div className="rounded-xl px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                      <p className="text-[13px] text-[#D4AF37] italic">
                        {msg.aiResponse.hint}
                      </p>
                    </div>
                  )}

                  {/* Example Buttons */}
                  {msg.aiResponse?.examples && msg.aiResponse.examples.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.aiResponse.examples.map((example, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(example)}
                          className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 text-[14px] transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Correction (if present) */}
                  {msg.aiResponse?.correction && (
                    <div className="rounded-xl px-4 py-2 bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-[13px] text-yellow-200">
                        {msg.aiResponse.correction}
                      </p>
                    </div>
                  )}

                  {/* Cultural Note (if present) */}
                  {msg.aiResponse?.note && (
                    <div className="rounded-xl px-4 py-2 bg-green-500/10 border border-green-500/30">
                      <p className="text-[13px] text-green-200">
                        💡 {msg.aiResponse.note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/[0.08] backdrop-blur-sm rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-[#0a0a0f]/80 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message in English or Tagalog..."
                className="w-full bg-white/[0.08] text-white rounded-3xl px-5 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 placeholder-white/30 backdrop-blur-sm"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="bg-[#D4AF37] text-[#0a0a0f] rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D4AF37]/90 transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/60">Loading chat...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
