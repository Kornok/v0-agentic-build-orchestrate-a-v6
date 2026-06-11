import { generateFreeText, createFallbackResponse } from '@/lib/free-ai'
import { generateStudyMaterial } from '@/lib/groq-service'
import { getWikipediaContent } from '@/lib/real-api-services'
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

    // First, get Wikipedia context for accuracy
    const wikiContext = await getWikipediaContent(topic)
    
    // Use Groq AI with Wikipedia context for accurate, real study material
    let studyMaterial = ''
    try {
      const response = await generateStudyMaterial(
        topic,
        studyType as 'notes' | 'explanation' | 'quiz',
        'high-school'
      )
      studyMaterial = response.text
    } catch (err) {
      console.error('Groq AI failed, using fallback:', err)
      studyMaterial = createFallbackResponse('study', topic, topic)
      
      // If Wikipedia has content, use it
      if (wikiContext) {
        studyMaterial = wikiContext + '\n\n' + studyMaterial
      }
    }

    let fullContent = studyMaterial

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
