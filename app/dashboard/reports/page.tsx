'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, BarChart3, Download } from 'lucide-react'

interface Report {
  id: string
  title: string
  content: string
  report_type: string
  generated_at: string
}

const REPORT_TYPES = {
  summary: 'Executive Summary',
  detailed: 'Detailed Analysis',
  comparison: 'Comparison Report',
  trend: 'Trend Analysis',
  forecast: 'Forecast Report',
}

export default function ReportsPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reportType, setReportType] = useState('summary')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/report')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    }
  }

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title || !content) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, reportType }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate report')
        setLoading(false)
        return
      }

      setReports([
        {
          id: data.id,
          title,
          content: data.content,
          report_type: reportType,
          generated_at: data.createdAt,
        },
        ...reports,
      ])

      setTitle('')
      setContent('')
      setReportType('summary')
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

  const downloadReport = (report: Report) => {
    const element = document.createElement('a')
    const file = new Blob([report.content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${report.title}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const deleteReport = async (id: string) => {
    try {
      await fetch('/api/report', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setReports(reports.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Error deleting report:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <BarChart3 className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Reports Generator</h1>
              <p className="text-sm text-muted-foreground mt-1">Create professional reports instantly</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 Sales Analysis"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(REPORT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Content / Data
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your data, findings, or information here..."
                className="w-full h-40 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-light hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </form>
        </div>

        {/* Reports List */}
        {reports.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Generated Reports</h2>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-light text-foreground">{report.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {REPORT_TYPES[report.report_type as keyof typeof REPORT_TYPES] || report.report_type} • {new Date(report.generated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-background rounded-lg p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {report.content.substring(0, 500)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(report.content, report.id)}
                      className="flex items-center gap-2 px-3 py-1 text-xs font-light text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy full report"
                    >
                      <Copy className={`w-4 h-4 ${copied === report.id ? 'text-primary' : ''}`} />
                      {copied === report.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadReport(report)}
                      className="flex items-center gap-2 px-3 py-1 text-xs font-light text-muted-foreground hover:text-foreground transition-colors"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="ml-auto px-3 py-1 text-xs font-light text-destructive hover:bg-destructive/10 rounded transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reports.length === 0 && !title && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No reports generated yet. Create one above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
