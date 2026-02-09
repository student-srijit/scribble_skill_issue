'use client'

import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Leaderboard } from '@/components/leaderboard'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface GameResult {
  roomCode: string
  players: Array<{
    id: string
    name: string
    character: string
    score: number
    wins: number
  }>
  rounds: number
  winner: string
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { user, isLoading } = useAuth()
  const [result, setResult] = useState<GameResult | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!roomCode) return
    setIsFetching(true)
    setError('')
    fetch(`/api/results/${roomCode}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to load results')
        }
        return res.json()
      })
      .then(data => {
        setResult(data.results as GameResult)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load results')
      })
      .finally(() => setIsFetching(false))
  }, [user, isLoading, router, roomCode])

  const winner = result?.players[0]?.name

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-glow mb-2">Game Over!</h1>
          {winner && (
            <div className="glossy-card p-6 mb-8 card-pop">
              <p className="text-gray-400 mb-2">Winner</p>
              <p className="text-4xl font-bold text-purple-400">{winner} 🏆</p>
            </div>
          )}
        </div>

        {/* Final Leaderboard */}
        {error && (
          <div className="glossy-card p-6 text-center text-red-300 mb-6">
            {error}
          </div>
        )}
        {isFetching && (
          <div className="glossy-card p-6 text-center text-gray-300 mb-6">
            Loading results...
          </div>
        )}
        {result && <Leaderboard entries={result.players} />}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <div className="glossy-card p-6 text-center">
            <p className="text-gray-400 mb-2">Rounds Played</p>
            <p className="text-4xl font-bold text-purple-400">{result?.rounds || 0}</p>
          </div>
          <div className="glossy-card p-6 text-center">
            <p className="text-gray-400 mb-2">Total Players</p>
            <p className="text-4xl font-bold text-pink-400">{result?.players.length || 0}</p>
          </div>
          <div className="glossy-card p-6 text-center">
            <p className="text-gray-400 mb-2">Room Code</p>
            <p className="text-2xl font-mono font-bold text-cyan-400">{roomCode}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/lobby" className="glossy-button py-3 px-8">
            Return to Lobby
          </Link>
          <button
            onClick={() => router.push('/lobby')}
            className="px-8 py-3 rounded-full font-semibold text-white border-2 border-purple-500 hover:bg-purple-500/10 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
