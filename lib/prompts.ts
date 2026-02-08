export interface PromptItem {
  answer: string
  display: string
  twist: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

const RAW_PROMPTS = [
  'Cat',
  'Dog',
  'Elephant',
  'Octopus',
  'Pizza',
  'Ice Cream',
  'Burger',
  'Rocket',
  'Bicycle',
  'Laptop',
  'Mountain',
  'Beach',
  'Castle',
  'Robot dancing',
  'Dragon made of clouds',
  'Unicorn eating ice cream',
  'Mermaid in a bathtub',
  'Dinosaur in a tutu',
  'Penguin on roller skates',
  'Fox wearing headphones',
  'Cactus playing guitar',
  'Tree with glowing fruit',
  'Volcano erupting chocolate',
  'Underwater city',
  'Spaceship made of cheese',
  'Melting clock',
  'Rainbow made of books',
  'Snowman at the beach',
  'Pumpkin astronaut',
  'Guitar with wings',
  'Submarine shaped like a banana',
  'Train made of candy',
  'Kite shaped like a dragon',
  'Sun wearing sunglasses',
  'Moon playing drums',
  'Cloud raining pizza',
  'Paper boat',
  'Fish with a jetpack',
  'Turtle on a skateboard',
  'Squirrel juggling acorns',
  'Bee wearing a crown',
  'Shark in a suit',
  'Whale floating like a balloon',
  'Chef battling a giant donut',
  'Astronaut walking a dog on the moon',
  'Pirate riding a dolphin',
  'Wizard casting a spaghetti spell',
  'Knight with a balloon sword',
  'Painter with a rainbow brush',
  'Pastry chef flipping pancakes',
  'Doctor with a stethoscope',
  'Smiling camera',
  'Book with fireworks inside',
  'Heart-shaped key',
  'Chair with spider legs',
  'Lamp made of jelly',
  'Backpack with tiny wings',
  'Pencil that writes stars',
  'Coffee cup volcano',
  'Taco riding a scooter',
  'Giant donut monster',
  'Dancing sushi',
  'Watermelon helmet',
  'Pancake stack rocket',
  'Corn wearing sunglasses',
  'Mushroom house',
  'Star playing guitar',
  'Planet with a ring of donuts',
  'Comet carrying gifts',
  'Alien on a skateboard',
  'UFO beaming up a cow',
  'Satellite taking selfies',
  'Bridge made of noodles',
  'Park in the sky',
  'Floating library',
  'Museum with living paintings',
  'Garden with neon flowers',
  'Island shaped like a star',
  'House on chicken legs',
  'School made of candy',
  'Brazil flag',
  'Japan flag',
  'India flag',
  'United States flag',
  'Eiffel Tower',
  'Great Wall',
  'Taj Mahal',
  'Pyramids',
  'Big Ben',
  'Soccer ball',
  'Basketball hoop',
  'Surfboard',
  'Snowboard',
  'Rainbow umbrella',
  'Fire-breathing cat',
  'Crystal castle',
  'Neon dragon',
  'Glowing mushroom',
  'Floating island',
  'Robot chef',
  'Cosmic whale',
  'Magnetic boots',
  'Clockwork bird',
  'Storm in a bottle',
  'Lemon rocket',
  'Chocolate waterfall',
  'Candy volcano',
  'Winter beach',
  'Moon city',
  'Solar train',
  'Sky garden',
  'Paper dragon',
  'Fireworks guitar',
  'Cloud castle',
  'Galaxy pizza',
  'Mango submarine',
  'Space balloon',
  'Magic backpack',
  'Butterfly robot',
  'Singing cactus',
  'Balloon elephant',
  'Rocket skateboard',
  'Spaghetti tornado',
  'Tiny planet',
  'Rainbow waterfall'
]

function getDifficulty(text: string): PromptItem['difficulty'] {
  const length = text.replace(/\s+/g, '').length
  const words = text.trim().split(/\s+/).length
  if (length <= 6 && words <= 2) return 'easy'
  if (length <= 12 && words <= 3) return 'medium'
  return 'hard'
}

function hasTwist(text: string) {
  return /(with|made|wearing|raining|floating|shaped|playing|walking|riding|rocket|magic|neon|glowing|underwater)/i.test(text)
}

export const DEFAULT_PROMPTS: PromptItem[] = RAW_PROMPTS.map(answer => ({
  answer,
  display: answer,
  twist: hasTwist(answer),
  difficulty: getDifficulty(answer),
  category: 'mixed',
}))

const GENERATOR_NOUNS = [
  'cat',
  'robot',
  'pizza',
  'turtle',
  'dragon',
  'piano',
  'astronaut',
  'submarine',
  'cactus',
  'mountain',
  'whale',
  'bicycle',
  'castle',
  'donut',
  'cloud',
  'kite',
  'sushi',
  'planet',
  'pirate',
  'wizard',
]

const GENERATOR_ACTIONS = [
  'dancing',
  'sleeping',
  'juggling',
  'racing',
  'painting',
  'singing',
  'floating',
  'skateboarding',
  'surfing',
  'baking',
]

const GENERATOR_TWISTS = [
  'made of jelly',
  'wearing sunglasses',
  'made of candy',
  'with tiny wings',
  'on the moon',
  'underwater',
  'inside a snow globe',
  'with a rainbow trail',
  'made of lego',
  'with a glowing aura',
]

export function generatePromptFromIndex(index: number): PromptItem {
  const noun = GENERATOR_NOUNS[index % GENERATOR_NOUNS.length]
  const action = GENERATOR_ACTIONS[Math.floor(index / GENERATOR_NOUNS.length) % GENERATOR_ACTIONS.length]
  const twist = GENERATOR_TWISTS[Math.floor(index / (GENERATOR_NOUNS.length * GENERATOR_ACTIONS.length)) % GENERATOR_TWISTS.length]
  const twistEnabled = index % 2 === 0
  const base = noun.charAt(0).toUpperCase() + noun.slice(1)
  const display = twistEnabled ? `${base} ${action} ${twist}` : `${base} ${action}`

  return {
    answer: display,
    display,
    twist: twistEnabled,
    difficulty: twistEnabled ? 'medium' : 'easy',
    category: 'generated',
  }
}

export function maskPrompt(prompt: string, reveal: number): string {
  if (!prompt) return ''
  const letters = prompt.split('')
  const indices = letters
    .map((char, idx) => ({ char, idx }))
    .filter(item => /[a-zA-Z]/.test(item.char))
    .map(item => item.idx)

  const revealCount = Math.min(reveal, indices.length)
  const revealSet = new Set(indices.slice(0, revealCount))

  return letters
    .map((char, idx) => {
      if (!/[a-zA-Z]/.test(char)) return char
      return revealSet.has(idx) ? char : '_'
    })
    .join('')
}
