'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface User {
  _id: string;
  username: string;
  email?: string;
  selectedCharacter: string;
  characterStyle: {
    accessory: 'none' | 'crown' | 'glasses' | 'cap' | 'halo';
    aura: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
    sparkle: boolean;
  };
  score: number;
  wins: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string) => Promise<void>;
  signup: (
    username: string,
    selectedCharacter: string,
    characterStyle: User['characterStyle']
  ) => Promise<void>;
  logout: () => void;
  updateCharacter: (characterId: string) => void;
  updateCharacterStyle: (style: Partial<User['characterStyle']>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (you could verify with server)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const normalized = {
          ...parsed,
          characterStyle: parsed.characterStyle || {
            accessory: 'none',
            aura: 'purple',
            sparkle: true,
          },
        };
        setUser(normalized);
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const signup = async (
    username: string,
    selectedCharacter: string,
    characterStyle: User['characterStyle']
  ) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        selectedCharacter,
        characterStyle,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    const userData: User = {
      _id: data.userId,
      username: data.username,
      email: data.email || '',
      selectedCharacter: data.selectedCharacter,
      characterStyle: data.characterStyle,
      score: 0,
      wins: 0,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateCharacter = (characterId: string) => {
    if (user) {
      const updatedUser = { ...user, selectedCharacter: characterId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateCharacterStyle = (style: Partial<User['characterStyle']>) => {
    if (user) {
      const updatedUser = {
        ...user,
        characterStyle: { ...user.characterStyle, ...style },
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, updateCharacter, updateCharacterStyle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
