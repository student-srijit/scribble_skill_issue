import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const database = await getDatabase()
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
