'use client'

import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { user, signOut } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Salita! 🇵🇭</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Logged in as: {user?.email}
        </p>
        <button
          onClick={signOut}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </ProtectedRoute>
  )
}
