'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, PenTool } from 'lucide-react'

interface WrittenDocument {
  id: string
  title: string
  type: string
  content: string
  created_at: string
}

export default function WriterPage() {
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState<'essay' | 'email' | 'report' | 'article'>('essay')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<WrittenDocument[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleWrite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !topic.trim()) {
      setError('Please enter title and topic')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, docType, topic }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate document')
        setLoading(false)
        return
      }

      setDocuments([
        {
          id: data.id,
          title,
          type: docType,
          content: data.content,
          created_at: data.createdAt,
        },
        ...documents,
      ])

      setTitle('')
      setTopic('')
      setDocType('essay')
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

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <PenTool className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Document Writer</h1>
              <p className="text-sm text-muted-foreground mt-1">Generate professional documents with AI</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleWrite} className="space-y-4">
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title (e.g., My Research Paper)..."
                className="w-full p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Topic or Outline
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe what you want to write about..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'essay' | 'email' | 'report' | 'article')}
                  className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="essay">Essay</option>
                  <option value="email">Professional Email</option>
                  <option value="report">Report</option>
                  <option value="article">Article</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-light hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Writing...' : 'Write'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Written Documents */}
        {documents.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Documents</h2>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-light text-foreground text-lg">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">Type: {doc.type}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {doc.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(doc.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(doc.content, doc.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy content"
                      >
                        <Copy className={`w-4 h-4 ${copied === doc.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete document"
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

        {documents.length === 0 && !title && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No documents yet. Start writing above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
