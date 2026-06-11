import { createClient } from '@/lib/supabase/server'
import { translateFree, createFallbackResponse } from '@/lib/free-ai'

// Free, keyless translation via MyMemory. No API key required.
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
      return Response.json({ translatedText: text, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
    }

    let translation: string
    try {
      translation = await translateFree(text, sourceLanguage, targetLanguage)
    } catch (err) {
      console.error('Translation service failed, using fallback:', err)
      translation = createFallbackResponse('translation', text)
    }

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
    console.error('Translate error:', error)
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
