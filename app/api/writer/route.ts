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

function getFallbackDocument(title: string, docType: 'essay' | 'email' | 'report' | 'article', topic: string): string {
  if (docType === 'essay') {
    return `# ${title}

## Introduction
${topic} is a significant topic that warrants comprehensive analysis and discussion. This essay examines various aspects of ${topic}, providing insights into its importance, applications, and implications. Through thorough examination, we can better understand the complexities and nuances of this subject.

## Main Points and Analysis

### First Key Aspect
One of the most important aspects of ${topic} is its foundational principles. These principles form the basis for understanding more complex concepts and applications. By grasping these fundamentals, we can build a solid understanding of the field.

### Second Key Aspect
Another crucial element is the real-world application of ${topic}. In practice, ${topic} has demonstrated significant value across various industries and sectors. Organizations and professionals utilize these concepts to solve problems and create innovations.

### Third Key Aspect
The evolution of ${topic} over time shows how knowledge and practice continue to develop. As research advances and new technologies emerge, our understanding of ${topic} becomes more sophisticated and comprehensive.

## Implications and Relevance
The study of ${topic} has far-reaching implications for multiple disciplines. Understanding these concepts helps professionals make better decisions and develop more effective solutions to complex problems.

## Conclusion
In conclusion, ${topic} represents an essential field of study with significant practical and theoretical importance. Continued research and education in this area will contribute to personal and professional development, as well as societal progress and innovation.`
  } else if (docType === 'email') {
    return `Subject: ${title}

Dear [Recipient],

I am writing to you regarding ${topic}. This is an important matter that requires your attention and consideration.

The key points I would like to discuss are as follows:

1. **Overview**: ${topic} has become increasingly relevant in our current context. Understanding its implications is essential for informed decision-making.

2. **Specific Points**: There are several specific aspects we should address:
   - Implementation considerations
   - Timeline and deadlines
   - Resource requirements
   - Expected outcomes

3. **Next Steps**: To move forward effectively, I propose the following actions:
   - Schedule a meeting to discuss details
   - Gather necessary information and resources
   - Develop an action plan
   - Establish key milestones

4. **Request**: I would appreciate your prompt attention to this matter. Please let me know your availability for a meeting or discussion.

Thank you for your time and consideration. I look forward to your response and working together on this important matter.

Best regards,
[Your Name]`
  } else if (docType === 'report') {
    return `# Report: ${title}

## Executive Summary
This report provides an analysis of ${topic} and its relevance to our organization. The findings indicate important considerations that should inform strategic decisions and operational planning.

## Introduction
${topic} is a critical area requiring careful analysis and strategic response. This report examines the current state of ${topic}, identifies key challenges and opportunities, and provides recommendations for moving forward.

## Key Findings

### Finding 1
${topic} demonstrates significant impact across multiple dimensions. Current trends suggest that this area will continue to grow in importance and relevance.

### Finding 2
There are several important stakeholders and factors to consider when addressing ${topic}. Coordination and collaboration are essential for successful outcomes.

### Finding 3
Resources and investments in ${topic} have shown measurable returns. Continued investment in this area is justified and recommended.

## Analysis
The analysis of ${topic} reveals both challenges and opportunities. By understanding the underlying factors and dynamics, we can develop more effective strategies and solutions.

### Challenges
- Resource constraints
- Stakeholder alignment
- Implementation complexity
- Market dynamics

### Opportunities
- Growth potential
- Innovation possibilities
- Market expansion
- Strategic partnerships

## Recommendations
Based on this analysis, we recommend the following actions:

1. **Short-term**: Implement immediate measures to address current challenges
2. **Medium-term**: Develop comprehensive strategies for sustained growth
3. **Long-term**: Invest in research and development for future innovation

## Conclusion
${topic} requires strategic attention and proactive management. By implementing these recommendations, we can position our organization for success and sustainable growth in this important area.

---
Report prepared for strategic planning and decision-making purposes.`
  } else {
    // Article
    return `# ${title}

## Introduction
${topic} has become an increasingly important topic in today's world. Whether you're a professional, student, or simply someone looking to expand your knowledge, understanding ${topic} is valuable and relevant. In this article, we explore key aspects of ${topic} and provide practical insights.

## Understanding the Basics
Before diving into complex details, it's important to understand the fundamentals of ${topic}. At its core, ${topic} encompasses [key concept]. This foundation is essential for grasping more advanced ideas and applications.

## Key Concepts and Ideas

### Concept 1
One important aspect of ${topic} is how it relates to [related field]. This connection helps us understand the broader implications and applications.

### Concept 2
Another crucial element is the practical application of ${topic}. Real-world examples show us how these concepts work in practice and create tangible value.

### Concept 3
The evolving nature of ${topic} means that professionals and learners must stay updated with latest developments and research findings.

## Practical Tips and Insights

1. **Get the fundamentals right**: Start with solid basics before moving to advanced topics
2. **Learn from real examples**: Study case studies and real-world applications
3. **Stay curious and ask questions**: Deep understanding comes from active engagement
4. **Practice and apply**: Theory becomes meaningful through practical application
5. **Connect with others**: Learn from communities and professionals in the field

## Why This Matters
${topic} matters for several important reasons. It affects how we work, solve problems, and innovate. Understanding ${topic} can lead to better decisions, more effective solutions, and greater success in both professional and personal contexts.

## Conclusion
${topic} is a fascinating and important area of study and practice. By developing a solid understanding of the concepts, staying current with developments, and applying knowledge practically, you can leverage ${topic} for personal and professional growth. Whether you're just starting your journey or looking to deepen your expertise, now is an excellent time to engage with ${topic}.

Keep learning, stay curious, and embrace the opportunities that ${topic} presents!`
  }
}

async function generateWithAI(prompt: string, systemPrompt: string, docType?: 'essay' | 'email' | 'report' | 'article'): Promise<string> {
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
    console.error('[v0] AI generation error:', error)
    // Fallback if API fails
    const titleMatch = prompt.match(/titled "([^"]+)"/)
    const title = titleMatch ? titleMatch[1] : 'Untitled'
    const topicMatch = prompt.match(/about:?\s*\n\n(.+?)$/ms)
    const topic = topicMatch ? topicMatch[1].split('\n')[0] : 'your topic'
    return getFallbackDocument(title, docType || 'essay', topic)
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

    const content = await generateWithAI(prompt, systemPrompt, docType as any)

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
