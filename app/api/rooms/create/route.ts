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

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const { userId, username, isPublic, maxRounds = 10, selectedCharacter, characterStyle } = await request.json()

    const database = await connectDB()
    const roomsCollection = database.collection('rooms')

    const roomCode = generateRoomCode()

    const newRoom = {
      roomCode,
      host: userId,
      hostName: username,
      players: [{ id: userId, name: username, character: selectedCharacter, characterStyle }],
      status: 'waiting',
      currentRound: 0,
      maxRounds,
      isPublic,
      hostCharacter: selectedCharacter,
      playerCharacters: { [userId]: selectedCharacter },
      playerStyles: { [userId]: characterStyle },
      createdAt: new Date(),
    }

    const result = await roomsCollection.insertOne(newRoom)

    return NextResponse.json(
      {
        success: true,
        roomCode,
        roomId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Room creation error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
