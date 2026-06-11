/**
 * Groq AI Service - High-speed AI responses via Vercel AI Gateway
 */

import { generateText, LanguageModel } from 'ai'

interface AIResponse {
  text: string
  sources?: string[]
}

// Use Groq model via Vercel AI Gateway
async function callGroqAI(
  prompt: string,
  system: string = 'You are a helpful AI assistant.'
): Promise<string> {
  try {
    // Using the groq model identifier that works with Vercel AI Gateway
    const response = await generateText({
      model: 'groq/mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    return response.text
  } catch (error) {
    console.error('Groq AI error:', error)
    throw error
  }
}

// Study material generation with educational focus
export async function generateStudyMaterial(
  topic: string,
  studyType: 'notes' | 'explanation' | 'quiz' = 'notes',
  educationalLevel: string = 'high-school'
): Promise<AIResponse> {
  const systemPrompt = `You are an expert educator. Create comprehensive, accurate ${studyType} for a ${educationalLevel} student on the given topic. 
    ${studyType === 'notes' ? 'Format as structured bullet points with key concepts.' : ''}
    ${studyType === 'explanation' ? 'Provide a detailed explanation with examples.' : ''}
    ${studyType === 'quiz' ? 'Create 5 challenging quiz questions with answers.' : ''}`

  const prompt = `Create ${studyType} about: ${topic}`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text, sources: [`Educational content about ${topic}`] }
}

// Professional document writing
export async function generateDocument(
  title: string,
  docType: 'essay' | 'email' | 'report' | 'article',
  topic: string,
  tone: string = 'professional'
): Promise<AIResponse> {
  const systemPrompt = `You are a professional writer. Create a high-quality ${docType} with a ${tone} tone.
    ${docType === 'essay' ? 'Include introduction, body paragraphs, and conclusion.' : ''}
    ${docType === 'email' ? 'Format as a professional email with subject line.' : ''}
    ${docType === 'report' ? 'Use executive summary, findings, and recommendations.' : ''}
    ${docType === 'article' ? 'Write engaging, informative article content.' : ''}`

  const prompt = `Write a ${docType} titled "${title}" about: ${topic}`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text }
}

// Advanced summarization
export async function summarizeContent(
  content: string,
  length: 'short' | 'medium' | 'long' = 'medium',
  focus?: string
): Promise<AIResponse> {
  const lengthGuide = {
    short: '2-3 sentences',
    medium: '1 paragraph (5-7 sentences)',
    long: '2-3 paragraphs',
  }

  const systemPrompt = `You are an expert summarizer. Create a concise ${lengthGuide[length]} summary that captures key points.
    ${focus ? `Focus on: ${focus}` : ''}`

  const prompt = `Summarize the following text:\n\n${content}`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text }
}

// Report generation with data analysis
export async function generateReport(
  title: string,
  data: string,
  reportType: 'summary' | 'analysis' | 'recommendations' = 'summary'
): Promise<AIResponse> {
  const systemPrompt = `You are a professional analyst. Generate a comprehensive ${reportType} report using markdown format.
    Include relevant sections, data insights, and ${reportType === 'recommendations' ? 'actionable recommendations.' : 'clear conclusions.'}`

  const prompt = `Generate a ${reportType} report titled "${title}" based on:\n${data}`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text }
}

// Q&A and question answering
export async function answerQuestion(question: string, context?: string): Promise<AIResponse> {
  const systemPrompt = `You are a knowledgeable assistant. Provide accurate, helpful, and detailed answers to questions.
    ${context ? `Context: ${context}` : ''}`

  const text = await callGroqAI(question, systemPrompt)
  return { text }
}

// Creative writing assistance
export async function generateCreativeContent(
  prompt: string,
  style: string = 'informative'
): Promise<AIResponse> {
  const systemPrompt = `You are a creative writer. Generate content in a ${style} style.
    Be engaging, original, and thoughtful.`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text }
}

// Code explanation and generation
export async function explainCode(code: string): Promise<AIResponse> {
  const systemPrompt = `You are an expert programmer. Explain the code in detail, breaking down what each part does.`

  const prompt = `Explain this code:\n\n${code}`

  const text = await callGroqAI(prompt, systemPrompt)
  return { text }
}

// Dialogue and conversation
export async function dialogue(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<AIResponse> {
  const systemPrompt = `You are a helpful, friendly assistant. Engage in natural conversation.`

  // This would need to be adapted for streaming/multi-turn in production
  const text = await callGroqAI(userMessage, systemPrompt)
  return { text }
}
