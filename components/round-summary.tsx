'use client'

import Image from 'next/image'
import { CHARACTERS } from '@/lib/auth'

interface RoundSummaryEntry {
  id: string
  name: string
  character: string
  roundScore: number
  guessed: boolean
}

interface RoundSummaryProps {
  prompt: string
  entries: RoundSummaryEntry[]
  drawerName: string
  onContinue: () => void
  currentRound: number
  maxRounds: number
}

export function RoundSummary({
  prompt,
  entries,
  drawerName,
  onContinue,
  currentRound,
  maxRounds,
}: RoundSummaryProps) {
  const sortedEntries = [...entries].sort((a, b) => b.roundScore - a.roundScore)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glossy-card max-w-2xl w-full max-h-96 overflow-y-auto card-pop">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-glow mb-2">Round {currentRound} Results</h2>
            <p className="text-gray-400 mb-4">The answer was:</p>
            <p className="text-3xl font-bold text-purple-400 mb-2">{prompt}</p>
            <p className="text-sm text-gray-400">Drawn by <span className="font-semibold text-white">{drawerName}</span></p>
          </div>

          {/* Scores */}
          <div className="space-y-3 mb-8">
            {sortedEntries.map((entry, idx) => {
              const charData = CHARACTERS.find(c => c.id === entry.character)
              const position = idx + 1
              const medalEmoji = ['🥇', '🥈', '🥉'][idx] || ''

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="text-2xl w-6 text-center">{medalEmoji}</div>

                  <div className="flex-1 flex items-center gap-3">
                    {charData && (
                      <Image
                        src={charData.image || "/placeholder.svg"}
                        alt={charData.name}
                        width={40}
                        height={40}
                        className="w-10 h-10"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{entry.name}</p>
                      {entry.guessed && (
                        <p className="text-xs text-green-400">Guessed correctly!</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">{entry.roundScore}</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Round {currentRound} of {maxRounds}
            </p>
            {currentRound < maxRounds ? (
              <button onClick={onContinue} className="glossy-button py-2 px-6">
                Next Round
              </button>
            ) : (
              <button onClick={onContinue} className="glossy-button py-2 px-6">
                View Final Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
