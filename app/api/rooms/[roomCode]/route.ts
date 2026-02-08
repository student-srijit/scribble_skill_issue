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

export async function GET(request: NextRequest, { params }: { params: { roomCode: string } }) {
  try {
    const { roomCode } = params
    const database = await connectDB()
    const roomsCollection = database.collection('rooms')

    const room = await roomsCollection.findOne({ roomCode })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        room,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Get room error:', error)
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 })
  }
}
