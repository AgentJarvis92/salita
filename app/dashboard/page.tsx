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
    router.push(`/chat?persona=${persona}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Main Content */}
      <div className="pb-24 px-4 pt-8 max-w-[430px] mx-auto">
        {/* Greeting */}
        <p className="text-xs text-[#D4AF37] uppercase tracking-wider mb-2">
          KUMUSTA, {user.email?.split('@')[0]?.toUpperCase() || 'KEVIN'}
        </p>

        {/* Headline - Updated */}
        <h1 className="text-3xl font-bold mb-2">Start Speaking Tagalog</h1>
        <p className="text-sm text-gray-400 mb-6">
          Practice naturally with a mentor who understands your journey.
        </p>

        {/* AI Persona Cards */}
        <div className="space-y-3 mb-6">
          {/* Ate Maria Card - BEGINNER */}
          <button
            onClick={() => handlePersonaSelect('ate_maria')}
            className="w-full text-left rounded-2xl overflow-hidden relative h-[145px] group hover:scale-[1.02] transition-transform"
          >
            {/* Background Image - centered portrait */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/avatars/ate-maria-portrait.webp)',
                backgroundPosition: '65% center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
              }}
            />
            
            {/* Gradient Overlay - lighter, only dims where text sits */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.00) 100%)'
              }}
            />
            
            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-4">
              <div className="inline-block self-start mb-1.5">
                <div className="bg-[#D4AF37] text-black text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full">
                  BEGINNER
                </div>
              </div>
              <h2 className="text-xl font-bold mb-0.5">Ate Maria</h2>
              <p className="text-[11px] text-gray-300 leading-snug">
                Start from zero. Clear English guidance. Gentle, patient support.
              </p>
            </div>
          </button>

          {/* Kuya Josh Card - HERITAGE */}
          <button
            onClick={() => handlePersonaSelect('kuya_josh')}
            className="w-full text-left rounded-2xl overflow-hidden relative h-[145px] group hover:scale-[1.02] transition-transform"
          >
            {/* Background Image - centered portrait */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/avatars/kuya-josh-portrait.webp)',
                backgroundPosition: '65% center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
              }}
            />
            
            {/* Gradient Overlay - lighter, only dims where text sits */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.00) 100%)'
              }}
            />
            
            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-4">
              <div className="inline-block self-start mb-1.5">
                <div className="bg-[#D4AF37] text-black text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full">
                  HERITAGE
                </div>
              </div>
              <h2 className="text-xl font-bold mb-0.5">Kuya Josh</h2>
              <p className="text-[11px] text-gray-300 leading-snug">
                You understand it. Let's help you speak it confidently.
              </p>
            </div>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="bg-white/[0.03] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Continue Learning</p>
              <p className="text-sm text-gray-400">Market bargaining basics</p>
              {/* Progress bar */}
              <div className="mt-2 h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#D4AF37] rounded-full" />
              </div>
            </div>
            <button className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/80 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-[430px] mx-auto px-8 py-4 flex justify-around">
          <button className="flex flex-col items-center gap-1 text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/40">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/40">
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
