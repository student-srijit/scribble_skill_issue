'use client'

import Image from 'next/image'
import { CHARACTERS } from '@/lib/auth'

const ACCESSORIES = [
  { id: 'none', label: 'None', emoji: '✨' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'glasses', label: 'Glasses', emoji: '🕶️' },
  { id: 'cap', label: 'Cap', emoji: '🧢' },
  { id: 'halo', label: 'Halo', emoji: '😇' },
]

const AURAS = [
  { id: 'purple', label: 'Purple', className: 'ring-purple-400' },
  { id: 'blue', label: 'Blue', className: 'ring-blue-400' },
  { id: 'green', label: 'Green', className: 'ring-emerald-400' },
  { id: 'orange', label: 'Orange', className: 'ring-orange-400' },
  { id: 'pink', label: 'Pink', className: 'ring-pink-400' },
]

export interface CharacterStyle {
  accessory: 'none' | 'crown' | 'glasses' | 'cap' | 'halo'
  aura: 'purple' | 'blue' | 'green' | 'orange' | 'pink'
  sparkle: boolean
}

interface CharacterSelectorProps {
  onSelect: (characterId: string) => void
  selected?: string
  style?: CharacterStyle
  onStyleChange?: (style: CharacterStyle) => void
}

export function CharacterSelector({
  onSelect,
  selected = 'phoenix',
  style = { accessory: 'none', aura: 'purple', sparkle: true },
  onStyleChange,
}: CharacterSelectorProps) {
  const selectedCharacter = CHARACTERS.find(c => c.id === selected)
  const auraClass = AURAS.find(a => a.id === style.aura)?.className || 'ring-purple-400'
  const accessoryEmoji = ACCESSORIES.find(a => a.id === style.accessory)?.emoji || '✨'

  const updateStyle = (partial: Partial<CharacterStyle>) => {
    onStyleChange?.({ ...style, ...partial })
  }

  return (
    <div className="w-full">
      {/* Character Grid */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {CHARACTERS.map(character => (
          <button
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`p-2 rounded-lg transition-all duration-300 ${
              selected === character.id
                ? 'ring-2 ring-purple-400 scale-110 bg-white/10'
                : 'opacity-60 hover:opacity-100 bg-white/5'
            }`}
          >
            <Image
              src={character.image || "/placeholder.svg"}
              alt={character.name}
              width={48}
              height={48}
              className="w-12 h-12"
              priority
            />
          </button>
        ))}
      </div>

      {/* Character Preview */}
      {selectedCharacter && (
        <div className="glossy-card p-12 text-center">
          <div className="mb-6 relative inline-flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full blur-xl opacity-60 ${style.sparkle ? 'animate-pulse' : ''} ${style.aura === 'purple' ? 'bg-purple-500/40' : ''} ${style.aura === 'blue' ? 'bg-blue-500/40' : ''} ${style.aura === 'green' ? 'bg-emerald-500/40' : ''} ${style.aura === 'orange' ? 'bg-orange-500/40' : ''} ${style.aura === 'pink' ? 'bg-pink-500/40' : ''}`}
            />
            <div className={`p-2 rounded-full ring-2 ${auraClass} bg-white/10`}> 
              <Image
                src={selectedCharacter.image || "/placeholder.svg"}
                alt={selectedCharacter.name}
                width={120}
                height={120}
                className="w-32 h-32 mx-auto float-animation"
                priority
              />
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{accessoryEmoji}</div>
          </div>
          <h3 className="text-2xl font-bold text-glow mb-2">{selectedCharacter.name}</h3>
          <p className="text-gray-400">
            You are <span className="text-white font-semibold">{selectedCharacter.name}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-sm text-gray-400 mb-2">Accessory</p>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map(accessory => (
                  <button
                    key={accessory.id}
                    onClick={() => updateStyle({ accessory: accessory.id as CharacterStyle['accessory'] })}
                    className={`px-3 py-2 rounded-full text-sm ${style.accessory === accessory.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-200'} transition-colors`}
                  >
                    <span className="mr-1">{accessory.emoji}</span>
                    {accessory.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Aura</p>
              <div className="flex flex-wrap gap-2">
                {AURAS.map(aura => (
                  <button
                    key={aura.id}
                    onClick={() => updateStyle({ aura: aura.id as CharacterStyle['aura'] })}
                    className={`px-3 py-2 rounded-full text-sm ${style.aura === aura.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-200'} transition-colors`}
                  >
                    {aura.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <input
              id="sparkle"
              type="checkbox"
              checked={style.sparkle}
              onChange={(e) => updateStyle({ sparkle: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="sparkle" className="text-sm text-gray-300">Sparkle glow</label>
          </div>
        </div>
      )}
    </div>
  )
}
