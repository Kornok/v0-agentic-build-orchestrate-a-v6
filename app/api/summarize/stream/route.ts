import { generateFreeText, extractiveSummary } from '@/lib/free-ai'
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

const sentenceCounts: Record<string, number> = {
  short: 2,
  medium: 4,
  long: 6,
}

export async function POST(request: Request) {
  try {
    const { text, summaryLength = 'medium' } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'Text is required' }, { status: 400 })
    }

    const prompt = `Summarize the following text into ${summaryLength} form. Keep only the most important points:\n\n${text}`

    let summary = ''
    try {
      summary = await generateFreeText({
        prompt,
        system: 'You are an expert summarizer. Respond only with the summary text.',
        temperature: 0.5,
        retries: 2,
        onChunk: (chunk) => {
          summary += chunk
        },
      })
    } catch (err) {
      console.error('AI summarization failed, using local fallback:', err)
      summary = extractiveSummary(
        text,
        sentenceCounts[summaryLength as keyof typeof sentenceCounts] || 5
      )
    }

    const saved = await trySave('summaries', {
      original_text: text.substring(0, 1000),
      summary_text: summary,
      summary_length: summaryLength,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      summary,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to summarize text' }, { status: 500 })
  }
}
