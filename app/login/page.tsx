'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username);
      const pendingRoom = typeof window !== 'undefined' ? localStorage.getItem('pendingRoom') : null;
      if (pendingRoom) {
        localStorage.removeItem('pendingRoom');
        router.push(`/game/${pendingRoom}`);
      } else {
        router.push('/lobby');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="glossy-card w-full max-w-md p-8">
        <h1 className="text-4xl font-bold text-glow text-center mb-2">
          Scribble
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Welcome back, let's draw something amazing
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="glossy-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
