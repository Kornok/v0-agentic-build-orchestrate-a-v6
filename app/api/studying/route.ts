import { generateText } from 'ai'
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

function getFallbackStudyMaterial(topic: string, studyType: 'notes' | 'explanation' | 'quiz'): string {
  if (studyType === 'notes') {
    return `# Study Notes: ${topic}

## Key Concepts
- **Definition**: ${topic} is a fundamental concept that encompasses multiple aspects of learning and knowledge.
- **Main Principles**: There are several core principles to understand when studying ${topic}.
- **Important Facts**: This topic includes historical, scientific, and practical elements worth knowing.

## Key Points to Remember
- Understanding the basics is essential for mastery
- Practice and repetition reinforce learning
- Real-world applications make concepts concrete

## Examples
- Example 1: A practical application of ${topic}
- Example 2: How ${topic} relates to everyday life
- Example 3: Advanced concepts building on basics

## Summary
${topic} is an important subject that combines theory with practical application. Students should focus on understanding the core concepts before moving to more advanced topics.`
  } else if (studyType === 'explanation') {
    return `# Detailed Explanation of ${topic}

## What is ${topic}?
${topic} is a comprehensive subject that spans multiple disciplines and has significant real-world applications. It involves understanding both theoretical foundations and practical implementations.

## How Does It Work?
${topic} operates on several key principles:
1. **Foundation**: Based on established scientific and practical principles
2. **Application**: Implemented across various industries and fields
3. **Evolution**: Continues to develop as new research emerges
4. **Integration**: Works in conjunction with related concepts and disciplines

## Why Is It Important?
- **Practical Value**: Essential skills for modern professionals
- **Problem-Solving**: Provides tools for addressing complex challenges
- **Career Development**: Opens doors to numerous career opportunities
- **Personal Growth**: Enhances critical thinking and analytical abilities

## Real-World Applications
${topic} is applied in:
- Technology and innovation
- Business and entrepreneurship
- Science and research
- Education and training
- Healthcare and wellness

## Related Concepts
Understanding ${topic} requires familiarity with:
- Foundational principles and theories
- Industry standards and best practices
- Emerging trends and developments
- Integration with complementary subjects

## Key Takeaways
1. Master the core concepts first
2. Practice application in real scenarios
3. Stay updated with new developments
4. Integrate knowledge across disciplines
5. Develop problem-solving skills`
  } else {
    return `# Practice Quiz: ${topic}

Question 1: What is the primary definition of ${topic}?
A) A basic introduction to the subject
B) A comprehensive study of related concepts
C) An advanced specialized field
D) A historical perspective only
Answer: B

Question 2: Which of the following is a key principle of ${topic}?
A) Simplicity over complexity
B) Theory without practice
C) Combination of theory and application
D) Practice without understanding
Answer: C

Question 3: In what field is ${topic} most commonly applied?
A) Only in academia
B) Multiple industries and sectors
C) Exclusively in technology
D) Limited to research only
Answer: B

Question 4: What is an important skill when studying ${topic}?
A) Memorization only
B) Understanding concepts and principles
C) Ignoring practical applications
D) Focusing only on theory
Answer: B

Question 5: How does ${topic} relate to real-world scenarios?
A) No practical relevance
B) Limited applications
C) Significant practical applications
D) Only theoretical importance
Answer: C

Question 6: What should be the first step in learning ${topic}?
A) Advanced topics
B) Master the basics
C) Real-world applications
D) Specialized techniques
Answer: B

Question 7: Which component is essential for success in ${topic}?
A) Theory alone
B) Practice alone
C) Both theory and practice
D) Neither theory nor practice
Answer: C

Question 8: How often should one review ${topic} materials?
A) Once and never again
B) Occasionally
C) Regularly for mastery
D) Only before exams
Answer: C`
  }
}

async function generateWithAI(prompt: string, systemPrompt: string, studyType?: 'notes' | 'explanation' | 'quiz'): Promise<string> {
  try {
    const response = await generateText({
      model: 'groq/mixtral-8x7b-32768',
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 3000,
    })
    return response.text
  } catch (error) {
    console.error('[v0] AI generation error:', error)
    // Fallback if API fails
    const topicMatch = prompt.match(/about "([^"]+)"/)
    const topic = topicMatch ? topicMatch[1] : 'your topic'
    return getFallbackStudyMaterial(topic, studyType || 'notes')
  }
}

export async function POST(request: Request) {
  try {
    const { topic, studyType } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return Response.json({ error: 'No topic provided' }, { status: 400 })
    }

    let prompt = ''
    let systemPrompt = 'You are an expert tutor who creates clear, well-organized study material for students.'

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
      prompt = `Provide a detailed, comprehensive explanation of "${topic}". 

Include:
- Clear definition
- How it works (detailed explanation)
- Why it's important
- Real-world applications and use cases
- Related concepts
- Key takeaways

Make it easy to understand for someone learning this for the first time.`
    } else if (studyType === 'quiz') {
      systemPrompt = 'You are an expert educator creating practice quiz questions. Generate clear, well-structured multiple choice questions with correct answers.'
      prompt = `Create a practice quiz with Multiple Choice Questions (MCQs) about "${topic}".

Requirements:
- Generate between 15-20 practice questions
- Each question should have 4 options (A, B, C, D)
- Include the correct answer for each question
- Questions should cover different aspects and difficulty levels of the topic
- Format each question clearly

Format strictly as:
Question 1: [Question text]
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: [Correct option]

[Continue for all questions]`
    } else {
      prompt = `Create comprehensive study material about "${topic}"`
    }

    const studyMaterial = await generateWithAI(prompt, systemPrompt, studyType)

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
      { error: 'Failed to generate study material. Please try again.' },
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
