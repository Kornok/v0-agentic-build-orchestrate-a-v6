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

async function generateWithGroq(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY_3
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_3 is not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[v0] Groq API error response:', errorData)
    throw new Error(`Groq API error: ${response.status} ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

export async function POST(request: Request) {
  try {
    const { title, docType, topic } = await request.json()

    if (!title || title.trim().length === 0) {
      return Response.json({ error: 'No title provided' }, { status: 400 })
    }

    if (!topic || topic.trim().length === 0) {
      return Response.json({ error: 'No topic provided' }, { status: 400 })
    }

    let prompt = ''

    switch (docType) {
      case 'essay':
        prompt = `Write a comprehensive academic essay titled "${title}" about the following topic:

${topic}

Requirements:
- Include an introduction that sets up the topic
- Write multiple body paragraphs with detailed arguments
- Include real-world examples and evidence
- Write a strong conclusion that summarizes key points
- Use academic language and proper essay structure
- Make it informative and well-researched`
        break

      case 'email':
        prompt = `Write a professional business email with the subject "${title}" about:

${topic}

Requirements:
- Start with a professional greeting
- Clearly state the purpose in the opening paragraph
- Provide detailed information in the body
- Include specific action items or next steps
- End with a professional closing
- Use formal business language
- Keep it concise but informative`
        break

      case 'report':
        prompt = `Write a professional report titled "${title}" on the following topic:

${topic}

Requirements:
- Include an executive summary
- Add relevant sections with headers
- Include key findings or main points
- Provide analysis and insights
- Add recommendations or conclusions
- Use professional report formatting
- Include specific data points where appropriate`
        break

      case 'article':
        prompt = `Write an engaging blog article titled "${title}" about:

${topic}

Requirements:
- Start with a captivating introduction
- Write informative content sections
- Include practical tips or insights
- Use conversational but professional tone
- Include real-world examples
- Add a compelling conclusion
- Make it interesting and easy to read`
        break

      default:
        prompt = `Write content titled "${title}" about: ${topic}`
    }

    const content = await generateWithGroq(
      prompt,
      'You are a skilled professional writer. Produce well-structured, polished documents.'
    )

    const saved = await trySave('written_documents', {
      title,
      type: docType,
      content,
      topic,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content,
      type: docType,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Error in writer API:', error)
    return Response.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('written_documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ documents: [] })

    return Response.json({ documents: data })
  } catch {
    return Response.json({ documents: [] })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return Response.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('written_documents').delete().eq('id', id)

    if (error) {
      return Response.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
