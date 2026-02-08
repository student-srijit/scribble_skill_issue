'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useEffect } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/lobby')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-glow animate-pulse mb-4">Scribble</div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 float-animation">
            <div className="text-7xl md:text-8xl font-bold text-glow text-balance">
              Scribble
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto text-balance leading-relaxed">
            Draw, Guess, and Conquer with Friends in the Ultimate Multiplayer Game!
          </p>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glossy-card p-6 hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-bold text-lg mb-2">Draw Anything</h3>
              <p className="text-sm text-gray-400">Express your creativity and show your drawing skills</p>
            </div>

            <div className="glossy-card p-6 hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">Guess Wisely</h3>
              <p className="text-sm text-gray-400">Rack your brain to guess what others are drawing</p>
            </div>

            <div className="glossy-card p-6 hover:scale-105 transition-transform">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-bold text-lg mb-2">Play Together</h3>
              <p className="text-sm text-gray-400">Challenge your friends and climb the leaderboards</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push('/signup')}
              className="glossy-button px-8 py-4 text-lg font-semibold"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 rounded-full font-semibold text-white border-2 border-purple-500 hover:bg-purple-500/10 transition-colors text-lg"
            >
              Sign In
            </button>
          </div>

          {/* Features List */}
          <div className="glossy-card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-glow mb-6">Why Scribble?</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4">
                <span className="text-2xl">⚡</span>
                <span className="text-gray-300">Real-time multiplayer gameplay with instant feedback</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">🌟</span>
                <span className="text-gray-300">Choose from 11 unique animated characters with custom styles</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">🏆</span>
                <span className="text-gray-300">Compete for points and earn exclusive achievements</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl">🎮</span>
                <span className="text-gray-300">Beautifully designed glossy UI with smooth animations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
