import { NextRequest, NextResponse } from 'next/server'
import { calculateScore, validateGuess, isCloseGuess, ROUND_DURATION, MIN_PLAYERS_TO_START } from '@/lib/game-logic'
import { DEFAULT_PROMPTS, generatePromptFromIndex, maskPrompt, PromptItem } from '@/lib/prompts'
import { generateHint, generatePromptIdeas, moderateGuess, generateDrawerClues, generateDrawTip } from '@/lib/groq'

type GameState = 'waiting' | 'choosing' | 'drawing' | 'round-end' | 'finished'

interface PlayerState {
  id: string
  name: string
  character: string
  characterStyle?: {
    accessory: 'none' | 'crown' | 'glasses' | 'cap' | 'halo'
    aura: 'purple' | 'blue' | 'green' | 'orange' | 'pink'
    sparkle: boolean
  }
  score: number
  guessed: boolean
}

interface RoomState {
  roomCode: string
  players: PlayerState[]
  gameState: GameState
  currentDrawer: number
  currentPrompt: PromptItem | null
  wordChoices: PromptItem[]
  usedAnswers: Set<string>
  currentRound: number
  maxRounds: number
  drawDuration: number
  wordChoiceCount: number
  language: 'en' | 'hi'
  teamMode: boolean
  mysteryMode: boolean
  audienceMode: boolean
  dailyChallenge: boolean
  currentTheme: string
  themeMode: 'fixed' | 'random'
  selectedTheme: string
  roundStartedAt: number | null
  choosingStartedAt: number | null
  roundEndedAt: number | null
  guesses: Array<{ player: string; guess: string; correct: boolean }>
  roundScores: Record<string, number>
  teamScores: Record<'A' | 'B', number>
  teams: Record<string, 'A' | 'B'>
  streaks: Record<string, number>
  powerups: Record<string, { reveal: number; freeze: number; double: number; doubleArmed: boolean }>
  drawBonusSeconds: number
  hints: string[]
  drawerClues: string[]
  drawTip: string
  revealCount: number
  drawingData: string | null
  ghostFrames: string[]
  votes: Record<string, string>
  voteCounts: Record<string, number>
  voiceSignals: Array<{ to: string; from: string; signal: any }>
  lastRoundScores: Record<string, number>
  lastPrompt: string
  lastDrawerId: string | null
  promptSeed: number
  promptPool: PromptItem[]
  lastSeen: Record<string, number>
  privateNotices: Record<string, string>
}

const activeRooms = new Map<string, RoomState>()

const THEMES = [
  'Fantasy',
  'Food',
  'Animals',
  'Space',
  'Sports',
  'Countries',
  'Movies',
  'Nature',
  'Objects',
  'Mythical',
  'Ocean',
  'Robots',
  'Retro',
  'Neon',
  'Weather',
]

const PLAYER_INACTIVE_MS = 45000

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase()
}

function isShortDrawable(prompt: PromptItem) {
  const words = prompt.answer.trim().split(/\s+/)
  const letterCount = prompt.answer.replace(/\s+/g, '').length
  return words.length <= 1 && letterCount <= 14
}

function createRoom(roomCode: string): RoomState {
  return {
    roomCode,
    players: [],
    gameState: 'waiting',
    currentDrawer: 0,
    currentPrompt: null,
    wordChoices: [],
    usedAnswers: new Set(),
    currentRound: 0,
    maxRounds: 10,
    drawDuration: ROUND_DURATION,
    wordChoiceCount: 3,
    language: 'en',
    teamMode: false,
    mysteryMode: false,
    audienceMode: false,
    dailyChallenge: false,
    currentTheme: THEMES[0],
    themeMode: 'fixed',
    selectedTheme: THEMES[0],
    roundStartedAt: null,
    choosingStartedAt: null,
    roundEndedAt: null,
    guesses: [],
    roundScores: {},
    teamScores: { A: 0, B: 0 },
    teams: {},
    streaks: {},
    powerups: {},
    drawBonusSeconds: 0,
    hints: [],
    drawerClues: [],
    drawTip: '',
    revealCount: 0,
    drawingData: null,
    ghostFrames: [],
    votes: {},
    voteCounts: {},
    voiceSignals: [],
    lastRoundScores: {},
    lastPrompt: '',
    lastDrawerId: null,
    promptSeed: 0,
    promptPool: [...DEFAULT_PROMPTS],
    lastSeen: {},
    privateNotices: {},
  }
}

