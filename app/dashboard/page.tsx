'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Languages, Calendar, BarChart3, Mic, AlertCircle, MapPin, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const features = [
    {
      title: 'Document Summarizer',
      description: 'Extract key points and generate concise summaries from long documents.',
      icon: FileText,
      href: '/dashboard/summarizer',
    },
    {
      title: 'Language Translator',
      description: 'Translate text between multiple languages with high accuracy.',
      icon: Languages,
      href: '/dashboard/translator',
    },
    {
      title: 'Schedule Manager',
      description: 'Create and manage your schedule intelligently with smart reminders.',
      icon: Calendar,
      href: '/dashboard/scheduler',
    },
    {
      title: 'Reports Generator',
      description: 'Generate professional formatted reports from your data.',
      icon: BarChart3,
      href: '/dashboard/reports',
    },
    {
      title: 'Voice Assistant',
      description: 'Control your tasks and get information through voice commands.',
      icon: Mic,
      href: '/dashboard/voice-assistant',
    },
    {
      title: 'Emergency Information',
      description: 'Quick access to emergency contacts and critical information.',
      icon: AlertCircle,
      href: '/dashboard/emergency',
    },
    {
      title: 'Local Service Finder',
      description: 'Find nearby services and get their contact information.',
      icon: MapPin,
      href: '/dashboard/services',
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            Make your life better
          </h1>
          <p className="text-base text-muted-foreground font-light">
            Access all NEXUS AI features in one place. Choose any tool below to get started.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group relative bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-secondary rounded-lg group-hover:bg-primary transition-colors">
                    <Icon className="w-5 h-5 text-foreground group-hover:text-primary-foreground" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                </div>
                
                <h3 className="text-lg font-light text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 bg-secondary rounded-lg border border-border">
          <p className="text-sm text-muted-foreground font-light">
            today , manage , create
          </p>
        </div>
      </div>
    </div>
  )
}
