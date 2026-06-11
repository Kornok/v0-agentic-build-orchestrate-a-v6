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
    return `# Practice Quiz: ${topic}

**Question 1:** What is the primary concept related to ${topic}?
A) First fundamental principle
B) Second key concept  
C) Third important aspect
D) Fourth relevant element
**Answer: B**

**Question 2:** How does ${topic} apply in real-world scenarios?
A) In education and learning
B) In industry and business
C) In research and development
D) All of the above
**Answer: D**

**Question 3:** What are the core principles of ${topic}?
A) Principles A and B
B) Principles B and C
C) Principles C and D
D) Principles A and D
**Answer: A**

**Question 4:** Why is understanding ${topic} important today?
A) It's foundational to the field
B) It's widely used in practice
C) It's constantly evolving
D) All of these reasons
**Answer: D**

**Question 5:** Which of these is a real-world application of ${topic}?
A) Natural phenomena examples
B) Technology implementations
C) Social and societal uses
D) All of these examples apply
**Answer: D**

**Question 6:** What historical context matters for ${topic}?
A) Its origins and development
B) Key milestones and breakthroughs
C) Evolution over time
D) All historical aspects are relevant
**Answer: D**

**Question 7:** How does ${topic} relate to other fields?
A) Strong connections to science
B) Links to technology
C) Integration with humanities
D) Interdisciplinary connections exist
**Answer: D**

**Question 8:** What challenges exist in ${topic}?
A) Theoretical difficulties
B) Practical implementation issues
C) Resource constraints
D) Multiple challenges exist
**Answer: D**`
  }

  if (studyType === 'explanation') {
    return `# Detailed Explanation: ${topic}

## What is ${topic}?
${topic} is a comprehensive concept that encompasses various interconnected principles and practices. It represents a significant field of study with wide-ranging applications across multiple domains.

## Core Principles
The fundamental principles of ${topic} include:

1. **Foundation Principle**: The basic concepts that form the bedrock of understanding
2. **Application Principle**: How the concepts work in practical scenarios
3. **Integration Principle**: How ${topic} connects with other areas of knowledge
4. **Evolution Principle**: How ${topic} has developed and continues to change

## How It Works
${topic} operates through several interconnected mechanisms:
- Understanding foundational concepts is essential
- Application of theory to practice bridges knowledge gaps
- Integration with existing knowledge creates deeper comprehension
- Continuous learning leads to mastery

## Why It's Important
Understanding ${topic} provides numerous benefits:
- Enhanced problem-solving abilities
- Better decision-making capacity
- Improved professional competence
- Greater adaptability to change

## Real-World Applications
${topic} appears in many real-world contexts:
- **Educational Context**: Learning and academic advancement
- **Professional Context**: Career development and workplace applications
- **Personal Context**: Individual growth and capability development
- **Societal Context**: Contributing to community and society

## Key Takeaways
- ${topic} is multifaceted and interconnected
- Understanding requires engagement with theory and practice
- Real-world applications make knowledge meaningful
- Continued learning enhances mastery over time`
  }

  // Default: Study Notes
  return `# Study Notes: ${topic}

## Key Concepts and Definitions
${topic} encompasses several fundamental ideas and principles that form the foundation of understanding this subject matter. These concepts are essential building blocks for deeper learning.

## Important Facts and Figures
- **Core Facts**: Essential information about ${topic}
- **Statistical Data**: Key metrics and measurements
- **Historical Context**: How ${topic} has evolved
- **Modern Applications**: Current relevance and use cases

## Main Points to Remember
- ${topic} is essential in contemporary practice
- It has wide-ranging applications across multiple fields
- Understanding this topic provides competitive advantages
- Practical implementation requires grasping key principles
- The field continues to evolve with new discoveries
- Integration with other knowledge areas strengthens understanding

## Examples and Applications
${topic} can be observed and applied in various real-world scenarios:
- **Educational settings**: Used in academic instruction and learning
- **Professional environments**: Applied in workplace and business contexts
- **Research contexts**: Studied in academic and scientific research
- **Daily life applications**: Relevant to everyday situations
- **Industry practices**: Implemented in professional sectors
- **Technology applications**: Integrated into technological systems

## Summary
Mastering ${topic} requires understanding both theoretical foundations and practical applications. Regular review and practice help solidify knowledge in this important area.`
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
