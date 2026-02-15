'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { user, signOut } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        {/* Header */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇵🇭</span>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Salita</h1>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
              Kumusta, {user?.email?.split('@')[0]}! 👋
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Ready to learn Tagalog by talking? Choose your tutor below to get started.
            </p>
          </div>

          {/* Coming Soon - Phase 3 */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
              Persona Selection Coming Soon
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              You'll be able to choose between Ate Maria and Kuya Josh as your AI tutor.
            </p>
            
            {/* Preview Cards */}
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-6">
                <div className="text-4xl mb-2">👩‍🏫</div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Ate Maria</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Warm, encouraging, family-oriented
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="text-4xl mb-2">😎</div>
                <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Kuya Josh</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Casual, Taglish, friendly, playful
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Phase 3 - In Development
            </p>
          </div>

          {/* What's Next Info */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
              🎯 What happens next?
            </h4>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
              <li>✅ <strong>Phase 1 Complete:</strong> Authentication working</li>
              <li>✅ <strong>Phase 2 Complete:</strong> Database + analytics ready</li>
              <li>🚧 <strong>Phase 3 Next:</strong> Choose your AI tutor</li>
              <li>⏳ <strong>Phase 4:</strong> Chat interface</li>
              <li>⏳ <strong>Phase 5:</strong> AI conversation engine</li>
            </ul>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
