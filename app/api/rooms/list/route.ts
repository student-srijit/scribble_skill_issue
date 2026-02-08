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

export async function GET(request: NextRequest) {
  try {
    const database = await connectDB()
    const roomsCollection = database.collection('rooms')

    // Get public rooms that are still waiting
    const publicRooms = await roomsCollection
      .find({
        isPublic: true,
        status: 'waiting',
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json(
      {
        success: true,
        rooms: publicRooms,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] List rooms error:', error)
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 })
  }
}