function getRoom(roomCode: string) {
  if (!activeRooms.has(roomCode)) {
    activeRooms.set(roomCode, createRoom(roomCode))
  }
  return activeRooms.get(roomCode)!
}

function getDrawer(room: RoomState) {
  return room.players[room.currentDrawer]
}

function setTheme(room: RoomState) {
  if (room.themeMode === 'fixed') {
    room.currentTheme = THEMES.includes(room.selectedTheme) ? room.selectedTheme : THEMES[0]
    return
  }
  const index = Math.floor(Math.random() * THEMES.length)
  room.currentTheme = THEMES[index]
}

function removePlayer(room: RoomState, playerId: string) {
  room.players = room.players.filter(player => player.id !== playerId)
  delete room.lastSeen[playerId]
  delete room.powerups[playerId]
  delete room.teams[playerId]
  delete room.streaks[playerId]
  delete room.votes[playerId]
  delete room.privateNotices[playerId]
}

function touchPlayer(room: RoomState, playerId: string) {
  room.lastSeen[playerId] = Date.now()
}

function pruneInactivePlayers(room: RoomState) {
  const now = Date.now()
  const inactiveIds = Object.entries(room.lastSeen)
    .filter(([, lastSeen]) => now - lastSeen > PLAYER_INACTIVE_MS)
    .map(([playerId]) => playerId)

  inactiveIds.forEach(playerId => removePlayer(room, playerId))

  if (room.currentDrawer >= room.players.length) {
    room.currentDrawer = 0
  }
  if (room.players.length < MIN_PLAYERS_TO_START) {
    room.gameState = 'waiting'
  }
}

function assignTeam(room: RoomState, playerId: string) {
  const countA = Object.values(room.teams).filter(team => team === 'A').length
  const countB = Object.values(room.teams).filter(team => team === 'B').length
  room.teams[playerId] = countA <= countB ? 'A' : 'B'
}

async function ensurePromptPool(room: RoomState, needed: number) {
  const available = room.promptPool.filter(p => !room.usedAnswers.has(normalizeAnswer(p.answer)) && isShortDrawable(p))
  if (available.length >= needed) return

  try {
    const aiPrompts = await generatePromptIdeas(Array.from(room.usedAnswers), 6)
    aiPrompts.forEach((prompt: PromptItem) => {
      if (prompt?.answer && !room.usedAnswers.has(normalizeAnswer(prompt.answer))) {
        room.promptPool.push({
          ...prompt,
          answer: prompt.display || prompt.answer,
          display: prompt.display || prompt.answer,
        })
      }
    })
  } catch {
    // ignore AI errors and fallback
  }

  while (room.promptPool.filter(p => !room.usedAnswers.has(normalizeAnswer(p.answer)) && isShortDrawable(p)).length < needed) {
    const generated = generatePromptFromIndex(room.promptSeed++)
    if (!room.usedAnswers.has(normalizeAnswer(generated.answer))) {
      room.promptPool.push(generated)
    }
  }
}

async function pickWordChoices(room: RoomState, count = room.wordChoiceCount) {
  await ensurePromptPool(room, count)
  const available = room.promptPool.filter(p => !room.usedAnswers.has(normalizeAnswer(p.answer)) && isShortDrawable(p))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  room.wordChoices = shuffled.slice(0, count)
}

function resetRound(room: RoomState) {
  room.guesses = []
  room.roundScores = {}
  room.streaks = {}
  room.votes = {}
  room.voteCounts = {}
  room.drawBonusSeconds = 0
  room.hints = []
  room.drawerClues = []
  room.drawTip = ''
  room.revealCount = 0
  room.drawingData = null
  room.ghostFrames = []
  room.players = room.players.map(player => ({ ...player, guessed: false }))
}

function startDrawing(room: RoomState, prompt: PromptItem) {
  room.currentPrompt = prompt
  room.usedAnswers.add(normalizeAnswer(prompt.answer))
  room.gameState = 'drawing'
  room.roundStartedAt = Date.now()
  room.choosingStartedAt = null
  room.roundEndedAt = null
  room.wordChoices = []
  resetRound(room)
}

