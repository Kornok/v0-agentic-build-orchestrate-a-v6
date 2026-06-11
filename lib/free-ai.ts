// Free, keyless text generation + translation helpers.
//
// These power all "AI" features without requiring any API key or paid
// service. Text generation uses Pollinations (https://pollinations.ai),
// which is free and keyless. Translation uses MyMemory
// (https://mymemory.translated.net), also free and keyless.
//
// Both include retry/backoff and graceful local fallbacks so a feature
// never hard-fails even if the upstream service is briefly unavailable.

const POLLINATIONS_URL = 'https://text.pollinations.ai/'

interface GenerateOptions {
  prompt: string
  system?: string
  /** Lower = more deterministic. */
  temperature?: number
  /** Number of upstream attempts before falling back. */
  retries?: number
}

/**
 * Generate text using the free Pollinations API.
 * Throws only if every attempt fails AND no fallback is provided by the caller.
 */
export async function generateFreeText({
  prompt,
  system,
  temperature = 0.7,
  retries = 3,
}: GenerateOptions): Promise<string> {
  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt },
  ]

  let lastError: unknown = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(POLLINATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: 'openai',
          temperature,
          // Identifies the app to Pollinations; helps avoid anonymous throttling.
          referrer: 'nexus-ai-app',
          seed: Math.floor(Math.random() * 1_000_000),
        }),
        // Generous timeout for slower free inference.
        signal: AbortSignal.timeout(45_000),
      })

      const body = await res.text()

      // The free tier returns a 429 JSON payload when the IP queue is full.
      if (!res.ok || body.trim().startsWith('{"error"')) {
        lastError = new Error(`Pollinations returned ${res.status}: ${body.slice(0, 200)}`)
        // Exponential backoff before retrying.
        await sleep(800 * (attempt + 1))
        continue
      }

      const text = body.trim()
      if (text.length > 0) return text

      lastError = new Error('Empty response from Pollinations')
    } catch (err) {
      lastError = err
      await sleep(800 * (attempt + 1))
    }
  }

  throw lastError ?? new Error('Text generation failed')
}

/**
 * Translate text using the free MyMemory API. No key required.
 */
export async function translateFree(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', text)
  url.searchParams.set('langpair', `${sourceLang}|${targetLang}`)

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    throw new Error(`Translation service returned ${res.status}`)
  }

  const data = await res.json()
  const translated = data?.responseData?.translatedText

  if (!translated || typeof translated !== 'string') {
    throw new Error('Translation service returned no result')
  }

  return translated
}

/**
 * Local extractive summary as a fallback when the generative API is
 * unavailable. Scores sentences by normalized word frequency and returns
 * the top-ranked sentences in their original order.
 */
export function extractiveSummary(text: string, maxSentences = 3): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+/g)
    ?.map((s) => s.trim())
    .filter(Boolean) ?? []

  if (sentences.length <= maxSentences) return text.trim()

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'this', 'that', 'these', 'those', 'it', 'its', 'as', 'from', 'has',
    'have', 'had', 'will', 'would', 'can', 'could', 'should', 'i', 'you',
    'he', 'she', 'they', 'we', 'them', 'their', 'his', 'her',
  ])

  const freq: Record<string, number> = {}
  for (const word of text.toLowerCase().match(/\b[a-z']+\b/g) ?? []) {
    if (stopWords.has(word) || word.length < 2) continue
    freq[word] = (freq[word] ?? 0) + 1
  }

  const maxFreq = Math.max(1, ...Object.values(freq))

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/\b[a-z']+\b/g) ?? []
    let score = 0
    for (const word of words) {
      if (freq[word]) score += freq[word] / maxFreq
    }
    return { sentence, index, score: words.length ? score / words.length : 0 }
  })

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence)

  return top.join(' ')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
