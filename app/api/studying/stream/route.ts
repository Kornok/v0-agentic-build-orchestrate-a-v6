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

    // Create a readable stream for real-time response
    let fullContent = ''

    const studyMaterial = await generateFreeText({
      prompt,
      system: 'You are an expert tutor who creates clear, well-organized study material for students.',
      temperature: 0.7,
      onChunk: (chunk) => {
        fullContent += chunk
      },
    }).catch((err) => {
      console.error('AI generation failed, using fallback:', err)
      return createFallbackResponse('study', topic, topic)
    })

    // Save to database after streaming is complete
    const saved = await trySave('study_sessions', {
      topic,
      notes: fullContent || studyMaterial,
      explanation: fullContent || studyMaterial,
      study_type: studyType,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      notes: fullContent || studyMaterial,
      explanation: fullContent || studyMaterial,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate study material' }, { status: 500 })
  }
}
