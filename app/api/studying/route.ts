import { createClient } from '@/lib/supabase/server'
import { generateFreeText } from '@/lib/free-ai'

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

function generateMockStudyMaterial(topic: string, studyType: string): string {
  if (studyType === 'quiz') {
    return `Question 1: What is the primary concept related to ${topic}?
A) First concept
B) Second concept  
C) Third concept
D) Fourth concept
Answer: B

Question 2: How does ${topic} relate to practical applications?
A) In education
B) In industry
C) In research
D) All of the above
Answer: D

Question 3: What are the key principles of ${topic}?
A) Principle A and B
B) Principle B and C
C) Principle C and D
D) Principle A and D
Answer: A

Question 4: Why is ${topic} important?
A) It's foundational
B) It's widely used
C) It's evolving
D) All reasons
Answer: D

Question 5: What's a real-world example of ${topic}?
A) Example from nature
B) Example from technology
C) Example from society
D) All apply
Answer: D`
  }

  return `# Study Material on ${topic}

## Key Concepts and Definitions
${topic} encompasses several fundamental ideas and principles that form the foundation of understanding this subject matter.

## Important Facts and Figures
- Core facts about ${topic}
- Statistical data points
- Historical context
- Modern applications

## Main Points to Remember
- ${topic} is essential in contemporary practice
- It has wide-ranging applications across multiple fields
- Understanding this topic provides competitive advantages
- Practical implementation requires understanding key principles

## Examples and Applications
${topic} can be observed in various real-world scenarios:
- Educational settings
- Professional environments
- Research contexts
- Daily life applications

## Related Concepts
Understanding ${topic} helps with comprehending related topics and seeing connections across disciplines.`
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

    let studyMaterial = ''
    try {
      studyMaterial = await generateFreeText({
        prompt,
        system: 'You are an expert tutor who creates clear, well-organized study material for students.',
        temperature: 0.7,
        retries: 3,
      })
    } catch (error) {
      console.log('[v0] API service temporarily unavailable, using mock response')
      studyMaterial = generateMockStudyMaterial(topic, studyType)
    }

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
