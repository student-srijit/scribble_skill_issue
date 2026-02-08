'use client'

import { useState, useCallback, useEffect } from 'react'
import { gameSocket } from '@/lib/socket'

export interface Player {
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

export interface GameRoomState {
  roomCode: string
  players: Player[]
  currentDrawer: number
  promptDisplay: string
  maskedPrompt: string
  gameState: 'waiting' | 'choosing' | 'drawing' | 'round-end' | 'finished'
  timeLeft: number
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
  teamScores: Record<'A' | 'B', number>
  teams: Record<string, 'A' | 'B'>
  streaks: Record<string, number>
  powerups: Record<string, { reveal: number; freeze: number; double: number; doubleArmed: boolean }>
  guesses: Array<{ player: string; guess: string; correct: boolean }>
  hints: string[]
  drawerClues: string[]
  drawTip: string
  wordChoices: Array<{ answer: string; display: string }>
  drawingData?: string | null
  ghostFrames?: string[]
  voteCounts?: Record<string, number>
  lastRoundScores?: Record<string, number>
  lastPrompt?: string
  lastDrawerId?: string | null
}

export function useGameState(
  roomCode: string,
  userId: string,
  playerInfo?: { name: string; character: string; characterStyle?: Player['characterStyle'] }
) {
  const [gameState, setGameState] = useState<GameRoomState>({
    roomCode,
    players: [],
    currentDrawer: 0,
    promptDisplay: '',
    maskedPrompt: '',
    gameState: 'waiting',
    timeLeft: 0,
    currentRound: 1,
    maxRounds: 10,
    drawDuration: 120,
    wordChoiceCount: 3,
    language: 'en',
    teamMode: false,
    mysteryMode: false,
    audienceMode: false,
    dailyChallenge: false,
    currentTheme: 'Fantasy',
    teamScores: { A: 0, B: 0 },
    teams: {},
    streaks: {},
    powerups: {},
    guesses: [],
    hints: [],
    drawerClues: [],
    drawTip: '',
    wordChoices: [],
    drawingData: null,
    ghostFrames: [],
    voteCounts: {},
    lastRoundScores: {},
    lastPrompt: '',
    lastDrawerId: null,
  })

  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return
    // Connect to WebSocket
    gameSocket
      .connect(roomCode, userId)
      .then(() => {
        setConnected(true)
        if (playerInfo?.name && playerInfo?.character) {
          gameSocket.send('join', {
            username: playerInfo.name,
            character: playerInfo.character,
            characterStyle: playerInfo.characterStyle,
          })
        }
      })
      .catch(err => {
        console.error('[v0] Failed to connect:', err)
      })

    gameSocket.on('state-sync', handleStateSync)

    return () => {
      if (playerInfo?.name) {
        gameSocket.send('leave', { playerId: userId })
      }
      gameSocket.off('state-sync', handleStateSync)
      gameSocket.disconnect()
    }
  }, [roomCode, userId, playerInfo?.name, playerInfo?.character])

  const handleStateSync = useCallback((data: Partial<GameRoomState>) => {
    setGameState(prev => ({ ...prev, ...data }))
  }, [])

  const submitGuess = useCallback((guess: string, playerName?: string) => {
    gameSocket.send('submit-guess', { guess, playerId: userId, playerName })
  }, [userId])

  const startGame = useCallback((options?: { drawDuration?: number; wordChoiceCount?: number; language?: 'en' | 'hi'; maxRounds?: number; teamMode?: boolean; mysteryMode?: boolean; audienceMode?: boolean; dailyChallenge?: boolean }) => {
    gameSocket.send('start-game', {
      roomCode,
      maxRounds: options?.maxRounds ?? gameState.maxRounds,
      drawDuration: options?.drawDuration ?? gameState.drawDuration,
      wordChoiceCount: options?.wordChoiceCount ?? gameState.wordChoiceCount,
      language: options?.language ?? gameState.language,
      teamMode: options?.teamMode ?? gameState.teamMode,
      mysteryMode: options?.mysteryMode ?? gameState.mysteryMode,
      audienceMode: options?.audienceMode ?? gameState.audienceMode,
      dailyChallenge: options?.dailyChallenge ?? gameState.dailyChallenge,
    })
  }, [
    roomCode,
    gameState.maxRounds,
    gameState.drawDuration,
    gameState.wordChoiceCount,
    gameState.language,
    gameState.teamMode,
    gameState.mysteryMode,
    gameState.audienceMode,
    gameState.dailyChallenge,
  ])

  const nextRound = useCallback(() => {
    gameSocket.send('next-round', { roomCode })
  }, [roomCode])

  const sendDrawingData = useCallback((imageData: string) => {
    gameSocket.send('drawing-update', { imageData })
  }, [])

  const choosePrompt = useCallback((answer: string) => {
    gameSocket.send('choose-prompt', { answer })
  }, [])

  const requestHint = useCallback(() => {
    gameSocket.send('request-hint', {})
  }, [])

  const usePowerup = useCallback((powerup: 'reveal' | 'freeze' | 'double') => {
    gameSocket.send('use-powerup', { powerup })
  }, [])

  const requestDrawTip = useCallback(() => {
    gameSocket.send('request-draw-tip', {})
  }, [])

  const submitVote = useCallback((playerId: string) => {
    gameSocket.send('submit-vote', { playerId })
  }, [])

  return {
    ...gameState,
    connected,
    submitGuess,
    startGame,
    nextRound,
    sendDrawingData,
    choosePrompt,
    requestHint,
    usePowerup,
    requestDrawTip,
    submitVote,
  }
}