function endRound(room: RoomState) {
  room.gameState = 'round-end'
  room.roundEndedAt = Date.now()
  room.lastRoundScores = { ...room.roundScores }
  room.lastPrompt = room.currentPrompt?.display || ''
  room.lastDrawerId = getDrawer(room)?.id || null
  const drawerId = getDrawer(room)?.id
  const correctCount = room.players.filter(player => player.id !== drawerId && player.guessed).length
  if (drawerId) {
    const drawerBonus = 50 + correctCount * 30
    room.lastRoundScores[drawerId] = (room.lastRoundScores[drawerId] || 0) + drawerBonus
  }
  if (room.teamMode) {
    room.teamScores = { A: 0, B: 0 }
    room.players.forEach(player => {
      const team = room.teams[player.id]
      if (team) {
        room.teamScores[team] += room.lastRoundScores[player.id] || 0
      }
    })
  }
  room.players = room.players.map(player => ({
    ...player,
    score: player.score + (room.lastRoundScores[player.id] || 0),
  }))
  room.roundStartedAt = null
}

function getTimeLeft(room: RoomState) {
  if (!room.roundStartedAt) return 0
  const elapsed = Math.floor((Date.now() - room.roundStartedAt) / 1000)
  return Math.max(room.drawDuration + room.drawBonusSeconds - elapsed, 0)
}

async function handleRoundTimeout(room: RoomState) {
  if (room.gameState === 'drawing' && getTimeLeft(room) <= 0) {
    endRound(room)
  }
}

async function handleChoosingTimeout(room: RoomState) {
  if (room.gameState !== 'choosing' || !room.choosingStartedAt) return
  const elapsed = Math.floor((Date.now() - room.choosingStartedAt) / 1000)
  if (elapsed >= 12 && room.wordChoices.length > 0) {
    startDrawing(room, room.wordChoices[0])
  }
}

async function autoAdvanceRound(room: RoomState) {
  if (room.gameState !== 'round-end' || !room.roundEndedAt) return
  const elapsed = Math.floor((Date.now() - room.roundEndedAt) / 1000)
  if (elapsed < 5) return
  if (room.currentRound >= room.maxRounds) {
    room.gameState = 'finished'
    return
  }
  room.currentRound += 1
  room.currentDrawer = room.players.length ? (room.currentDrawer + 1) % room.players.length : 0
  room.gameState = 'choosing'
  room.choosingStartedAt = Date.now()
  setTheme(room)
  await pickWordChoices(room)
}

