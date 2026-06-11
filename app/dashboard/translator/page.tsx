'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Loader, Trash2, Languages } from 'lucide-react'

interface Translation {
  id: string
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  created_at: string
}

const LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  ko: 'Korean',
}

export default function TranslatorPage() {
  const [text, setText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [loading, setLoading] = useState(false)
  const [translations, setTranslations] = useState<Translation[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Fetch previous translations on load
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res = await fetch('/api/translate')
        const data = await res.json()
        setTranslations(data.translations || [])
      } catch (err) {
        console.error('Error fetching translations:', err)
      }
    }
    fetchTranslations()
  }, [])

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!text.trim()) {
      setError('Please enter some text to translate')
      return
    }

    if (sourceLanguage === targetLanguage) {
      setError('Source and target languages cannot be the same')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to translate text')
        setLoading(false)
        return
      }

      // Add to translations list
      setTranslations([
        {
          id: data.id,
          original_text: text,
          translated_text: data.translatedText,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          created_at: data.createdAt,
        },
        ...translations,
      ])

      setText('')
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

  const deleteTranslation = (id: string) => {
    setTranslations(translations.filter((t) => t.id !== id))
  }

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <Languages className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Language Translator</h1>
              <p className="text-sm text-muted-foreground mt-1">Translate text between languages</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <form onSubmit={handleTranslate} className="space-y-4">
            {/* Language Selection */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-light text-foreground mb-2">
                  Source Language
                </label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={swapLanguages}
                className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:opacity-75 transition-opacity font-light"
              >
                ⇅ Swap
              </button>

              <div className="flex-1">
                <label className="block text-sm font-light text-foreground mb-2">
                  Target Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Text to translate
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to translate..."
                className="w-full h-32 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-light hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Translating...' : 'Translate'}
            </button>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Previous Translations */}
        {translations.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Previous Translations</h2>
            <div className="space-y-4">
              {translations.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <h3 className="font-light text-foreground text-sm mb-2">
                        {LANGUAGES[item.source_language as keyof typeof LANGUAGES] || item.source_language}
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.original_text}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-light text-foreground text-sm mb-2">
                        {LANGUAGES[item.target_language as keyof typeof LANGUAGES] || item.target_language}
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">
                        {item.translated_text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(item.translated_text, item.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Copy translation"
                      >
                        <Copy className={`w-4 h-4 ${copied === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button
                        onClick={() => deleteTranslation(item.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete translation"
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

        {translations.length === 0 && !text && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No translations yet. Start translating above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
