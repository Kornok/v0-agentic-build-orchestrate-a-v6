import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export async function POST(request: Request) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: 'No text provided' },
        { status: 400 }
      )
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

    const sourceLangName = SUPPORTED_LANGUAGES[sourceLanguage as keyof typeof SUPPORTED_LANGUAGES] || sourceLanguage
    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES] || targetLanguage

    const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 
Provide only the translated text without any explanations or additional text.

Text to translate:
${text}`

    // Generate translation using AI SDK
    const { text: translation } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    // Save to database
    const { data, error } = await supabase
      .from('translations')
      .insert({
        original_text: text,
        translated_text: translation,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to save translation' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      translatedText: translation,
      createdAt: data[0].created_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return Response.json(
        { error: 'Failed to fetch translations' },
        { status: 500 }
      )
    }

    return Response.json({ 
      translations: data,
      languages: SUPPORTED_LANGUAGES,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    )
  }
}
