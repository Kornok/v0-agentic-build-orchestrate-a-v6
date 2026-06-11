import { generateFreeText, createFallbackResponse } from '@/lib/free-ai'
import { generateReport } from '@/lib/groq-service'
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

    // Use Groq AI for professional report generation
    let generatedReport = ''
    try {
      const response = await generateReport(
        title,
        content,
        reportType as 'summary' | 'analysis' | 'recommendations'
      )
      generatedReport = response.text
    } catch (err) {
      console.error('Groq AI failed, using fallback:', err)
      generatedReport = createFallbackResponse('summary', content, title)
    }

    let fullContent = generatedReport

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
