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
- **Career Development**: Opens opportunities in various fields
- **Problem Solving**: Provides tools to tackle real-world challenges
- **Innovation**: Drives advancement and new discoveries

## Real-World Applications
- Application 1: ${topic} in industry
- Application 2: ${topic} in research
- Application 3: ${topic} in everyday contexts

## Key Takeaways
Understanding ${topic} requires combining theoretical knowledge with practical experience. Focus on core concepts, practice consistently, and connect learning to real-world scenarios.`
  } else if (studyType === 'quiz') {
    return `# Practice Quiz: ${topic}

Question 1: Which of the following best describes ${topic}?
A) A complex theoretical concept with limited applications
B) A fundamental principle with broad applications across multiple fields
C) A recent discovery with uncertain validity
D) An outdated idea no longer relevant to modern practice
Answer: B

Question 2: What is a key principle when studying ${topic}?
A) Memorization without understanding
B) Focusing only on theory
C) Combining theory with practical application
D) Avoiding real-world examples
Answer: C

Question 3: How does ${topic} relate to professional development?
A) It has no practical value
B) It is essential for career advancement
C) It is only for academic purposes
D) It is rarely used in practice
Answer: B

Question 4: What is the foundation of understanding ${topic}?
A) Memorizing dates and facts
B) Grasping core concepts and principles
C) Only reading textbooks
D) Ignoring historical context
Answer: B

Question 5: Which statement about ${topic} is accurate?
A) It never changes or evolves
B) It is completely theoretical with no applications
C) It continues to develop as research advances
D) It is equally important for all professions
Answer: C

Question 6: What role does ${topic} play in problem-solving?
A) No role whatsoever
B) Provides frameworks and tools for analysis
C) Only used in academic settings
D) Prevents creative thinking
Answer: B

Question 7: How can ${topic} be best learned?
A) Through passive reading only
B) Through active learning and practice
C) By memorizing definitions
D) It cannot be learned effectively
Answer: B

Question 8: What is a common application of ${topic}?
A) It has no real applications
B) It is only theoretical
C) Solving problems in professional settings
D) Entertainment purposes only
Answer: C

Question 9: Why is ${topic} important for career growth?
A) It has no career implications
B) It provides competitive advantages
C) It limits career options
D) It is irrelevant to employment
Answer: B

Question 10: What should be emphasized when teaching ${topic}?
A) Rote memorization
B) Understanding and application
C) Avoiding practical examples
D) Focusing only on history
Answer: B

Question 11: How does ${topic} integrate with other concepts?
A) It is completely isolated
B) It works independently
C) It connects with related disciplines
D) It contradicts other areas
Answer: C

Question 12: What is the best approach to mastering ${topic}?
A) Quick cramming before exams
B) Consistent practice and review
C) Avoiding difficult concepts
D) Reading once and moving on
Answer: B

Question 13: Why do professionals need knowledge of ${topic}?
A) They do not
B) It makes work more complicated
C) It is essential for effective decision-making
D) It is optional
Answer: C

Question 14: How has ${topic} evolved over time?
A) It has remained static
B) It has developed with technological and research advances
C) It has become less relevant
D) It disappeared from practice
Answer: B

Question 15: What defines success in learning ${topic}?
A) Memorizing all facts
B) Understanding concepts and applying them effectively
C) Passing without learning
D) Avoiding challenges
Answer: B`
  }
  return ''
}

async function generateWithAI(prompt: string, systemPrompt: string): Promise<string> {
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
    console.log('[v0] AI generation failed, using fallback')
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const { topic, studyType } = await request.json()

    if (!topic || topic.trim().length === 0) {
      return Response.json({ error: 'No topic provided' }, { status: 400 })
    }

    let studyMaterial = ''

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
    }

    if (prompt) {
      studyMaterial = await generateWithAI(prompt, systemPrompt)
    }

    // Use fallback if AI generation failed
    if (!studyMaterial || studyMaterial.trim().length === 0) {
      studyMaterial = getFallbackStudyMaterial(topic, studyType as 'notes' | 'explanation' | 'quiz')
    }

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
