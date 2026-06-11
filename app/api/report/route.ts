import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

const REPORT_TYPES = {
  summary: 'Executive Summary',
  detailed: 'Detailed Analysis',
  comparison: 'Comparison Report',
  trend: 'Trend Analysis',
  forecast: 'Forecast Report',
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { title, content, reportType } = await request.json()

    if (!title || !content) {
      return Response.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const prompt = `Generate a professional ${REPORT_TYPES[reportType as keyof typeof REPORT_TYPES] || 'General'} report with the following information:

Title: ${title}
Content: ${content}

Please format the report professionally with sections, bullet points, and clear formatting. Use markdown formatting.`

    // Generate report using AI SDK
    const { text: generatedReport } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    // Save to database
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title,
        content: generatedReport,
        report_type: reportType,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to save report' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      content: generatedReport,
      createdAt: data[0].generated_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
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

    if (error) {
      return Response.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return Response.json({ 
      reports: data,
      reportTypes: REPORT_TYPES,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return Response.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to delete report' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
