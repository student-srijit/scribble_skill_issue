import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, selectedCharacter, characterStyle } =
      await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Missing username' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = password ? await hashPassword(password) : '';

    const normalizedStyle = characterStyle || {
      accessory: 'none',
      aura: 'purple',
      sparkle: true,
    };

    const result = await usersCollection.insertOne({
      username,
      email: email || '',
      password: hashedPassword,
      selectedCharacter: selectedCharacter || 'phoenix',
      characterStyle: normalizedStyle,
      score: 0,
      wins: 0,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: 'User created successfully',
      userId: result.insertedId,
      username,
      email: email || '',
      selectedCharacter: selectedCharacter || 'phoenix',
      characterStyle: normalizedStyle,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
