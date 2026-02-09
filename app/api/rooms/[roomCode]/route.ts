import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { roomCode: string } }) {
  try {
    const { roomCode } = params
    const database = await getDatabase()
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
