import { translateFree, createFallbackResponse } from '@/lib/free-ai'
import { translateWithLibreTranslate, translateWithMyMemory } from '@/lib/real-api-services'
import { createClient } from '@/lib/supabase/server'

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

    if (!text || !sourceLanguage || !targetLanguage) {
      return Response.json({ error: 'Text and languages are required' }, { status: 400 })
    }

    if (sourceLanguage === targetLanguage) {
      return Response.json({
        translatedText: text,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })
    }

    // Try real translation APIs with fallbacks
    let translation = ''
    
    // Try LibreTranslate first (free, no auth required)
    translation = await translateWithLibreTranslate(text, sourceLanguage, targetLanguage)
    
    // If LibreTranslate fails, try MyMemory
    if (!translation) {
      translation = await translateWithMyMemory(text, sourceLanguage, targetLanguage)
    }
    
    // Last resort: use old method
    if (!translation) {
      try {
        translation = await translateFree(text, sourceLanguage, targetLanguage)
      } catch (err) {
        console.error('All translation services failed:', err)
        translation = createFallbackResponse('translation', text)
      }
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
