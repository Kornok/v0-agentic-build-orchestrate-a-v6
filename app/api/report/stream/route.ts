import { generateFreeText, createFallbackResponse } from '@/lib/free-ai'
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
    const { title, reportType, content } = await request.json()

    if (!title || !content || title.trim().length === 0 || content.trim().length === 0) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const prompt = `Generate a professional ${reportType} report titled "${title}" based on this information:\n\n${content}

Structure it with:
- Title and date
- Executive Summary
- Key Findings (3-4 points)
- Analysis
- Recommendations
- Conclusion

Use clear formatting and professional language.`

    let fullContent = ''

    const generatedReport = await generateFreeText({
      prompt,
      system: 'You are a professional analyst who writes clear, well-formatted reports in markdown.',
      temperature: 0.6,
      onChunk: (chunk) => {
        fullContent += chunk
      },
    }).catch((err) => {
      console.error('AI generation failed, using fallback:', err)
      return createFallbackResponse('summary', content, title)
    })

    const saved = await trySave('reports', {
      title,
      content: fullContent || generatedReport,
      report_type: reportType,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content: fullContent || generatedReport,
      createdAt: saved?.generated_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
