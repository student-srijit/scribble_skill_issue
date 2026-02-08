import { hash, compare } from 'bcryptjs'

export const DRAW_PROMPTS = []

export async function hashPassword(password: string): Promise<string> {
  const salt = await hash(password, 12);
  return salt;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export const CHARACTERS = [
  {
    id: 'phoenix',
    name: 'Solar Phoenix',
    image: '/characters/phoenix.svg',
    color: 'bg-orange-500',
    accent: 'from-orange-400 to-rose-500',
  },
  {
    id: 'astro-fox',
    name: 'Astro Fox',
    image: '/characters/astro-fox.svg',
    color: 'bg-indigo-500',
    accent: 'from-indigo-400 to-purple-500',
  },
  {
    id: 'neon-panda',
    name: 'Neon Panda',
    image: '/characters/neon-panda.svg',
    color: 'bg-emerald-500',
    accent: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'aqua-drake',
    name: 'Aqua Drake',
    image: '/characters/aqua-drake.svg',
    color: 'bg-cyan-500',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'pixel-kid',
    name: 'Pixel Kid',
    image: '/characters/pixel-kid.svg',
    color: 'bg-pink-500',
    accent: 'from-pink-400 to-purple-500',
  },
  {
    id: 'shadow-cat',
    name: 'Shadow Cat',
    image: '/characters/shadow-cat.svg',
    color: 'bg-slate-600',
    accent: 'from-slate-500 to-slate-800',
  },
  {
    id: 'star-bunny',
    name: 'Star Bunny',
    image: '/characters/star-bunny.svg',
    color: 'bg-fuchsia-500',
    accent: 'from-fuchsia-400 to-pink-500',
  },
  {
    id: 'lava-golem',
    name: 'Lava Golem',
    image: '/characters/lava-golem.svg',
    color: 'bg-red-500',
    accent: 'from-red-500 to-yellow-500',
  },
  {
    id: 'glacier-yeti',
    name: 'Glacier Yeti',
    image: '/characters/glacier-yeti.svg',
    color: 'bg-sky-500',
    accent: 'from-sky-400 to-blue-500',
  },
  {
    id: 'spark-owl',
    name: 'Spark Owl',
    image: '/characters/spark-owl.svg',
    color: 'bg-amber-500',
    accent: 'from-amber-400 to-orange-500',
  },
  {
    id: 'candy-koala',
    name: 'Candy Koala',
    image: '/characters/candy-koala.svg',
    color: 'bg-rose-500',
    accent: 'from-rose-400 to-pink-500',
  },
]

export interface User {
  _id?: string;
  username: string;
  email?: string;
  password?: string;
  selectedCharacter: string;
  characterStyle?: {
    accessory: 'none' | 'crown' | 'glasses' | 'cap' | 'halo';
    aura: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
    sparkle: boolean;
  };
  score: number;
  wins: number;
  createdAt?: Date;
}

export interface GameRoom {
  _id?: string;
  roomCode: string;
  host: string;
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  maxRounds: number;
  isPublic: boolean;
  hostCharacter: string;
  playerCharacters: { [playerId: string]: string };
  playerStyles?: {
    [playerId: string]: {
      accessory: 'none' | 'crown' | 'glasses' | 'cap' | 'halo';
      aura: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
      sparkle: boolean;
    };
  };
  createdAt?: Date;
}
