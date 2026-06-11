'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Loader, Copy } from 'lucide-react'

interface Command {
  id: string
  command: string
  response: string
  timestamp: Date
}

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [commands, setCommands] = useState<Command[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setError('')
      }

      recognitionRef.current.onresult = (event: any) => {
        let transcript = ''
        let isFinal = false
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
          if (event.results[i].isFinal) isFinal = true
        }

        if (isFinal) {
          handleCommand(transcript)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        setError('Microphone error: ' + event.error)
        setIsListening(false)
      }
    } else {
      setError('Web Speech API not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const handleCommand = async (transcript: string) => {
    const command = transcript.toLowerCase().trim()
    let response = ''
    let navigateTo = ''

    // Navigation commands - actually route the user
    const routes: { keywords: string[]; href: string; label: string }[] = [
      { keywords: ['scheduler', 'schedule'], href: '/dashboard/scheduler', label: 'Schedule Manager' },
      { keywords: ['translator', 'translate'], href: '/dashboard/translator', label: 'Translator' },
      { keywords: ['summarizer', 'summarize'], href: '/dashboard/summarizer', label: 'Summarizer' },
      { keywords: ['report'], href: '/dashboard/reports', label: 'Reports Generator' },
      { keywords: ['studying', 'study'], href: '/dashboard/studying', label: 'Studying Assistant' },
      { keywords: ['writer', 'write'], href: '/dashboard/writer', label: 'Document Writer' },
      { keywords: ['emergency'], href: '/dashboard/emergency', label: 'Emergency Info' },
      { keywords: ['services', 'service'], href: '/dashboard/services', label: 'Local Service Finder' },
      { keywords: ['dashboard', 'home'], href: '/dashboard', label: 'Dashboard' },
    ]

    const matchedRoute =
      command.includes('go to') || command.includes('open') || command.includes('navigate')
        ? routes.find((r) => r.keywords.some((k) => command.includes(k)))
        : undefined

    if (command.includes('hello') || command.includes('hi ') || command === 'hi') {
      response = 'Hello! I am your NEXUS AI voice assistant. How can I help you today?'
    } else if (command.includes('time')) {
      response = `It is currently ${new Date().toLocaleTimeString()}`
    } else if (command.includes('date')) {
      response = `Today is ${new Date().toLocaleDateString()}`
    } else if (matchedRoute) {
      response = `Opening ${matchedRoute.label}.`
      navigateTo = matchedRoute.href
    } else {
      response = `I heard: "${transcript}". I can help you with scheduling, translating, summarizing, reports, and more. Try saying "go to scheduler".`
    }

    // Add to commands history
    const newCommand: Command = {
      id: Math.random().toString(36),
      command: transcript,
      response: response,
      timestamp: new Date(),
    }

    setCommands((prev) => [newCommand, ...prev])

    // Speak the response
    speakResponse(response)

    // Navigate after a short delay so the response is visible/spoken
    if (navigateTo) {
      setTimeout(() => router.push(navigateTo), 1200)
    }
  }

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <Mic className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Voice Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">Control NEXUS AI with your voice</p>
            </div>
          </div>
        </div>

        {/* Voice Control */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 text-center">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`p-8 rounded-full transition-all ${
                isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              } disabled:opacity-50`}
            >
              <Mic className="w-8 h-8" />
            </button>

            <div className="min-h-8">
              {isListening && (
                <p className="text-sm text-muted-foreground animate-pulse">Listening...</p>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Speaking...</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground max-w-sm">
              Click the microphone button and speak your command. Try saying "hello", "what time is it", or "go to scheduler".
            </p>
          </div>
        </div>

        {/* Available Commands */}
        <div className="mb-8 bg-secondary rounded-lg p-6 border border-border">
          <h2 className="text-lg font-light text-foreground mb-4">Available Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">"What time is it?" - Get current time</p>
            </div>
            <div>
              <p className="text-muted-foreground">"What is today's date?" - Get current date</p>
            </div>
            <div>
              <p className="text-muted-foreground">"Go to scheduler" - Navigate to Schedule Manager</p>
            </div>
            <div>
              <p className="text-muted-foreground">"Go to translator" - Navigate to Translator</p>
            </div>
            <div>
              <p className="text-muted-foreground">"Go to summarizer" - Navigate to Document Summarizer</p>
            </div>
            <div>
              <p className="text-muted-foreground">"Go to reports" - Navigate to Reports Generator</p>
            </div>
          </div>
        </div>

        {/* Command History */}
        {commands.length > 0 && (
          <div>
            <h2 className="text-xl font-light text-foreground mb-4">Command History</h2>
            <div className="space-y-4">
              {commands.map((cmd) => (
                <div key={cmd.id} className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Your command:</p>
                    <p className="text-sm text-foreground italic">"{cmd.command}"</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Response:</p>
                    <p className="text-sm text-foreground leading-relaxed">{cmd.response}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{cmd.timestamp.toLocaleTimeString()}</span>
                    <button
                      onClick={() => copyToClipboard(cmd.response, cmd.id)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Copy className={`w-4 h-4 ${copied === cmd.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
