// Game scoring and logic utilities

export interface GameScore {
  drawer: number
  guesser: number
  correctGuess: boolean
}

export function calculateScore(
  guess: string,
  prompt: string,
  timeRemaining: number
): number {
  const normalizedGuess = guess.toLowerCase().trim()
  const normalizedPrompt = prompt.toLowerCase()

  // Exact match
  if (normalizedGuess === normalizedPrompt) {
    return Math.max(100 + Math.floor(timeRemaining / 2), 100)
  }

  // Partial match - contains key words
  const promptWords = normalizedPrompt.split(' ')
  const guessWords = normalizedGuess.split(' ')

  let matchCount = 0
  for (const word of promptWords) {
    if (word.length > 2 && guessWords.some(gw => gw.includes(word))) {
      matchCount++
    }
  }

  if (matchCount > 0) {
    const matchRatio = matchCount / promptWords.length
    return Math.floor(50 * matchRatio + timeRemaining / 5)
  }

  return 0
}

export function validateGuess(guess: string, prompt: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim()
  const normalizedPrompt = prompt.toLowerCase()

  if (normalizedGuess === normalizedPrompt) return true

  const promptWords = normalizedPrompt.split(' ').filter(w => w.length > 2)
  const guessWords = normalizedGuess.split(' ')

  const matches = promptWords.filter(word =>
    guessWords.some(gw => gw.includes(word) || word.includes(gw))
  )

  return matches.length >= Math.ceil(promptWords.length / 2)
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  const aLen = a.length
  const bLen = b.length
  if (aLen === 0) return bLen
  if (bLen === 0) return aLen

  const prev = new Array(bLen + 1).fill(0)
  const curr = new Array(bLen + 1).fill(0)

  for (let j = 0; j <= bLen; j += 1) {
    prev[j] = j
  }

  for (let i = 1; i <= aLen; i += 1) {
    curr[0] = i
    const aChar = a[i - 1]
    for (let j = 1; j <= bLen; j += 1) {
      const cost = aChar === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= bLen; j += 1) {
      prev[j] = curr[j]
    }
  }

  return prev[bLen]
}

export function isCloseGuess(guess: string, prompt: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim()
  const normalizedPrompt = prompt.toLowerCase().trim()
  if (!normalizedGuess || !normalizedPrompt) return false
  if (normalizedGuess === normalizedPrompt) return false

  if (Math.abs(normalizedGuess.length - normalizedPrompt.length) > 3) return false

  const distance = levenshteinDistance(normalizedGuess, normalizedPrompt)
  const maxLen = Math.max(normalizedGuess.length, normalizedPrompt.length)
  if (maxLen === 0) return false

  const similarity = 1 - distance / maxLen
  return (distance <= 2 && similarity >= 0.75) || similarity >= 0.82
}

export function getRoundLeaderboard(players: any[], scores: Record<string, number>) {
  return players
    .map(player => ({
      ...player,
      roundScore: scores[player.id] || 0,
    }))
    .sort((a, b) => b.roundScore - a.roundScore)
}

export function updatePlayerScores(
  players: any[],
  roundScores: Record<string, number>
) {
  return players.map(player => ({
    ...player,
    score: (player.score || 0) + (roundScores[player.id] || 0),
  }))
}

export function getAchievements(player: any): string[] {
  const achievements: string[] = []

  if (player.score >= 1000) achievements.push('Art Master')
  if (player.score >= 5000) achievements.push('Drawing Legend')
  if (player.wins >= 5) achievements.push('Serial Winner')
  if (player.wins >= 10) achievements.push('Champion')

  return achievements
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
}

export const ROUND_DURATION = 120 // 2 minutes
export const MAX_PLAYERS_PER_ROOM = 12
export const MIN_PLAYERS_TO_START = 1
