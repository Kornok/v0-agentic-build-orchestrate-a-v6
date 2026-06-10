'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, FileText } from 'lucide-react'

interface Summary {
  id: string
  original_text: string
  summary: string
  created_at: string
}

export default function SummarizerPage() {
  const [text, setText] = useState('')
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Fetch previous summaries on load
  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch('/api/summarize')
        const data = await res.json()
        setSummaries(data.summaries || [])
      } catch (err) {
        console.error('Error fetching summaries:', err)
      }
    }
    fetchSummaries()
  }, [])

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!text.trim()) {
      setError('Please enter some text to summarize')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, summaryLength }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to summarize document')
        setLoading(false)
        return
      }

      // Add to summaries list
      setSummaries([
        {
          id: data.id,
          original_text: text,
          summary: data.summary,
          created_at: data.createdAt,
        },
        ...summaries,
      ])

      setText('')
      setSummaryLength('medium')
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

  const deleteSummary = (id: string) => {
    setSummaries(summaries.filter((s) => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <FileText className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Document Summarizer</h1>
              <p className="text-sm text-muted-foreground mt-1">Extract key points from your documents</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleSummarize} className="space-y-4">
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Paste your document here
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to summarize..."
                className="w-full h-40 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Summary Length
                </label>
                <select
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(e.target.value as 'short' | 'medium' | 'long')}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="short">Short (2-3 sentences)</option>
                  <option value="medium">Medium (4-6 sentences)</option>
                  <option value="long">Long (8-10 sentences)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-light hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Summarizing...' : 'Summarize'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Previous Summaries */}
        {summaries.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Previous Summaries</h2>
            <div className="space-y-4">
              {summaries.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="font-light text-foreground text-sm mb-2">Original Text:</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.original_text}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-light text-foreground text-sm mb-2">Summary:</h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(item.summary, item.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy summary"
                      >
                        <Copy className={`w-4 h-4 ${copied === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => deleteSummary(item.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete summary"
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

        {summaries.length === 0 && !text && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No summaries yet. Start by pasting some text above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
