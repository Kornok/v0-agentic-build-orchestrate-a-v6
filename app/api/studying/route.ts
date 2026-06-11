import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// Free, zero-config via Vercel AI Gateway - no API key required
const MODEL = 'openai/gpt-5-mini'

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
      prompt = `Create comprehensive study notes on the topic: "${topic}"
      
Include:
- Key concepts and definitions
- Important facts and figures
- Main points to remember
- Examples

Format the notes in a clear, organized manner.`
    } else if (studyType === 'explanation') {
      prompt = `Provide a detailed explanation of: "${topic}"

Include:
- What it is
- How it works
- Why it's important
- Real-world applications
- Related concepts

Make it easy to understand for a student.`
    } else if (studyType === 'quiz') {
      prompt = `Create 5 practice quiz questions about: "${topic}"

Format:
Question 1: [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct option]

[Repeat for all 5 questions]`
    } else {
      prompt = `Create comprehensive study material on the topic: "${topic}"`
    }

    const { text: studyMaterial } = await generateText({
      model: MODEL,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    const saved = await trySave('study_sessions', {
      topic,
      notes: studyMaterial,
      explanation: studyMaterial,
      study_type: studyType,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      notes: studyMaterial,
      explanation: studyMaterial,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate study material' }, { status: 500 })
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
