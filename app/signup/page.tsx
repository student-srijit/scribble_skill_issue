'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { CharacterSelector, CharacterStyle } from '@/components/character-selector';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('phoenix');
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>({
    accessory: 'none',
    aura: 'purple',
    sparkle: true,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);

    try {
      await signup(username, selectedCharacter, characterStyle);
      const pendingRoom = typeof window !== 'undefined' ? localStorage.getItem('pendingRoom') : null;
      if (pendingRoom) {
        localStorage.removeItem('pendingRoom');
        router.push(`/game/${pendingRoom}`);
      } else {
        router.push('/lobby');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="glossy-card w-full max-w-2xl p-8">
        <h1 className="text-4xl font-bold text-glow text-center mb-2">
          Join Scribble
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Create your account and choose your character
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-4">
              Choose Your Character
            </label>
            <CharacterSelector
              onSelect={setSelectedCharacter}
              selected={selectedCharacter}
              style={characterStyle}
              onStyleChange={setCharacterStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glossy-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
