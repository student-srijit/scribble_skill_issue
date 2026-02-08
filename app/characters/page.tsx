'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { CharacterSelector, CharacterStyle } from '@/components/character-selector';

export default function CharactersPage() {
  const router = useRouter();
  const { user, updateCharacter, updateCharacterStyle } = useAuth();

  const handleCharacterSelect = (characterId: string) => {
    updateCharacter(characterId);
  };

  const handleStyleChange = (style: CharacterStyle) => {
    updateCharacterStyle(style);
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="glossy-card w-full max-w-4xl p-8">
        <h1 className="text-4xl font-bold text-glow text-center mb-4">
          Choose Your Character
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Select a character that represents your drawing style
        </p>

        <CharacterSelector
          onSelect={handleCharacterSelect}
          selected={user.selectedCharacter}
          style={user.characterStyle}
          onStyleChange={handleStyleChange}
        />

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/lobby')}
            className="glossy-button px-6 py-2"
          >
            Save & Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
