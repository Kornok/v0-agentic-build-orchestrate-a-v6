import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// Free, zero-config via Vercel AI Gateway - no API key required
const MODEL = 'openai/gpt-5-mini'

// Best-effort DB persistence: never let a missing/unconfigured database
// break the core feature. Returns the saved row, or null if unavailable.
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
    const { text, summaryLength = 'medium' } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'No text provided' }, { status: 400 })
    }

    const lengthInstructions = {
      short: 'Create a 2-3 sentence summary.',
      medium: 'Create a 4-6 sentence summary.',
      long: 'Create a 8-10 sentence summary.',
    }

    const prompt = `You are an expert summarizer. ${lengthInstructions[summaryLength as keyof typeof lengthInstructions] || lengthInstructions.medium}

Text to summarize:
${text}

Please provide a clear, concise summary that captures the main points.`

    const { text: summary } = await generateText({
      model: MODEL,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 500,
    })

    const saved = await trySave('document_summaries', {
      original_text: text,
      summary,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      summary,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to summarize document' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ summaries: [] })

    return Response.json({ summaries: data })
  } catch {
    return Response.json({ summaries: [] })
  }
}
