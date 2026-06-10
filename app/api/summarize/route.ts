import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { text, summaryLength = 'medium' } = await request.json()

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    // Determine prompt based on summary length
    const lengthInstructions = {
      short: 'Create a 2-3 sentence summary.',
      medium: 'Create a 4-6 sentence summary.',
      long: 'Create a 8-10 sentence summary.',
    }

    const prompt = `You are an expert summarizer. ${lengthInstructions[summaryLength as keyof typeof lengthInstructions] || lengthInstructions.medium}

Text to summarize:
${text}

Please provide a clear, concise summary that captures the main points.`

    // Generate summary using AI SDK
    const { text: summary } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Save to database
    const { data, error } = await supabase
      .from('document_summaries')
      .insert({
        original_text: text,
        summary: summary,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to save summary' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      summary: summary,
      createdAt: data[0].created_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to summarize document' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return Response.json(
        { error: 'Failed to fetch summaries' },
        { status: 500 }
      )
    }

    return Response.json({ summaries: data })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}
