'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { CHARACTERS } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'

interface GameRoom {
  _id: string
  roomCode: string
  hostName: string
  players: any[]
  status: 'waiting' | 'playing' | 'finished'
  currentRound: number
  maxRounds: number
  isPublic: boolean
}

export default function LobbyPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [isPublicRoom, setIsPublicRoom] = useState(false)
  const [maxRounds, setMaxRounds] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<GameRoom[]>([]); // Declare rooms variable

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
    fetchPublicRooms()

    // Poll for room updates every 5 seconds
    const pollInterval = setInterval(fetchPublicRooms, 5000)
    return () => clearInterval(pollInterval)
  }, [user, router])

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch('/api/rooms/list')
      const data = await res.json()
      if (data.success) {
        setPublicRooms(data.rooms)
        setRooms(data.rooms); // Update rooms variable
      }
    } catch (err) {
      console.error('[v0] Fetch rooms error:', err)
    }
  }

  const createRoom = async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          username: user.username,
          isPublic: isPublicRoom,
          maxRounds,
          selectedCharacter: user.selectedCharacter,
          characterStyle: user.characterStyle,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowCreateRoom(false)
      router.push(`/game/${data.roomCode}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: joinRoomCode,
          userId: user._id,
          username: user.username,
          selectedCharacter: user.selectedCharacter,
          characterStyle: user.characterStyle,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowJoinRoom(false)
      router.push(`/game/${joinRoomCode}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const characterData = CHARACTERS.find((c) => c.id === user?.selectedCharacter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-glow">Scribble</h1>
            {characterData && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Image
                  src={characterData.image || "/placeholder.svg"}
                  alt={characterData.name}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-sm font-semibold">{user?.username}</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-200 hover:bg-white/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="glossy-card p-6 text-center card-pop">
            <div className="text-4xl font-bold text-purple-400 pulse-glow-effect">{user?.score || 0}</div>
            <div className="text-sm text-gray-400 mt-2">Total Points</div>
          </div>
          <div className="glossy-card p-6 text-center card-pop" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl font-bold text-pink-400 pulse-glow-effect">{user?.wins || 0}</div>
            <div className="text-sm text-gray-400 mt-2">Wins</div>
          </div>
          <div className="glossy-card p-6 text-center card-pop" style={{ animationDelay: '0.2s' }}>
            {characterData && (
              <>
                <Image
                  src={characterData.image || "/placeholder.svg"}
                  alt={characterData.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 mx-auto mb-2 float-animation"
                />
                <div className="text-blue-400 font-bold">{characterData.name}</div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="glossy-button text-lg py-4 w-full"
          >
            Create Private Room
          </button>
          <button
            onClick={() => setShowJoinRoom(true)}
            className="glossy-button text-lg py-4 w-full"
          >
            Join Private Room
          </button>
          <Link
            href="/characters"
            className="glossy-button text-lg py-4 w-full text-center"
          >
            Change Character
          </Link>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="glossy-card p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-glow mb-6">Create Room</h2>
              {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}

              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicRoom}
                    onChange={(e) => setIsPublicRoom(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">Public Room (Anyone can join)</span>
                </label>

                <div>
                  <label className="block text-sm font-semibold mb-2">Rounds</label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
              </div>

              <button
                onClick={createRoom}
                disabled={isLoading}
                className="glossy-button w-full disabled:opacity-50 mb-3"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="w-full px-4 py-2 rounded-lg text-gray-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoinRoom && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="glossy-card p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-glow mb-6">Join Room</h2>
              {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">{error}</div>}

              <input
                type="text"
                placeholder="Enter room code (e.g., ABC123)"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 mb-6 text-center text-lg font-mono tracking-widest"
              />

              <button
                onClick={joinRoom}
                disabled={isLoading || joinRoomCode.length < 5}
                className="glossy-button w-full disabled:opacity-50 mb-3"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
              <button
                onClick={() => setShowJoinRoom(false)}
                className="w-full px-4 py-2 rounded-lg text-gray-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Public Rooms */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Public Rooms</h2>
          {publicRooms.length === 0 ? (
            <div className="glossy-card p-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-400 mb-6">No public games available</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="glossy-button"
              >
                Create One
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRooms.map((room) => (
                <div key={room._id} className="glossy-card p-6 hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-glow">{room.roomCode}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      {room.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Host: {room.hostName}</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Players: {room.players.length}/12
                  </p>
                  <button
                    onClick={() => {
                      setJoinRoomCode(room.roomCode)
                      setShowJoinRoom(true)
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
                  >
                    Join Game
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
