'use client'

import Image from 'next/image'
import { CHARACTERS } from '@/lib/auth'

interface LeaderboardEntry {
  id: string
  name: string
  character: string
  score: number
  wins: number
  rank: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  compact?: boolean
}

export function Leaderboard({ entries, compact = false }: LeaderboardProps) {
  const sortedEntries = [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }))

  return (
    <div className="glossy-card overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-glow">Leaderboard</h2>
      </div>

      <div className="divide-y divide-white/5">
        {sortedEntries.slice(0, compact ? 5 : entries.length).map((entry) => {
          const charData = CHARACTERS.find(c => c.id === entry.character)
          const medalEmoji = {
            1: '🥇',
            2: '🥈',
            3: '🥉',
          }[entry.rank as 1 | 2 | 3] || `#${entry.rank}`

          return (
            <div
              key={entry.id}
              className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4"
            >
              <div className="text-2xl font-bold w-8 text-center">{medalEmoji}</div>

              <div className="flex-1 flex items-center gap-3">
                {charData && (
                  <Image
                    src={charData.image || "/placeholder.svg"}
                    alt={charData.name}
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{entry.name}</p>
                  <p className="text-xs text-gray-400">{charData?.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg text-purple-400">{entry.score}</p>
                <p className="text-xs text-gray-400">{entry.wins} wins</p>
              </div>
            </div>
          )
        })}
      </div>

      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          No leaderboard data yet
        </div>
      )}
    </div>
  )
}
