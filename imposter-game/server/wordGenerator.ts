import Groq from 'groq-sdk';

interface GeneratedWord {
  word: string;
  hint: string;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyInstructions: Record<Difficulty, string> = {
  easy: 'Use very common, well-known words that most people would recognize. Hints should be obvious and descriptive (e.g., "Pizza" → "Italian food").',
  medium: 'Use moderately known words. Hints should be slightly vague but still helpful (e.g., "Tiramisu" → "Dessert").',
  hard: 'Use obscure or niche words that only enthusiasts would know. Hints should be cryptic and minimal (e.g., "Gochujang" → "Paste").',
};

// Simple in-memory cache: "category|difficulty" -> words[]
const wordCache = new Map<string, { words: GeneratedWord[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
}

export async function generateWords(
  category: string,
  difficulty: Difficulty = 'medium',
): Promise<GeneratedWord[] | null> {
  const client = getGroqClient();
  if (!client) {
    console.log('⚠️ GROQ_API_KEY not set, falling back to static words');
    return null;
  }

  // Check cache
  const cacheKey = `${category.toLowerCase().trim()}|${difficulty}`;
  const cached = wordCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`📦 Cache hit for "${category}" (${difficulty})`);
    return cached.words;
  }

  const prompt = `Generate exactly 10 words/items for the category "${category}" for a party game called "Imposter" (similar to Spyfall).

Difficulty: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

Rules:
- Each word must be a single item/thing (1-3 words max)
- Each hint must be exactly 1-3 words — short and concise
- Words should be diverse within the category
- No duplicates
- The hint should help someone guess the category but NOT give away the exact word

Respond ONLY with a valid JSON array, no markdown, no explanation:
[{"word": "Example", "hint": "Short hint"}, ...]`;

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a word generator for a party game. Respond only with valid JSON arrays. No markdown formatting, no code blocks, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Strip markdown code block if present
    const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    const parsed: GeneratedWord[] = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const valid = parsed.every(
      (item) =>
        typeof item.word === 'string' &&
        typeof item.hint === 'string' &&
        item.word.length > 0 &&
        item.hint.length > 0,
    );
    if (!valid) return null;

    // Cache the result
    wordCache.set(cacheKey, { words: parsed, timestamp: Date.now() });
    console.log(`🤖 Generated ${parsed.length} words for "${category}" (${difficulty})`);
    return parsed;
  } catch (err) {
    console.error('❌ Groq API error:', err);
    return null;
  }
}
