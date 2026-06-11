import { createClient } from '@/lib/supabase/server'
import { generateFreeText, extractiveSummary } from '@/lib/free-ai'

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
      short: 'Create a concise 2-3 sentence summary.',
      medium: 'Create a 4-6 sentence summary.',
      long: 'Create a detailed 8-10 sentence summary.',
    }

    const sentenceCounts = { short: 2, medium: 5, long: 9 }

    const prompt = `${lengthInstructions[summaryLength as keyof typeof lengthInstructions] || lengthInstructions.medium}

Text to summarize:
${text}

Provide a clear, concise summary that captures the main points. Output only the summary.`

    let summary: string
    try {
      summary = await generateFreeText({
        prompt,
        system: 'You are an expert summarizer. Respond only with the summary text.',
        temperature: 0.5,
      })
    } catch {
      // Fallback: local extractive summarization so the feature always works.
      summary = extractiveSummary(
        text,
        sentenceCounts[summaryLength as keyof typeof sentenceCounts] || 5
      )
    }

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
