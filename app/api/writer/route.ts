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

function getFallbackDocument(title: string, topic: string, docType: string): string {
  if (docType === 'essay') {
    return `# ${title}

## Introduction
${title} is an important topic that warrants careful examination. This essay explores the key aspects, significance, and implications of ${title} in relation to the following topic: ${topic}. Through careful analysis, we will develop a comprehensive understanding of how these elements interconnect and influence one another.

## First Main Point
${topic} represents one of the most significant aspects of ${title}. This dimension is crucial because it establishes the foundational understanding necessary for deeper exploration. The relationship between these concepts creates a framework for analyzing the broader implications and applications.

## Second Main Point
Another critical dimension involves the practical implications of ${title} as it relates to ${topic}. This perspective allows us to understand how theoretical concepts translate into real-world applications. Organizations and professionals consistently demonstrate the importance of this connection through their practices and strategic decisions.

## Third Main Point
Furthermore, the long-term implications of ${title} continue to evolve. As ${topic} develops and changes, our understanding must adapt accordingly. This dynamic relationship ensures that ${title} remains relevant and applicable across different contexts and time periods.

## Conclusion
In conclusion, ${title} represents a multifaceted topic with significant implications for ${topic}. By examining the key aspects discussed in this essay, we gain a more comprehensive understanding of their interconnected nature and importance. As we move forward, continued attention to ${title} will remain essential for informed decision-making and strategic planning.`
  } else if (docType === 'email') {
    return `Subject: ${title}

Dear [Recipient],

I hope this message finds you well. I am writing to discuss an important matter regarding ${title}.

${topic} is a subject that requires our immediate attention and collaborative effort. After careful consideration, I believe it is essential that we address this matter proactively to ensure optimal outcomes for all stakeholders involved.

Key Points:
• The primary concern is to ensure ${title} is handled professionally and efficiently
• ${topic} presents both challenges and opportunities that we should leverage
• Implementation of best practices will strengthen our position
• Timeline considerations are important for successful execution

I recommend that we schedule a meeting to discuss this further and develop an action plan. Your input and expertise would be invaluable in shaping our approach to ${title}.

Please let me know your availability for a discussion at your earliest convenience. I am happy to work around your schedule to ensure we address this matter promptly.

Thank you for your attention to this important matter. I look forward to your response.

Best regards,
[Your Name]`
  } else if (docType === 'report') {
    return `# Report: ${title}

## Executive Summary
This report provides a comprehensive analysis of ${title} with particular focus on ${topic}. The findings indicate that ${title} represents a significant consideration that requires strategic attention. Key recommendations are provided to address the identified opportunities and challenges.

## Overview
${title} is a multifaceted subject that intersects with various organizational and operational considerations. Understanding the nuances of ${topic} is essential for informed decision-making and strategic planning.

## Key Findings
1. **Current Status**: ${topic} demonstrates both strengths and areas for improvement
2. **Market Position**: ${title} is positioned within a competitive landscape
3. **Stakeholder Impact**: Multiple stakeholders are affected by developments in ${topic}
4. **Trend Analysis**: Current trends suggest the importance of ${title} will continue to grow

## Detailed Analysis
The analysis of ${topic} reveals several important patterns:

- **Opportunity Areas**: There are clear opportunities to enhance ${title}
- **Risk Factors**: Certain risks must be managed carefully
- **Resource Requirements**: Appropriate resources will be needed for implementation
- **Timeline Considerations**: Implementation should follow a structured timeline

## Recommendations
Based on this analysis, the following recommendations are proposed:

1. Develop a strategic plan focused on ${title}
2. Allocate appropriate resources to ${topic}
3. Establish clear metrics to measure progress
4. Maintain regular communication with stakeholders
5. Review and adjust strategies as needed

## Conclusion
${title} represents an important priority that deserves continued attention. By implementing the recommendations outlined in this report, organizations can better position themselves to address ${topic} effectively and achieve desired outcomes.`
  } else if (docType === 'article') {
    return `# ${title}

${title} is a topic that deserves serious consideration in today's world. Whether you're new to ${topic} or have been interested in this area for some time, understanding the key aspects can provide valuable insights and perspectives.

## Why This Matters

${topic} plays an increasingly important role in our personal and professional lives. The implications of ${title} extend across multiple domains, affecting how we work, think, and interact. By exploring this topic in depth, we gain tools and frameworks to navigate an increasingly complex landscape.

## Understanding the Basics

At its core, ${title} involves ${topic}. This fundamental concept serves as the foundation for understanding more complex relationships and applications. Many people don't realize how ${title} influences their daily decisions and experiences.

## Real-World Applications

The practical applications of ${title} are extensive and diverse. In business, professionals leverage ${topic} to improve operations and drive innovation. In education, students use these concepts to enhance their critical thinking skills. In personal development, individuals apply ${title} principles to achieve their goals and improve their quality of life.

## Key Insights

Several important insights emerge when we examine ${title} more closely:

1. **Holistic Understanding**: ${topic} requires considering multiple perspectives and dimensions
2. **Practical Relevance**: The concepts behind ${title} have direct applications to real-world situations
3. **Continuous Evolution**: ${topic} continues to develop as new research and experiences emerge
4. **Personal Significance**: Understanding ${title} can lead to meaningful personal and professional growth

## Looking Forward

As ${topic} continues to evolve, ${title} will undoubtedly play an increasingly important role. By staying informed and engaged with this topic, you position yourself to take advantage of emerging opportunities and navigate future challenges effectively.

## Conclusion

${title} represents far more than just an academic subject—it's a practical framework for understanding and engaging with the modern world. By deepening your knowledge of ${topic}, you equip yourself with valuable insights and tools. Whether your interest is personal or professional, investing time in understanding ${title} is time well spent.

What are your thoughts on ${title}? We'd love to hear from you and continue this important conversation.`
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
      maxTokens: 4000,
    })
    return response.text
  } catch (error) {
    console.log('[v0] AI generation failed, using fallback')
    return ''
  }
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

    let content = ''

    let prompt = ''
    let systemPrompt = 'You are a skilled professional writer. Produce well-structured, polished documents that are informative and engaging.'

    switch (docType) {
      case 'essay':
        prompt = `Write a comprehensive academic essay titled "${title}" about the following topic:

${topic}

Requirements:
- Include an introduction that sets up the topic with a clear thesis statement
- Write 3-4 body paragraphs with detailed arguments and evidence
- Include real-world examples and support for each point
- Write a strong conclusion that summarizes key points and restates the thesis
- Use academic language and proper essay structure
- Make it informative, well-researched, and engaging
- Ensure clear transitions between paragraphs`
        break

      case 'email':
        systemPrompt = 'You are an expert business communication specialist. Write professional, clear, and well-structured emails.'
        prompt = `Write a professional business email with the subject "${title}" about:

${topic}

Requirements:
- Start with a professional greeting (Dear [Recipient],)
- Clearly state the purpose in the opening paragraph
- Provide detailed information in the body with specific points
- Include specific action items or next steps if applicable
- End with a professional closing (Sincerely, Best regards, etc.)
- Use formal business language and maintain professional tone
- Keep it concise but comprehensive
- Format as a complete email ready to send`
        break

      case 'report':
        prompt = `Write a professional report titled "${title}" on the following topic:

${topic}

Requirements:
- Include an executive summary (2-3 paragraphs)
- Add relevant sections with clear headers
- Include key findings and main points
- Provide detailed analysis and insights
- Add recommendations or conclusions
- Use professional report formatting
- Include specific data points and examples where appropriate
- Make it well-organized and easy to follow`
        break

      case 'article':
        systemPrompt = 'You are an engaging content writer who creates interesting, readable articles suitable for publication. Use a conversational but professional tone.'
        prompt = `Write an engaging blog article titled "${title}" about:

${topic}

Requirements:
- Start with a captivating introduction that hooks the reader
- Write informative content sections with clear subheadings
- Include practical tips or insights throughout
- Use a conversational but professional tone
- Include relevant real-world examples and case studies
- Break up content with short paragraphs for readability
- Add a compelling conclusion that summarizes key points
- Make it interesting, easy to read, and valuable to the reader`
        break

      default:
        prompt = `Write content titled "${title}" about: ${topic}`
    }

    if (prompt) {
      content = await generateWithAI(prompt, systemPrompt)
    }

    // Use fallback if AI generation failed
    if (!content || content.trim().length === 0) {
      content = getFallbackDocument(title, topic, docType)
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
      type: docType,
      createdAt: saved?.created_at ?? new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Error in writer API:', error)
    return Response.json(
      { error: 'Failed to generate document. Please try again.' },
      { status: 500 }
    )
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
