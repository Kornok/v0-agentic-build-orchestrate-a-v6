'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, BookOpen } from 'lucide-react'

interface StudySession {
  id: string
  topic: string
  notes: string
  explanation: string
  created_at: string
}

export default function StudyingPage() {
  const [topic, setTopic] = useState('')
  const [studyType, setStudyType] = useState<'notes' | 'explanation' | 'quiz'>('notes')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const handleStudy = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStreamingContent('')

    if (!topic.trim()) {
      setError('Please enter a topic to study')
      return
    }

    setLoading(true)
    setIsStreaming(true)
    try {
      const response = await fetch('/api/studying/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, studyType }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate study material')
        setIsStreaming(false)
        setLoading(false)
        return
      }

      // Simulate streaming effect for better UX
      const content = data.notes || data.explanation || ''
      let displayed = ''
      for (let i = 0; i < content.length; i += 3) {
        displayed = content.slice(0, i)
        setStreamingContent(displayed)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      setSessions([
        {
          id: data.id,
          topic,
          notes: data.notes,
          explanation: data.explanation,
          created_at: data.createdAt,
        },
        ...sessions,
      ])

      setTopic('')
      setStudyType('notes')
      setStreamingContent('')
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const deleteSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <BookOpen className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Studying Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">Create study notes and explanations</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleStudy} className="space-y-4">
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Topic to Study
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Photosynthesis, French Revolution)..."
                className="w-full p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Study Type
                </label>
                <select
                  value={studyType}
                  onChange={(e) => setStudyType(e.target.value as 'notes' | 'explanation' | 'quiz')}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="notes">Study Notes</option>
                  <option value="explanation">Detailed Explanation</option>
                  <option value="quiz">Practice Quiz</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-light hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Streaming Content Preview */}
        {isStreaming && streamingContent && (
          <div className="bg-card border border-primary/20 rounded-lg p-6 mb-8 animate-pulse">
            <h2 className="text-xl font-light text-foreground mb-4">Generating Study Material...</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {streamingContent}
              <span className="animate-blink">|</span>
            </p>
          </div>
        )}

        {/* Study Sessions */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Study Sessions</h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-light text-foreground text-lg mb-4">{session.topic}</h3>

                  <div className="mb-4">
                    <h4 className="font-light text-foreground text-sm mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {session.notes}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-light text-foreground text-sm mb-2">Explanation:</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {session.explanation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(session.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(`${session.notes}\n\n${session.explanation}`, session.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy notes"
                      >
                        <Copy className={`w-4 h-4 ${copied === session.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && !topic && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No study sessions yet. Start by entering a topic above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
