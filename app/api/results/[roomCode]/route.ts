import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { roomCode: string } }) {
  try {
    const { roomCode } = params
    const db = await getDatabase()
    const rooms = db.collection('rooms')

    const room = await rooms.findOne({ roomCode })
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (!room.results) {
      return NextResponse.json({ error: 'Results not ready' }, { status: 404 })
    }

    return NextResponse.json({ success: true, results: room.results }, { status: 200 })
  } catch (error) {
    console.error('[v0] Results fetch error:', error)
    return NextResponse.json({ error: 'Failed to get results' }, { status: 500 })
  }
}
