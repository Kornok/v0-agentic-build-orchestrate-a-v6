import { createClient } from '@/lib/supabase/server'
import { generateFreeText, createFallbackResponse } from '@/lib/free-ai'

const REPORT_TYPES = {
  summary: 'Executive Summary',
  detailed: 'Detailed Analysis',
  comparison: 'Comparison Report',
  trend: 'Trend Analysis',
  forecast: 'Forecast Report',
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
    const { title, content, reportType } = await request.json()

    if (!title || !content) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const prompt = `Generate a professional ${REPORT_TYPES[reportType as keyof typeof REPORT_TYPES] || 'General'} report with the following information:

Title: ${title}
Content: ${content}

Please format the report professionally with sections, bullet points, and clear formatting. Use markdown formatting.`

    let generatedReport: string
    try {
      generatedReport = await generateFreeText({
        prompt,
        system: 'You are a professional analyst who writes clear, well-formatted reports in markdown.',
        temperature: 0.6,
      })
    } catch (err) {
      console.error('AI generation failed, using fallback:', err)
      generatedReport = createFallbackResponse('summary', content, title)
    }

    const saved = await trySave('reports', {
      title,
      content: generatedReport,
      report_type: reportType,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content: generatedReport,
      createdAt: saved?.generated_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ reports: [], reportTypes: REPORT_TYPES })

    return Response.json({ reports: data, reportTypes: REPORT_TYPES })
  } catch {
    return Response.json({ reports: [], reportTypes: REPORT_TYPES })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return Response.json({ error: 'Report ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('reports').delete().eq('id', id)

    if (error) {
      return Response.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
