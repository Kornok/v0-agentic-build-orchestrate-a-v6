'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, BookOpen } from 'lucide-react'

interface StudySession {
  id: string
  topic: string
  content: string
  studyType: 'notes' | 'explanation' | 'quiz'
  created_at: string
}

export default function StudyingPage() {
  const [topic, setTopic] = useState('')
  const [studyType, setStudyType] = useState<'notes' | 'explanation' | 'quiz'>('notes')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleStudy = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!topic.trim()) {
      setError('Please enter a topic to study')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/studying', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, studyType }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate study material')
        setLoading(false)
        return
      }

      setSessions([
        {
          id: data.id,
          topic,
          content: data.content,
          studyType,
          created_at: data.createdAt,
        },
        ...sessions,
      ])

      setTopic('')
      setStudyType('notes')
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
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

  const getStudyTypeLabel = (type: 'notes' | 'explanation' | 'quiz') => {
    switch (type) {
      case 'notes':
        return 'Study Notes'
      case 'explanation':
        return 'Detailed Explanation'
      case 'quiz':
        return 'Practice Quiz'
      default:
        return 'Study Material'
    }
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

        {/* Study Sessions */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Study Sessions</h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-light text-foreground text-lg">{session.topic}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{getStudyTypeLabel(session.studyType)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {session.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(session.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(session.content, session.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy content"
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
