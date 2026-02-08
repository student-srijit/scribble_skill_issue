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
  'Burger',
  'Rocket',
  'Bicycle',
  'Laptop',
  'Mountain',
  'Beach',
  'Castle',
  'Robot',
  'Dragon',
  'Unicorn',
  'Mermaid',
  'Dinosaur',
  'Penguin',
  'Fox',
  'Cactus',
  'Tree',
  'Volcano',
  'City',
  'Spaceship',
  'Rainbow',
  'Snowman',
  'Pumpkin',
  'Guitar',
  'Submarine',
  'Train',
  'Kite',
  'Sun',
  'Moon',
  'Cloud',
  'Boat',
  'Fish',
  'Turtle',
  'Squirrel',
  'Bee',
  'Shark',
  'Whale',
  'Astronaut',
  'Pirate',
  'Wizard',
  'Knight',
  'Painter',
  'Doctor',
  'Camera',
  'Book',
  'Key',
  'Chair',
  'Lamp',
  'Backpack',
  'Pencil',
  'Coffee',
  'Taco',
  'Donut',
  'Sushi',
  'Watermelon',
  'Pancake',
  'Corn',
  'Mushroom',
  'Star',
  'Planet',
  'Comet',
  'Alien',
  'Bridge',
  'Park',
  'Library',
  'Museum',
  'Garden',
  'Island',
  'House',
  'School',
  'Brazil',
  'Japan',
  'India',
  'America',
  'France',
  'China',
  'Egypt',
  'England',
  'Soccer',
  'Basketball',
  'Surfboard',
  'Snowboard',
  'Umbrella',
  'Helicopter',
  'Refrigerator',
  'Microscope',
  'Kangaroo',
  'Hippopotamus',
  'Chameleon',
  'Crocodile',
  'Butterfly',
  'Giraffe',
  'Rhinoceros',
  'Jellyfish',
  'Pineapple',
  'Strawberry',
  'Blueberry',
  'Avocado',
  'Broccoli',
  'Cupcake',
  'Sandwich',
  'Hamburger',
  'Skyscraper',
  'Waterfall',
  'Lighthouse',
  'Volleyball',
  'Telescope',
  'Parachute',
  'Windmill',
  'Dolphin',
  'Seahorse',
  'Octagon',
  'Triangle',
  'Rectangle',
  'Pyramid',
  'Rainbowfish',
  'Thunderstorm',
  'Hurricane',
  'Avalanche',
  'Volcano',
  'Glacier',
  'Desert',
  'Forest',
  'Jungle',
  'Canyon',
  'Galaxy',
  'Meteor',
  'Satellite',
  'Spacesuit',
  'Backpack',
  'Headphones',
  'Joystick',
  'Skateboard',
  'Motorcycle',
  'Firetruck',
  'Ambulance',
  'Bulldozer',
  'Crane',
  'Tractor',
  'Suitcase',
  'Football',
  'Tornado',
  'Cyclone',
  'Igloo',
  'Coconut',
  'Pomegranate',
  'Lemonade',
  'Milkshake',
  'Popcorn',
  'Robotdog',
  'Moonlight',
  'Sunflower',
  'Blackhole',
  'Rainbow'
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


export function generatePromptFromIndex(index: number): PromptItem {
  const noun = GENERATOR_NOUNS[index % GENERATOR_NOUNS.length]
  const base = noun.charAt(0).toUpperCase() + noun.slice(1)
  const display = base

  return {
    answer: display,
    display,
    twist: false,
    difficulty: 'easy',
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
