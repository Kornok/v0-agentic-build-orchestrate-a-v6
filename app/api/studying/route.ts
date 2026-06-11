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
    const { topic, studyType } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return Response.json({ error: 'No topic provided' }, { status: 400 })
    }

    let prompt = ''

    if (studyType === 'notes') {
      prompt = `Create comprehensive study notes about "${topic}". 

Include:
- Key concepts and definitions
- Important facts and figures
- Main points to remember
- Real-world examples
- Summary of important ideas

Format it clearly with headers and bullet points for easy studying.`
    } else if (studyType === 'explanation') {
      prompt = `Provide a detailed, broad explanation of "${topic}". 

Include:
- What it is (clear definition)
- How it works (detailed explanation)
- Why it's important
- Real-world applications and use cases
- Related concepts
- Key takeaways

Make it easy to understand for someone learning this for the first time.`
    } else if (studyType === 'quiz') {
      prompt = `Create a practice quiz with Multiple Choice Questions (MCQs) about "${topic}".

Requirements:
- Generate between 10-15 practice questions
- Each question should have 4 options (A, B, C, D)
- Include the correct answer for each question
- Questions should cover different aspects of the topic
- Format each question clearly

Format example:
Question 1: [Question text]
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: B`
    } else {
      prompt = `Create comprehensive study material about "${topic}"`
    }

    // Using Groq API
    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are an expert tutor who creates clear, well-organized study material for students.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] Groq API error:', error)
      return Response.json(
        { error: 'Failed to generate study material' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const studyMaterial = data.choices[0].message.content

    const saved = await trySave('study_sessions', {
      topic,
      notes: studyMaterial,
      study_type: studyType,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content: studyMaterial,
      type: studyType,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Error in studying API:', error)
    return Response.json(
      { error: 'Failed to generate study material' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ sessions: [] })

    return Response.json({ sessions: data })
  } catch {
    return Response.json({ sessions: [] })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('study_sessions').delete().eq('id', id)

    if (error) {
      return Response.json({ error: 'Failed to delete study session' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
