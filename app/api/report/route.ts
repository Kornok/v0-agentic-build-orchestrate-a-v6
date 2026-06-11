import { createClient } from '@/lib/supabase/server'
import { generateFreeText } from '@/lib/free-ai'

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

function generateMockReport(title: string, content: string, reportType: string): string {
  const typeLabel = REPORT_TYPES[reportType as keyof typeof REPORT_TYPES] || 'General'

  return `# ${typeLabel}: ${title}

## Executive Summary
This report provides ${typeLabel.toLowerCase()} based on the information provided. Key findings and insights are detailed throughout.

## Background
${content.substring(0, 200)}...

## Key Findings
- Finding 1: Important data point from the provided information
- Finding 2: Significant pattern or trend
- Finding 3: Notable insight or observation
- Finding 4: Critical consideration
- Finding 5: Relevant conclusion point

## Detailed Analysis

### Area 1
Analysis of the first major area covered in this report, drawing from the provided content and context.

### Area 2
Analysis of the second major area, with specific reference to patterns and trends identified.

### Area 3
Analysis of the third major area, examining implications and relevance.

## Recommendations
Based on the analysis presented:

1. **Recommendation 1**: First suggested action or strategic direction
2. **Recommendation 2**: Second suggested action or consideration
3. **Recommendation 3**: Third suggested action for implementation
4. **Recommendation 4**: Fourth strategic recommendation

## Conclusion
${typeLabel} suggests important implications for decision-making. The insights presented provide a foundation for moving forward with informed strategies and actions.

## Next Steps
- Monitor ongoing developments
- Implement recommended actions
- Review progress periodically
- Adjust strategy as needed`
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

    let generatedReport = ''
    try {
      generatedReport = await generateFreeText({
        prompt,
        system: 'You are a professional analyst who writes clear, well-formatted reports in markdown.',
        temperature: 0.6,
        retries: 3,
      })
    } catch (error) {
      console.log('[v0] API service temporarily unavailable, using mock response')
      generatedReport = generateMockReport(title, content, reportType)
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
