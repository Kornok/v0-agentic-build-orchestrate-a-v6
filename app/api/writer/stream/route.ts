import { generateFreeText, createFallbackResponse } from '@/lib/free-ai'
import { generateDocument } from '@/lib/groq-service'
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
    const { title, docType, topic } = await request.json()

    if (!title || !topic || title.trim().length === 0 || topic.trim().length === 0) {
      return Response.json({ error: 'Title and topic are required' }, { status: 400 })
    }

    let prompt = ''

    if (docType === 'essay') {
      prompt = `Write a well-structured essay about "${topic}" titled "${title}"

Include:
- Introduction with thesis statement
- 3-4 main body paragraphs with supporting details
- Conclusion that summarizes key points
- Clear transitions between paragraphs

Make it engaging and informative.`
    } else if (docType === 'article') {
      prompt = `Write a professional article about "${topic}" titled "${title}"

Include:
- Compelling headline
- Introduction
- 3-4 main sections with subheadings
- Key insights and facts
- Conclusion

Make it suitable for publication.`
    } else if (docType === 'report') {
      prompt = `Write a professional report about "${topic}" titled "${title}"

Include:
- Executive Summary
- Introduction
- Key Findings (3-4 main points)
- Analysis
- Recommendations
- Conclusion

Use formal language and clear structure.`
    } else {
      prompt = `Write professional content about "${topic}" titled "${title}". Make it well-structured and engaging.`
    }

    // Use Groq AI for professional document generation
    let content = ''
    try {
      const response = await generateDocument(
        title,
        docType as 'essay' | 'email' | 'report' | 'article',
        topic,
        'professional'
      )
      content = response.text
    } catch (err) {
      console.error('Groq AI failed, using fallback:', err)
      content = createFallbackResponse('essay', topic, title)
    }

    let fullContent = content

    const saved = await trySave('written_documents', {
      title,
      type: docType,
      content: fullContent || content,
      topic,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content: fullContent || content,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}
