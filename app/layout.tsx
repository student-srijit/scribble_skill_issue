import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/app/context/auth-context'
import { CursorFollower } from '@/components/cursor-follower'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scribble - Multiplayer Drawing Game',
  description: 'Join the ultimate online drawing and guessing game with friends!',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CursorFollower />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
