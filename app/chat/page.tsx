'use client';

import { Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useVoice } from '@/lib/voice-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import MicButton from '@/components/voice/MicButton';
import VoiceToggle from '@/components/voice/VoiceToggle';
import ChatBubble from '@/components/chat/ChatBubble';
import { synthesizeAndPlay } from '@/lib/speech/tts';

interface AIResponse {
  tagalog: string;
  correction: string;
  hint: string | null;
  tone: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  aiResponse?: AIResponse;
  timestamp: Date;
}

function ChatPageContent() {
  const { user, loading } = useAuth();
  const { voiceEnabled } = useVoice();
  const router = useRouter();
  const searchParams = useSearchParams();
  const persona = searchParams.get('persona') || 'ate_maria';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayedGreeting = useRef(false);

  const personaInfo = {
    ate_maria: {
      name: 'Ate Maria',
      avatar: '/avatars/ate-maria-avatar.webp',
      subtitle: 'Beginner Mode',
    },
    kuya_josh: {
      name: 'Kuya Josh',
      avatar: '/avatars/kuya-josh-avatar.webp',
      subtitle: 'Heritage Mode',
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

  // Auto-play greeting via TTS when first AI message arrives
  useEffect(() => {
    if (
      voiceEnabled &&
      !hasAutoPlayedGreeting.current &&
      messages.length === 1 &&
      messages[0].role === 'assistant' &&
      messages[0].aiResponse?.tagalog
    ) {
      hasAutoPlayedGreeting.current = true;
      synthesizeAndPlay(messages[0].aiResponse.tagalog).catch(() => {
        // Silently fail - autoplay may be blocked
      });
    }
  }, [messages, voiceEnabled]);

  const handleSendMessage = async (text?: string, isInitial?: boolean) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !isInitial) return;

    // Hide onboarding once user sends a message
    if (!isInitial) {
      setShowOnboarding(false);
    }

    if (!isInitial) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
    }

    setIsTyping(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        aiResponse: msg.aiResponse
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText || '',
          persona,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        aiResponse: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Auto-play new AI messages if voice is enabled
      if (voiceEnabled && data.response?.tagalog) {
        synthesizeAndPlay(data.response.tagalog).catch(() => {});
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        aiResponse: {
          tagalog: 'Sandali lang, may problema ako.',
          correction: 'None',
          hint: persona === 'kuya_josh' ? null : "Give me a moment, having trouble. Try saying: 'Sige' or 'Okay'",
          tone: persona === 'kuya_josh' ? 'casual' : 'warm',
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    if (text.trim()) {
      handleSendMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
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
          <div className="flex-1">
            <div className="text-white font-medium">{currentPersona.name}</div>
            <div className="text-white/40 text-sm">
              {isTyping ? 'Typing...' : currentPersona.subtitle}
            </div>
          </div>
          {/* Voice Toggle */}
          <VoiceToggle />
        </div>
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Onboarding Voice Moment */}
          {showOnboarding && messages.length <= 1 && (
            <div className="flex flex-col items-center py-8 animate-fade-in">
              <MicButton
                onTranscription={handleVoiceTranscription}
                variant="onboarding"
              />
              <p className="text-white/30 text-xs mt-4">or type below</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              aiResponse={msg.aiResponse}
              mode={persona === 'kuya_josh' ? 'heritage' : 'beginner'}
            />
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div 
                className="rounded-2xl px-4 py-3 border border-white/5 backdrop-blur-md"
                style={{ backgroundColor: 'rgba(30, 58, 95, 0.25)' }}
              >
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

      {/* Input - Fixed at Bottom */}
      <div className="flex-shrink-0 bg-[#0a0a0f]/95 backdrop-blur-sm border-t border-white/5 pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {/* Inline Mic Button */}
            <MicButton
              onTranscription={handleVoiceTranscription}
              variant="inline"
            />
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message in English or Tagalog"
                className="w-full bg-white/[0.08] text-white rounded-3xl px-5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 placeholder-white/30 backdrop-blur-sm max-h-[120px]"
                rows={1}
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
