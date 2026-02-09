'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { DrawingCanvas } from '@/components/drawing-canvas'
import { useGameState } from '@/hooks/use-game-state'
import { CHARACTERS } from '@/lib/auth'
import Image from 'next/image'
import { RoundSummary } from '@/components/round-summary'

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string
  const { user, isLoading } = useAuth()
  const canvasRef = useRef<{ clearCanvas: () => void; getImage: () => string }>(null)

  const THEME_OPTIONS = [
    'Random',
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

  const playerInfo = useMemo(() => {
    if (!user) return undefined
    return {
      name: user.username,
      character: user.selectedCharacter,
      characterStyle: user.characterStyle,
    }
  }, [user])

  const {
    players,
    currentDrawer,
    gameState,
    promptDisplay,
    maskedPrompt,
    timeLeft,
    guesses,
    currentRound,
    maxRounds,
    drawDuration: serverDrawDuration,
    wordChoiceCount: serverWordChoiceCount,
    language: serverLanguage,
    teamMode: serverTeamMode,
    mysteryMode: serverMysteryMode,
    audienceMode: serverAudienceMode,
    dailyChallenge: serverDailyChallenge,
    currentTheme,
    themeMode: serverThemeMode,
    selectedTheme: serverSelectedTheme,
    teamScores,
    teams,
    streaks,
    powerups,
    wordChoices,
    hints,
    privateNotice,
    drawerClues,
    drawTip,
    drawingData,
    ghostFrames,
    voteCounts,
    voiceSignals,
    lastRoundScores,
    lastPrompt,
    lastDrawerId,
    submitGuess,
    leaveRoom,
    startGame,
    nextRound,
    sendDrawingData,
    choosePrompt,
    requestHint,
    usePowerup,
    requestDrawTip,
    submitVote,
    sendVoiceSignal,
  } = useGameState(roomCode, user?._id || '', playerInfo)

  const [currentGuess, setCurrentGuess] = useState('')
  const [isDrawer, setIsDrawer] = useState(false)
  const [brushColor, setBrushColor] = useState('#a855f7')
  const [brushSize, setBrushSize] = useState(4)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [drawDuration, setDrawDuration] = useState(120)
  const [wordChoiceCount, setWordChoiceCount] = useState(3)
  const [language, setLanguage] = useState<'en' | 'hi'>('en')
  const [teamMode, setTeamMode] = useState(false)
  const [mysteryMode, setMysteryMode] = useState(false)
  const [audienceMode, setAudienceMode] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState(false)
  const [themeMode, setThemeMode] = useState<'fixed' | 'random'>('fixed')
  const [selectedTheme, setSelectedTheme] = useState('Fantasy')
  const [isListening, setIsListening] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [replayIndex, setReplayIndex] = useState(0)
  const [voiceJoined, setVoiceJoined] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  const accessoryEmoji = {
    none: '✨',
    crown: '👑',
    glasses: '🕶️',
    cap: '🧢',
    halo: '😇',
  }

  useEffect(() => {
    if (!isLoading && !user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingRoom', roomCode)
      }
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setDrawDuration(serverDrawDuration)
  }, [serverDrawDuration])

  useEffect(() => {
    setWordChoiceCount(serverWordChoiceCount)
  }, [serverWordChoiceCount])

  useEffect(() => {
    setLanguage(serverLanguage)
  }, [serverLanguage])

  useEffect(() => {
    setTeamMode(serverTeamMode)
  }, [serverTeamMode])

  useEffect(() => {
    setMysteryMode(serverMysteryMode)
  }, [serverMysteryMode])

  useEffect(() => {
    setAudienceMode(serverAudienceMode)
  }, [serverAudienceMode])

  useEffect(() => {
    setDailyChallenge(serverDailyChallenge)
  }, [serverDailyChallenge])

  useEffect(() => {
    setThemeMode(serverThemeMode)
  }, [serverThemeMode])

  useEffect(() => {
    setSelectedTheme(serverSelectedTheme)
  }, [serverSelectedTheme])

  useEffect(() => {
    // Check if current user is the drawer
    if (players.length > 0 && currentDrawer < players.length) {
      setIsDrawer(players[currentDrawer]?.id === user?._id)
    }
  }, [currentDrawer, players, user?._id])

  useEffect(() => {
    if (!showReplay || !ghostFrames || ghostFrames.length === 0) return
    setReplayIndex(0)
    const timer = setInterval(() => {
      setReplayIndex(prev => (prev + 1) % ghostFrames.length)
    }, 200)
    return () => clearInterval(timer)
  }, [showReplay, ghostFrames])

  const ensurePeerConnection = (peerId: string, initiate: boolean) => {
    if (peerConnectionsRef.current.has(peerId)) {
      return peerConnectionsRef.current.get(peerId)!
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    peerConnectionsRef.current.set(peerId, pc)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, { type: 'candidate', candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    if (initiate) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          sendSignal(peerId, { type: 'offer', offer: pc.localDescription })
        })
        .catch(console.error)
    }

    return pc
  }

  useEffect(() => {
    if (!voiceJoined || !user?._id) return

    const startVoice = async () => {
      try {
        setVoiceError('')
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getAudioTracks().forEach(track => {
            track.enabled = micEnabled
          })
          localStreamRef.current = stream
        }

        players
          .filter(player => player.id !== user._id)
          .forEach(player => {
            const shouldInitiate = user._id < player.id
            ensurePeerConnection(player.id, shouldInitiate)
          })
      } catch (error: any) {
        console.error(error)
        setVoiceError('Microphone blocked')
        setVoiceJoined(false)
        setMicEnabled(false)
      }
    }

    startVoice()

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
      peerConnectionsRef.current.forEach(pc => pc.close())
      peerConnectionsRef.current.clear()
      setRemoteStreams({})
    }
  }, [voiceJoined, players, user?._id])

  useEffect(() => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = micEnabled
    })
  }, [micEnabled])

  useEffect(() => {
    if (!voiceJoined || !voiceSignals || voiceSignals.length === 0) return

    voiceSignals.forEach(signal => {
      const from = signal.from
      const payload = signal.signal
      const pc = ensurePeerConnection(from, false)

      if (payload.type === 'offer') {
        pc.setRemoteDescription(payload.offer)
          .then(() => pc.createAnswer())
          .then(answer => pc.setLocalDescription(answer))
          .then(() => sendSignal(from, { type: 'answer', answer: pc.localDescription }))
          .catch(console.error)
      }

      if (payload.type === 'answer') {
        pc.setRemoteDescription(payload.answer).catch(console.error)
      }

      if (payload.type === 'candidate') {
        pc.addIceCandidate(payload.candidate).catch(console.error)
      }
    })
  }, [voiceJoined, voiceSignals])

  const sendSignal = (to: string, signal: any) => {
    sendVoiceSignal(to, signal)
  }

  const lastDrawerName = players.find(player => player.id === lastDrawerId)?.name || 'Unknown'
  const handleContinue = () => {
    if (currentRound >= maxRounds) {
      router.push(`/results/${roomCode}`)
      return
    }
    nextRound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-glow">Room {roomCode}</h1>
            <p className="text-sm text-gray-400">
              {gameState === 'drawing' && '✏️ Drawing Round'}
              {gameState === 'choosing' && '🪄 Choosing a Word'}
              {gameState === 'waiting' && '⏳ Waiting to Start'}
              {gameState === 'round-end' && '🏁 Round Over'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200">Theme: {currentTheme}</span>
              {teamMode && <span className="px-3 py-1 rounded-full bg-purple-500/20 text-xs text-purple-200">Team Battle</span>}
              {mysteryMode && <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-xs text-cyan-200">Mystery Mode</span>}
              {audienceMode && <span className="px-3 py-1 rounded-full bg-pink-500/20 text-xs text-pink-200">Audience Vote</span>}
              {dailyChallenge && <span className="px-3 py-1 rounded-full bg-amber-500/20 text-xs text-amber-200">Daily Challenge</span>}
            </div>
          </div>
          <button
            onClick={() => {
              leaveRoom()
              router.push('/lobby')
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-white/10 transition-colors"
          >
            Exit Game
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3 space-y-4">
            {gameState === 'waiting' ? (
              <div className="glossy-card p-8 text-center h-96 flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-glow mb-4">
                  {players[0]?.id === user?._id ? 'Game Settings' : 'Waiting for host to start'}
                </h2>

                {players[0]?.id === user?._id ? (
                  <div className="w-full max-w-2xl mx-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Draw Time</label>
                        <div className="flex flex-wrap gap-2">
                          {[60, 90, 120, 150].map(option => (
                            <button
                              key={option}
                              onClick={() => setDrawDuration(option)}
                              className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${drawDuration === option ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            >
                              {option}s
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Word Options</label>
                        <div className="flex flex-wrap gap-2">
                          {[2, 3, 4, 5].map(option => (
                            <button
                              key={option}
                              onClick={() => setWordChoiceCount(option)}
                              className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${wordChoiceCount === option ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            >
                              {option} choices
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Language</label>
                        <div className="flex gap-2">
                          {([
                            { id: 'en', label: 'English' },
                            { id: 'hi', label: 'Hindi' },
                          ] as const).map(option => (
                            <button
                              key={option.id}
                              onClick={() => setLanguage(option.id)}
                              className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${language === option.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <label className="block text-xs uppercase tracking-widest text-gray-400 mb-3">Theme</label>
                      <div className="flex flex-wrap gap-2">
                        {THEME_OPTIONS.map(option => {
                          const isRandom = option === 'Random'
                          const isActive = isRandom ? themeMode === 'random' : themeMode === 'fixed' && selectedTheme === option
                          return (
                            <button
                              key={option}
                              onClick={() => {
                                if (isRandom) {
                                  setThemeMode('random')
                                } else {
                                  setThemeMode('fixed')
                                  setSelectedTheme(option)
                                }
                              }}
                              className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {[
                        { id: 'teamMode', label: 'Team Battle', state: teamMode, set: setTeamMode },
                        { id: 'mysteryMode', label: 'Mystery Mode', state: mysteryMode, set: setMysteryMode },
                        { id: 'audienceMode', label: 'Audience Vote', state: audienceMode, set: setAudienceMode },
                        { id: 'dailyChallenge', label: 'Daily Challenge', state: dailyChallenge, set: setDailyChallenge },
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => option.set(!option.state)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${option.state ? 'bg-emerald-500/80 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => startGame({ drawDuration, wordChoiceCount, language, maxRounds, teamMode, mysteryMode, audienceMode, dailyChallenge, themeMode, selectedTheme })}
                      className="glossy-button text-lg py-3 w-full"
                    >
                      Start Game
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Host is choosing game settings.</p>
                )}
              </div>
            ) : (
              <>
                <div className="glossy-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Prompt</p>
                      <p className="text-2xl font-bold text-glow">
                        {gameState === 'drawing' && isDrawer
                          ? (mysteryMode ? 'Draw from clues' : promptDisplay)
                          : gameState === 'drawing'
                            ? maskedPrompt
                            : 'Waiting for drawer...'}
                      </p>
                      {isDrawer && mysteryMode && drawerClues.length > 0 && (
                        <div className="mt-2 text-xs text-purple-200 space-y-1">
                          <div className="text-[10px] uppercase tracking-widest text-purple-300">Mystery clues</div>
                          {drawerClues.map((clue, idx) => (
                            <div key={idx}>• {clue}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Time Remaining</p>
                      <p className="text-3xl font-bold text-pink-400">
                        {timeLeft}s
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glossy-card p-4 h-96">
                  {isDrawer ? (
                    <DrawingCanvas
                      ref={canvasRef}
                      isDrawing={gameState === 'drawing'}
                      onDraw={sendDrawingData}
                      strokeColor={brushColor}
                      strokeWidth={brushSize}
                      tool={tool}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-gray-500 relative overflow-hidden">
                      {drawingData ? (
                        <img
                          src={drawingData}
                          alt="Live drawing"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      ) : (
                        <span>Waiting for drawing...</span>
                      )}
                    </div>
                  )}
                </div>

                {isDrawer && gameState === 'drawing' && (
                  <div className="glossy-card p-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Tool</span>
                      <button
                        onClick={() => setTool('pen')}
                        className={`px-3 py-2 rounded-lg text-xs ${tool === 'pen' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}
                      >
                        Pen
                      </button>
                      <button
                        onClick={() => setTool('eraser')}
                        className={`px-3 py-2 rounded-lg text-xs ${tool === 'eraser' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300'}`}
                      >
                        Eraser
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Size</span>
                      <input
                        type="range"
                        min="2"
                        max="16"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Color</span>
                      {['#a855f7', '#22d3ee', '#f97316', '#f43f5e', '#22c55e', '#fbbf24'].map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setTool('pen')
                            setBrushColor(color)
                          }}
                          style={{ backgroundColor: color }}
                          className="w-6 h-6 rounded-full border border-white/20"
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => canvasRef.current?.clearCanvas()}
                      className="ml-auto px-4 py-2 rounded-lg bg-white/10 text-xs text-gray-200 hover:bg-white/20"
                    >
                      Clear
                    </button>
                    <button
                      onClick={requestDrawTip}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 text-xs text-purple-200 hover:bg-purple-500/30"
                    >
                      AI Draw Tip
                    </button>
                    <button
                      onClick={() => usePowerup('freeze')}
                      className="px-4 py-2 rounded-lg bg-cyan-500/20 text-xs text-cyan-200 hover:bg-cyan-500/30"
                    >
                      Freeze +5s ({powerups?.[user?._id || '']?.freeze || 0})
                    </button>
                  </div>
                )}

                {isDrawer && drawTip && (
                  <div className="glossy-card p-3 text-xs text-purple-200">💡 {drawTip}</div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glossy-card p-4">
              <h3 className="font-bold text-glow mb-3">Voice Chat</h3>
              <p className="text-xs text-gray-400 mb-3">
                {micEnabled ? 'Mic is live' : 'Mic is muted'} • Connected: {Object.keys(remoteStreams).length}
              </p>
              {voiceError && (
                <p className="text-xs text-red-300 mb-2">{voiceError}</p>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    if (!voiceJoined) {
                      setVoiceJoined(true)
                      setMicEnabled(true)
                      return
                    }
                    setMicEnabled(prev => !prev)
                  }}
                  disabled={players.length < 2}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold ${micEnabled ? 'bg-emerald-500/80 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'} disabled:opacity-50`}
                >
                  {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                </button>
                {players.length < 2 && (
                  <p className="text-[11px] text-gray-500">Need at least 2 players to use voice.</p>
                )}
              </div>
            </div>

            {/* Players */}
            <div className="glossy-card p-4">
              <h3 className="font-bold text-glow mb-4">Players</h3>
              {teamMode && (
                <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                  <span>Team A: {teamScores?.A || 0}</span>
                  <span>Team B: {teamScores?.B || 0}</span>
                </div>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {players.map((player, idx) => {
                  const charData = CHARACTERS.find((c) => c.id === player.character)
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        idx === currentDrawer
                          ? 'bg-purple-500/20 border border-purple-500'
                          : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {charData && (
                          <Image
                            src={charData.image || "/placeholder.svg"}
                            alt={charData.name}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{player.name}</p>
                          <p className="text-xs text-gray-400">
                            Score: {player.score}
                          </p>
                          <p className="text-xs text-gray-500">
                            Streak: {streaks?.[player.id] || 0}{teamMode && teams?.[player.id] ? ` • Team ${teams[player.id]}` : ''}
                          </p>
                        </div>
                        <span className="text-lg">
                          {accessoryEmoji[player.characterStyle?.accessory || 'none']}
                        </span>
                        {player.guessed && (
                          <span className="text-xl">✅</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Guesses */}
            {gameState === 'drawing' && !isDrawer && (
              <div className="glossy-card p-4">
                <h3 className="font-bold text-glow mb-4">Guesses</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {guesses.map((guess, idx) => (
                    <div key={idx} className="text-xs text-gray-300 bg-white/5 p-2 rounded flex items-center justify-between">
                      <span>{guess.player}: {guess.guess}</span>
                      {guess.correct && <span className="text-green-400">✔</span>}
                    </div>
                  ))}
                </div>
                {privateNotice && (
                  <div className="mb-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 p-2 rounded">
                    {privateNotice}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentGuess}
                    onChange={(e) => setCurrentGuess(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        submitGuess(currentGuess, user?.username)
                        setCurrentGuess('')
                      }
                    }}
                    placeholder="Make a guess..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      submitGuess(currentGuess, user?.username)
                      setCurrentGuess('')
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors font-semibold"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => {
                      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                      if (!SpeechRecognition) return
                      const recognition = new SpeechRecognition()
                      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US'
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript
                        setCurrentGuess(transcript)
                        submitGuess(transcript, user?.username)
                      }
                      recognition.onend = () => setIsListening(false)
                      setIsListening(true)
                      recognition.start()
                    }}
                    className={`px-3 py-2 text-xs rounded-lg ${isListening ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-200'}`}
                  >
                    🎤
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={requestHint}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    Request AI Hint
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => usePowerup('reveal')}
                      className="text-xs text-cyan-200 bg-cyan-500/10 px-2 py-1 rounded"
                    >
                      Reveal ({powerups?.[user?._id || '']?.reveal || 0})
                    </button>
                    <button
                      onClick={() => usePowerup('double')}
                      className="text-xs text-pink-200 bg-pink-500/10 px-2 py-1 rounded"
                    >
                      Double ({powerups?.[user?._id || '']?.double || 0})
                    </button>
                  </div>
                </div>
                {hints.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {hints.map((hint, idx) => (
                      <div key={idx} className="text-xs text-gray-200 bg-purple-500/10 border border-purple-500/20 p-2 rounded">
                        {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {gameState === 'choosing' && isDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glossy-card max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-glow mb-4">Choose a word</h2>
            <p className="text-sm text-gray-400 mb-6">Pick one of the AI-curated prompts. Words won’t repeat in this room.</p>
            <div className="space-y-3">
              {wordChoices.map(choice => (
                <button
                  key={choice.answer}
                  onClick={() => choosePrompt(choice.answer)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="text-lg font-semibold text-white">{choice.display}</div>
                  <div className="text-xs text-gray-400">Answer: {choice.answer}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'round-end' && lastPrompt && (
        <RoundSummary
          prompt={lastPrompt}
          drawerName={lastDrawerName}
          entries={players.map(player => ({
            id: player.id,
            name: player.name,
            character: player.character,
            roundScore: lastRoundScores?.[player.id] || 0,
            guessed: player.guessed,
          }))}
          onContinue={handleContinue}
          currentRound={currentRound}
          maxRounds={maxRounds}
        />
      )}

      {gameState === 'round-end' && ghostFrames && ghostFrames.length > 0 && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center z-40">
          <button
            onClick={() => setShowReplay(true)}
            className="px-4 py-2 rounded-full bg-white/10 text-xs text-gray-200 hover:bg-white/20"
          >
            ▶️ Replay Drawing
          </button>
        </div>
      )}

      {showReplay && ghostFrames && ghostFrames.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glossy-card max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-glow">Ghost Replay</h3>
              <button
                onClick={() => setShowReplay(false)}
                className="text-sm text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3">
              <img
                src={ghostFrames[replayIndex]}
                alt="Replay frame"
                className="w-full h-80 object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {gameState === 'round-end' && audienceMode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="glossy-card max-w-xl w-full p-6">
            <h3 className="text-xl font-bold text-glow mb-4">Audience Vote</h3>
            <p className="text-sm text-gray-400 mb-4">Vote for the best drawing!</p>
            <div className="space-y-2">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => submitVote(player.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <span className="font-semibold">{player.name}</span>
                  <span className="text-xs text-gray-300">Votes: {voteCounts?.[player.id] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <audio
            key={id}
            autoPlay
            ref={(el) => {
              if (el && el.srcObject !== stream) {
                el.srcObject = stream
              }
            }}
          />
        ))}
      </div>

      {gameState === 'round-end' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
          <div className="glossy-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {audienceMode && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-300">Vote best drawing:</span>
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => submitVote(player.id)}
                    className="px-3 py-2 rounded-full text-xs bg-white/10 text-gray-200 hover:bg-white/20"
                  >
                    {player.name} ({voteCounts?.[player.id] || 0})
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowReplay(true)}
              className="px-4 py-2 rounded-full bg-purple-500 text-white text-xs font-semibold"
            >
              Watch Ghost Replay
            </button>
          </div>
        </div>
      )}

      {showReplay && ghostFrames && ghostFrames.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glossy-card max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-glow">Ghost Replay</h3>
              <button
                onClick={() => setShowReplay(false)}
                className="px-3 py-1 rounded-full text-xs bg-white/10 text-gray-200"
              >
                Close
              </button>
            </div>
            <div className="w-full aspect-video bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={ghostFrames[replayIndex]}
                alt="Replay frame"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glossy-card max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-glow mb-6 text-center">Final Results</h2>
            <div className="space-y-3 mb-6">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{['🥇', '🥈', '🥉'][idx] || '⭐'}</span>
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    <span className="text-lg font-bold text-purple-300">{player.score}</span>
                  </div>
                ))}
            </div>
            <button
              onClick={() => router.push('/lobby')}
              className="glossy-button w-full"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
