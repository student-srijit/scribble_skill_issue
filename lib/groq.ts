interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqChoice {
  message: GroqMessage
}

interface GroqResponse {
  choices: GroqChoice[]
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

function getGroqKey() {
  return process.env.GROQ_API_KEY
}

export async function groqChat(messages: GroqMessage[], temperature = 0.7) {
  const apiKey = getGroqKey()
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq error: ${errorText}`)
  }

  const data = (await response.json()) as GroqResponse
  return data.choices?.[0]?.message?.content || ''
}

export async function generatePromptIdeas(existingAnswers: string[], count = 6) {
  const response = await groqChat([
    {
      role: 'system',
      content:
        'You generate drawable prompts for a scribble game. Return only JSON with shape: {"prompts":[{"answer":"Giraffe","display":"Giraffe","twist":false,"difficulty":"easy","category":"animals"}]}. The answer must exactly match display. Prompts must be exactly 1 word, easy to draw, and avoid repeats of answers provided.',
    },
    {
      role: 'user',
      content: `Avoid these answers: ${existingAnswers.join(', ')}. Generate ${count} prompts with some twists.`,
    },
  ], 0.7)

  try {
    const parsed = JSON.parse(response)
    return Array.isArray(parsed.prompts) ? parsed.prompts : []
  } catch {
    return []
  }
}

export async function generateHint(answer: string) {
  const response = await groqChat([
    {
      role: 'system',
      content:
        'You are a hint generator for a drawing game. Provide a single short hint (max 10 words). Do not reveal the exact answer.',
    },
    {
      role: 'user',
      content: `Answer: ${answer}`,
    },
  ], 0.4)

  return response.replace(/\n/g, ' ').trim()
}

export async function generateDrawerClues(answer: string, theme?: string) {
  const response = await groqChat([
    {
      role: 'system',
      content:
        'You are a drawing clue generator. Provide 3 short bullet clues (max 6 words each). Do not reveal the exact answer. Return as JSON: {"clues":["clue1","clue2","clue3"]}.',
    },
    {
      role: 'user',
      content: `Answer: ${answer}. Theme: ${theme || 'any'}.`,
    },
  ], 0.6)

  try {
    const parsed = JSON.parse(response)
    return Array.isArray(parsed.clues) ? parsed.clues.slice(0, 3) : []
  } catch {
    return []
  }
}

export async function generateDrawTip(prompt: string, theme?: string) {
  const response = await groqChat([
    {
      role: 'system',
      content:
        'You are a drawing coach. Give one short actionable tip (max 12 words).',
    },
    {
      role: 'user',
      content: `Prompt: ${prompt}. Theme: ${theme || 'any'}.`,
    },
  ], 0.5)

  return response.replace(/\n/g, ' ').trim()
}

export async function moderateGuess(text: string) {
  const response = await groqChat([
    {
      role: 'system',
      content:
        'You are a moderation filter. Respond with only JSON: {"allowed": true|false}. Mark false for slurs, profanity, or harassment.',
    },
    {
      role: 'user',
      content: text,
    },
  ], 0)

  try {
    const parsed = JSON.parse(response)
    return Boolean(parsed.allowed)
  } catch {
    return true
  }
}
