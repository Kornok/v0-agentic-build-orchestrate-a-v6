import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { title, docType, topic } = await request.json()

    if (!title || title.trim().length === 0) {
      return Response.json(
        { error: 'No title provided' },
        { status: 400 }
      )
    }

    if (!topic || topic.trim().length === 0) {
      return Response.json(
        { error: 'No topic provided' },
        { status: 400 }
      )
    }

    let prompt = ''
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

    prompt = `Write ${style}.

Title: "${title}"
Topic: "${topic}"

Requirements:
- Make it informative and well-structured
- Use clear, professional language
- Include relevant details and examples
- Maintain proper formatting

Write the complete document:`;

    const { text: content } = await generateText({
      model: 'openai/gpt-5-mini',
      prompt,
      temperature: 0.7,
      maxOutputTokens: 3000,
    })

    // Save to database
    const { data, error } = await supabase
      .from('written_documents')
      .insert({
        title,
        type: docType,
        content,
        topic,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to save document' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      content,
      createdAt: data[0].created_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to generate document' },
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

    if (error) {
      return Response.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return Response.json({ documents: data })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch documents' },
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
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('written_documents')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
