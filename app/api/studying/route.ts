import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { topic, studyType } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return Response.json(
        { error: 'No topic provided' },
        { status: 400 }
      )
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
    }

    const { text: studyMaterial } = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    // Save to database
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        topic,
        notes: studyMaterial,
        explanation: studyMaterial,
        study_type: studyType,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to save study session' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      notes: studyMaterial,
      explanation: studyMaterial,
      createdAt: data[0].created_at,
    })
  } catch (error) {
    console.error('Error:', error)
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

    if (error) {
      return Response.json(
        { error: 'Failed to fetch study sessions' },
        { status: 500 }
      )
    }

    return Response.json({ sessions: data })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch study sessions' },
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
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to delete study session' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to delete study session' },
      { status: 500 }
    )
  }
}
