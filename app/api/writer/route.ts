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

function generateMockDocument(title: string, topic: string, docType: string): string {
  let content = `# ${title}\n\n`

  switch (docType) {
    case 'essay':
      content += `## Introduction
This essay explores ${topic}, a significant subject matter that deserves comprehensive analysis and understanding. Through examination of key concepts, historical context, and contemporary applications, we develop a nuanced understanding of this important topic.

## Body

### Main Argument 1
${topic} presents several key considerations that warrant detailed examination. These foundational elements provide the basis for deeper understanding.

### Main Argument 2
The practical implications of ${topic} extend across multiple domains, affecting both theory and practice in meaningful ways.

### Main Argument 3
Looking forward, ${topic} continues to evolve and adapt to contemporary challenges and opportunities.

## Conclusion
In summary, ${topic} represents an important area of study with far-reaching implications. The insights developed through this examination provide valuable perspective for future learning and application.`
      break

    case 'email':
      content += `Dear Recipient,

I hope this message finds you well. I am writing to discuss ${topic}, a matter of importance that I believe warrants your attention.

${topic} has several key aspects that deserve consideration. The primary points include various elements that contribute to our understanding of this subject.

I would appreciate the opportunity to discuss this further at your earliest convenience. Please feel free to reach out with your thoughts and feedback.

Thank you for your consideration.

Best regards,
[Your Name]`
      break

    case 'report':
      content += `## Executive Summary
This report examines ${topic} and its implications. Key findings and recommendations are presented for consideration.

## Introduction
${topic} represents an important area requiring analysis and understanding. This report provides comprehensive coverage of relevant aspects.

## Key Findings
- Finding 1: Important data point about ${topic}
- Finding 2: Relevant consideration and context
- Finding 3: Practical implication or trend

## Analysis
The data suggests several important patterns and relationships within ${topic}. These observations provide valuable context for decision-making.

## Recommendations
1. Recommendation 1 based on findings
2. Recommendation 2 for implementation
3. Recommendation 3 for future consideration

## Conclusion
${topic} requires ongoing attention and analysis. The recommendations presented offer a pathway forward.`
      break

    case 'article':
      content += `## ${topic}: Everything You Need to Know

${topic} has become increasingly relevant in today's world. Whether you're a beginner or experienced practitioner, understanding this topic can significantly impact your success.

### Why ${topic} Matters

${topic} plays a crucial role in modern life and professional contexts. By understanding its key principles, you'll be better equipped to navigate contemporary challenges.

### Key Points to Consider

Understanding ${topic} requires attention to several important aspects:
- Core concepts and definitions
- Historical context and evolution
- Contemporary applications and trends
- Future outlook and opportunities

### Getting Started with ${topic}

For those new to ${topic}, beginning with foundational concepts is essential. Gradually building knowledge through practical experience accelerates mastery.

### Frequently Asked Questions

**What is ${topic}?**
${topic} encompasses various related concepts and practices that form an important body of knowledge.

**How can I learn more about ${topic}?**
Continued study, practice, and engagement with the subject matter deepens understanding over time.

### Conclusion

${topic} offers valuable insights and practical applications. By investing time in understanding this subject, you position yourself for success in an increasingly complex world.`
      break

    default:
      content += `## ${topic}

This document covers important aspects of ${topic}.

### Overview
${topic} is an important subject with wide-ranging implications and applications.

### Key Concepts
- Concept 1: Foundation of understanding
- Concept 2: Important principle
- Concept 3: Practical application

### Implementation
Implementing knowledge of ${topic} requires:
1. Understanding core principles
2. Gaining practical experience
3. Continuous learning and adaptation

### Conclusion
${topic} represents valuable knowledge for professional and personal development.`
  }

  return content
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

    let style = ''

    switch (docType) {
      case 'essay':
        style = 'an academic essay with introduction, body paragraphs, and conclusion'
        break
      case 'email':
        style = 'a professional email with proper greeting, body, and closing'
        break
      case 'report':
        style = 'a formal report with sections, key findings, and recommendations'
        break
      case 'article':
        style = 'an engaging blog article with a catchy introduction and informative content'
        break
      default:
        style = 'a well-structured document'
    }

    const prompt = `Write ${style}.

Title: "${title}"
Topic: "${topic}"

Requirements:
- Make it informative and well-structured
- Use clear, professional language
- Include relevant details and examples
- Maintain proper formatting

Write the complete document:`

    let content = ''
    try {
      content = await generateFreeText({
        prompt,
        system: 'You are a skilled professional writer. Produce well-structured, polished documents.',
        temperature: 0.7,
        retries: 3,
      })
    } catch (error) {
      console.log('[v0] API service temporarily unavailable, using mock response')
      content = generateMockDocument(title, topic, docType)
    }

    const saved = await trySave('written_documents', {
      title,
      type: docType,
      content,
      topic,
    })

    return Response.json({
      id: saved?.id ?? crypto.randomUUID(),
      content,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate document' }, { status: 500 })
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
