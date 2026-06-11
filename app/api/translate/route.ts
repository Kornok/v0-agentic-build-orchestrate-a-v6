import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// Free, zero-config via Vercel AI Gateway - no API key required
const MODEL = 'openai/gpt-5-mini'

const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  ko: 'Korean',
}

async function trySave(table: string, row: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).insert(row).select()
    if (error || !data || data.length === 0) return null
    return data[0]
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No text provided' }, { status: 400 })
    }

    if (!sourceLanguage || !targetLanguage) {
      return Response.json(
        { error: 'Source and target languages are required' },
        { status: 400 }
      )
    }

    if (sourceLanguage === targetLanguage) {
      return Response.json(
        { error: 'Source and target languages cannot be the same' },
        { status: 400 }
      )
    }

    const sourceLangName =
      SUPPORTED_LANGUAGES[sourceLanguage as keyof typeof SUPPORTED_LANGUAGES] || sourceLanguage
    const targetLangName =
      SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES] || targetLanguage

    const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 
Provide only the translated text without any explanations or additional text.

Text to translate:
${text}`

    const { text: translation } = await generateText({
      model: MODEL,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 2000,
    })

    const saved = await trySave('translations', {
      original_text: text,
      translated_text: translation,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      translatedText: translation,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to translate text' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ translations: [], languages: SUPPORTED_LANGUAGES })

    return Response.json({ translations: data, languages: SUPPORTED_LANGUAGES })
  } catch {
    return Response.json({ translations: [], languages: SUPPORTED_LANGUAGES })
  }
}
