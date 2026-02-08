import { MongoClient } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const client = new MongoClient(process.env.MONGODB_URI!)
let db: any

async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db(process.env.MONGODB_DB)
  }
  return db
}

export async function POST(request: NextRequest) {
  try {
    const { roomCode, userId, username, selectedCharacter, characterStyle } = await request.json()

    const database = await connectDB()
    const roomsCollection = database.collection('rooms')

    const room = await roomsCollection.findOne({ roomCode })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Room is not accepting new players' }, { status: 400 })
    }

    if (room.players.length >= 12) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Check if player already in room
    const playerExists = room.players.some((p: any) => p.id === userId)
    if (playerExists) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 })
    }

    // Add player to room
    await roomsCollection.updateOne(
      { roomCode },
      {
        $push: { players: { id: userId, name: username, character: selectedCharacter, characterStyle } },
        $set: {
          [`playerCharacters.${userId}`]: selectedCharacter,
          [`playerStyles.${userId}`]: characterStyle,
        },
      }
    )

    const updatedRoom = await roomsCollection.findOne({ roomCode })

    return NextResponse.json(
      {
        success: true,
        room: updatedRoom,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Join room error:', error)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
