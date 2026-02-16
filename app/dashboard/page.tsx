'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  const handlePersonaSelect = (persona: string) => {
    setSelectedPersona(persona);
    // Navigate to chat with selected persona
    router.push(`/chat?persona=${persona}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Main Content */}
      <div className="pb-24 px-4 pt-8 max-w-[430px] mx-auto">
        {/* Greeting */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Kumusta, {user.email?.split('@')[0] || 'Kevin'}
        </p>

        {/* Headline */}
        <h1 className="text-3xl font-bold mb-2">MEET YOUR AI</h1>
        <p className="text-sm text-gray-400 mb-8">
          Start a conversation and learn naturally with an advanced persona.
        </p>

        {/* AI Persona Cards */}
        <div className="space-y-4 mb-8">
          {/* Ate Maria Card */}
          <button
            onClick={() => handlePersonaSelect('ate_maria')}
            className="w-full text-left rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-blue-900/40 p-6 shadow-lg hover:shadow-xl transition-shadow relative group"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full flex-shrink-0 overflow-hidden">
                <img 
                  src="/avatars/ate-maria.png" 
                  alt="Ate Maria"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded">
                    PATIENT & WARM
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-1">Ate Maria</h2>
                <p className="text-sm text-gray-300">
                  Patient and warm. Specializes in Tagalog basics and culture nuances.
                </p>
              </div>
            </div>
          </button>

          {/* Kuya Josh Card */}
          <button
            onClick={() => handlePersonaSelect('kuya_josh')}
            className="w-full text-left rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 p-6 shadow-lg hover:shadow-xl transition-shadow relative group"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full flex-shrink-0 overflow-hidden">
                <img 
                  src="/avatars/kuya-josh.png" 
                  alt="Kuya Josh"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-600/30 text-gray-200 px-2 py-0.5 rounded">
                    CONVERSATIONAL
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-1">Kuya Josh</h2>
                <p className="text-sm text-gray-300">
                  Casual and relatable. Helps with everyday slang and daily life topics.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Recent Activity
          </h3>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Continue Learning</p>
                <p className="text-xs text-gray-400">Market bargaining basics</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center hover:bg-yellow-500 transition-colors">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 4.3L12 10l-5.7 5.7 1.4 1.4L15 10 7.7 2.9 6.3 4.3z" />
                </svg>
              </button>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-600 w-1/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f14] border-t border-gray-800 max-w-[430px] mx-auto">
        <div className="flex items-center justify-around h-16">
          {/* Home */}
          <button className="flex flex-col items-center gap-1 text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs">Home</span>
          </button>

          {/* Chat */}
          <button className="flex flex-col items-center gap-1 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Chat</span>
          </button>

          {/* Profile */}
          <button className="flex flex-col items-center gap-1 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