export async function GET(request: NextRequest) {
  const roomCode = request.nextUrl.searchParams.get('room')
  const userId = request.nextUrl.searchParams.get('user')

  if (!roomCode || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const room = getRoom(roomCode)

  if (room.players.some(player => player.id === userId)) {
    touchPlayer(room, userId)
  }
  pruneInactivePlayers(room)

  await handleRoundTimeout(room)
  await handleChoosingTimeout(room)
  await autoAdvanceRound(room)

  const isDrawer = getDrawer(room)?.id === userId
  const currentPrompt = room.currentPrompt
  const maskedPrompt = currentPrompt
    ? maskPrompt(currentPrompt.answer, room.revealCount)
    : ''
  const voiceSignals = room.voiceSignals.filter(signal => signal.to === userId)
  if (voiceSignals.length > 0) {
    room.voiceSignals = room.voiceSignals.filter(signal => signal.to !== userId)
  }
  const privateNotice = room.privateNotices[userId] || null
  if (privateNotice) {
    delete room.privateNotices[userId]
  }

  return NextResponse.json({
    success: true,
    state: {
      roomCode: room.roomCode,
      players: room.players,
      gameState: room.gameState,
      currentDrawer: room.currentDrawer,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      drawDuration: room.drawDuration,
      wordChoiceCount: room.wordChoiceCount,
      language: room.language,
      teamMode: room.teamMode,
      mysteryMode: room.mysteryMode,
      audienceMode: room.audienceMode,
      dailyChallenge: room.dailyChallenge,
      currentTheme: room.currentTheme,
      themeMode: room.themeMode,
      selectedTheme: room.selectedTheme,
      teamScores: room.teamScores,
      teams: room.teams,
      streaks: room.streaks,
      powerups: room.powerups,
      timeLeft: getTimeLeft(room),
      guesses: room.guesses,
      hints: room.hints,
      drawingData: room.drawingData,
      privateNotice,
      maskedPrompt,
      promptDisplay: isDrawer && !room.mysteryMode ? currentPrompt?.display || '' : '',
      drawerClues: isDrawer ? room.drawerClues : [],
      drawTip: isDrawer ? room.drawTip : '',
      wordChoices: isDrawer ? room.wordChoices : [],
      lastRoundScores: room.lastRoundScores,
      lastPrompt: room.lastPrompt,
      lastDrawerId: room.lastDrawerId,
      ghostFrames: room.ghostFrames,
      voteCounts: room.voteCounts,
      voiceSignals,
    },
  })
}

export async function POST(request: NextRequest) {
  const { type, roomCode, userId, data } = await request.json()

  if (!roomCode || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const room = getRoom(roomCode)
  pruneInactivePlayers(room)
  if (room.players.some(player => player.id === userId)) {
    touchPlayer(room, userId)
  }

  switch (type) {
    case 'join': {
      const exists = room.players.some(player => player.id === userId)
      if (!exists) {
        room.players.push({
          id: userId,
          name: data.username,
          character: data.character,
          characterStyle: data.characterStyle,
          score: 0,
          guessed: false,
        })
        if (room.teamMode) {
          assignTeam(room, userId)
        }
        room.powerups[userId] = { reveal: 1, freeze: 1, double: 1, doubleArmed: false }
        touchPlayer(room, userId)
      }
      break
    }

    case 'leave': {
      removePlayer(room, userId)
      if (room.currentDrawer >= room.players.length) {
        room.currentDrawer = 0
      }
      if (room.players.length < MIN_PLAYERS_TO_START) {
        room.gameState = 'waiting'
      }
      break
    }

    case 'start-game': {
      if (room.players.length < MIN_PLAYERS_TO_START) {
        return NextResponse.json({ error: 'Not enough players' }, { status: 400 })
      }
      if (data?.maxRounds) {
        room.maxRounds = Math.min(Math.max(Number(data.maxRounds), 3), 20)
      }
      if (data?.drawDuration) {
        room.drawDuration = Math.min(Math.max(Number(data.drawDuration), 30), 240)
      }
      if (data?.wordChoiceCount) {
        room.wordChoiceCount = Math.min(Math.max(Number(data.wordChoiceCount), 2), 5)
      }
      if (data?.language) {
        room.language = data.language === 'hi' ? 'hi' : 'en'
      }
      room.teamMode = Boolean(data?.teamMode)
      room.mysteryMode = Boolean(data?.mysteryMode)
      room.audienceMode = Boolean(data?.audienceMode)
      room.dailyChallenge = Boolean(data?.dailyChallenge)
      room.themeMode = data?.themeMode === 'random' ? 'random' : 'fixed'
      if (room.themeMode === 'fixed' && typeof data?.selectedTheme === 'string' && THEMES.includes(data.selectedTheme)) {
        room.selectedTheme = data.selectedTheme
      }
      if (room.teamMode) {
        room.players.forEach(player => {
          if (!room.teams[player.id]) {
            assignTeam(room, player.id)
          }
        })
      }
      room.currentRound = Math.max(1, room.currentRound)
      setTheme(room)
      room.gameState = 'choosing'
      room.choosingStartedAt = Date.now()
      await pickWordChoices(room, room.wordChoiceCount)
      break
    }

    case 'choose-prompt': {
      const prompt = room.wordChoices.find(item => item.answer === data.answer)
      if (prompt) {
        startDrawing(room, prompt)
        setTheme(room)
        if (room.mysteryMode && room.currentPrompt) {
          room.drawerClues = await generateDrawerClues(room.currentPrompt.answer, room.currentTheme)
        }
      }
      break
    }

    case 'next-round': {
      if (room.currentRound >= room.maxRounds) {
        room.gameState = 'finished'
        break
      }
      room.currentRound += 1
      room.currentDrawer = room.players.length ? (room.currentDrawer + 1) % room.players.length : 0
      room.gameState = 'choosing'
      room.choosingStartedAt = Date.now()
      setTheme(room)
      await pickWordChoices(room, room.wordChoiceCount)
      break
    }

    case 'submit-guess': {
      if (!room.currentPrompt || room.gameState !== 'drawing') break
      const guess = String(data?.guess || '').trim()
      if (!guess) break

      const playerState = room.players.find(player => player.id === userId)
      if (playerState?.guessed) break

      let allowed = true
      try {
        allowed = await moderateGuess(guess)
      } catch {
        allowed = true
      }

      if (!allowed) {
        room.guesses.push({ player: data.playerName || 'Player', guess: 'Blocked message', correct: false })
        break
      }

      const normalizedGuess = guess.toLowerCase()
      const normalizedAnswer = room.currentPrompt.answer.toLowerCase()
      const correct = validateGuess(normalizedGuess, normalizedAnswer)

      room.guesses.push({ player: data.playerName || 'Player', guess, correct })

      if (correct) {
        const timeLeft = getTimeLeft(room)
        const guessedBefore = room.players.filter(player => player.guessed && player.id !== getDrawer(room)?.id).length
        const baseScore = calculateScore(guess, room.currentPrompt.answer, timeLeft)
        const streak = (room.streaks[userId] || 0) + 1
        room.streaks[userId] = streak
        const streakMultiplier = Math.min(1 + streak * 0.1, 2)
        const remainingBonus = Math.max(room.players.length - 1 - guessedBefore, 0) * 5
        let score = Math.floor(baseScore * streakMultiplier + remainingBonus)
        if (room.powerups[userId]?.doubleArmed) {
          score *= 2
          room.powerups[userId].doubleArmed = false
        }
        room.roundScores[userId] = Math.max(room.roundScores[userId] || 0, score)
        room.players = room.players.map(player =>
          player.id === userId ? { ...player, guessed: true } : player
        )

        const nonDrawerPlayers = room.players.filter(player => player.id !== getDrawer(room)?.id)
        const allGuessed = nonDrawerPlayers.every(player => player.guessed)
        if (allGuessed) {
          endRound(room)
        }
      }
      if (!correct && isCloseGuess(normalizedGuess, normalizedAnswer)) {
        room.privateNotices[userId] = 'You are very close!'
      }
      break
    }

    case 'request-hint': {
      if (!room.currentPrompt || room.gameState !== 'drawing') break
      if (room.hints.length >= 3) break

      let hintText = ''
      try {
        hintText = await generateHint(room.currentPrompt.answer)
      } catch {
        hintText = ''
      }

      room.revealCount += 1
      room.hints.push(hintText || `Hint: ${maskPrompt(room.currentPrompt.answer, room.revealCount)}`)
      break
    }

    case 'request-draw-tip': {
      if (!room.currentPrompt || room.gameState !== 'drawing') break
      room.drawTip = await generateDrawTip(room.currentPrompt.answer, room.currentTheme)
      break
    }

    case 'use-powerup': {
      const type = data?.powerup as 'reveal' | 'freeze' | 'double'
      const powerup = room.powerups[userId]
      if (!powerup || !type) break
      if (powerup[type] <= 0) break

      if (type === 'reveal') {
        powerup.reveal -= 1
        if (room.currentPrompt) {
          room.revealCount += 1
          room.hints.push(`Reveal: ${maskPrompt(room.currentPrompt.answer, room.revealCount)}`)
        }
      }
      if (type === 'freeze') {
        powerup.freeze -= 1
        room.drawBonusSeconds += 5
      }
      if (type === 'double') {
        powerup.double -= 1
        powerup.doubleArmed = true
      }
      break
    }

    case 'drawing-update': {
      if (room.gameState === 'drawing') {
        room.drawingData = data?.imageData || null
        if (data?.imageData) {
          room.ghostFrames.push(data.imageData)
          if (room.ghostFrames.length > 30) {
            room.ghostFrames.shift()
          }
        }
      }
      break
    }

    case 'round-time-ended': {
      endRound(room)
      break
    }

    case 'voice-signal': {
      const to = data?.to as string
      const signal = data?.signal
      if (to && signal) {
        room.voiceSignals.push({ to, from: userId, signal })
      }
      break
    }

    case 'submit-vote': {
      if (!room.audienceMode || room.gameState !== 'round-end') break
      const voteFor = data?.playerId as string
      if (!voteFor || room.votes[userId]) break
      room.votes[userId] = voteFor
      room.voteCounts[voteFor] = (room.voteCounts[voteFor] || 0) + 1
      break
    }

    default:
      break
  }

  const privateNotice = room.privateNotices[userId] || null
  if (privateNotice) {
    delete room.privateNotices[userId]
  }

  return NextResponse.json({
    success: true,
    state: {
      roomCode: room.roomCode,
      players: room.players,
      gameState: room.gameState,
      currentDrawer: room.currentDrawer,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      drawDuration: room.drawDuration,
      wordChoiceCount: room.wordChoiceCount,
      language: room.language,
      themeMode: room.themeMode,
      selectedTheme: room.selectedTheme,
      timeLeft: getTimeLeft(room),
      guesses: room.guesses,
      hints: room.hints,
      drawingData: room.drawingData,
      privateNotice,
      maskedPrompt: room.currentPrompt ? maskPrompt(room.currentPrompt.answer, room.revealCount) : '',
      promptDisplay: getDrawer(room)?.id === userId ? room.currentPrompt?.display || '' : '',
      wordChoices: getDrawer(room)?.id === userId ? room.wordChoices : [],
      lastRoundScores: room.lastRoundScores,
      lastPrompt: room.lastPrompt,
      lastDrawerId: room.lastDrawerId,
    },
  })
}
