'use client'

import React, { useState } from 'react'
import { Phone, Globe, MapPin, AlertCircle, Copy } from 'lucide-react'

interface EmergencyContact {
  id: string
  category: string
  title: string
  phone: string
  website: string
  description: string
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    category: 'Police',
    title: 'Emergency Police',
    phone: '911',
    website: 'https://www.fbi.gov',
    description: 'Call for police assistance in emergencies',
  },
  {
    id: '2',
    category: 'Medical',
    title: 'Emergency Medical Services',
    phone: '911',
    website: 'https://www.cdc.gov',
    description: 'Call for medical emergency assistance',
  },
  {
    id: '3',
    category: 'Fire',
    title: 'Fire Department',
    phone: '911',
    website: 'https://www.usfa.fema.gov',
    description: 'Call for fire-related emergencies',
  },
  {
    id: '4',
    category: 'Mental Health',
    title: 'National Suicide Prevention Lifeline',
    phone: '988',
    website: 'https://suicidepreventionlifeline.org',
    description: 'Free, confidential support 24/7',
  },
  {
    id: '5',
    category: 'Poison',
    title: 'Poison Control',
    phone: '1-800-222-1222',
    website: 'https://www.poison.org',
    description: 'Call for poison or toxic substance emergencies',
  },
  {
    id: '6',
    category: 'Disaster',
    title: 'Federal Emergency Management Agency',
    phone: '1-800-621-3362',
    website: 'https://www.fema.gov',
    description: 'Assistance for natural disasters and emergencies',
  },
  {
    id: '7',
    category: 'Domestic Violence',
    title: 'National Domestic Violence Hotline',
    phone: '1-800-799-7233',
    website: 'https://www.thehotline.org',
    description: 'Support for domestic violence victims',
  },
  {
    id: '8',
    category: 'Lost Person',
    title: 'National Center for Missing & Exploited Children',
    phone: '1-800-843-5678',
    website: 'https://www.missingkids.org',
    description: 'Assistance for missing persons',
  },
]

export default function EmergencyPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const callNumber = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const groupedContacts = EMERGENCY_CONTACTS.reduce((acc, contact) => {
    if (!acc[contact.category]) {
      acc[contact.category] = []
    }
    acc[contact.category].push(contact)
    return acc
  }, {} as Record<string, EmergencyContact[]>)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-destructive rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Emergency Information</h1>
              <p className="text-sm text-muted-foreground mt-1">Quick access to emergency contacts and resources</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-6 mb-8">
          <p className="text-sm text-destructive font-light">
            In a life-threatening emergency, always call 911 first. These resources are supplementary information only.
          </p>
        </div>

        {/* Emergency Contacts by Category */}
        <div className="space-y-8">
          {Object.entries(groupedContacts).map(([category, contacts]) => (
            <div key={category}>
              <h2 className="text-lg font-light text-foreground mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors">
                    <h3 className="text-base font-light text-foreground mb-2">{contact.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {contact.description}
                    </p>

                    <div className="space-y-3">
                      {/* Phone */}
                      {contact.phone && (
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-foreground" />
                            <span className="text-sm font-light text-foreground">{contact.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => callNumber(contact.phone)}
                              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                            >
                              Call
                            </button>
                            <button
                              onClick={() => copyToClipboard(contact.phone, contact.id)}
                              className="p-1 hover:bg-secondary rounded transition-colors"
                            >
                              <Copy className={`w-4 h-4 ${copied === contact.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Website */}
                      {contact.website && (
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-background rounded-lg hover:border hover:border-primary transition-colors"
                        >
                          <Globe className="w-4 h-4 text-foreground" />
                          <span className="text-sm font-light text-foreground hover:text-primary truncate">
                            Visit Website
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-secondary rounded-lg p-6 border border-border">
          <h2 className="text-lg font-light text-foreground mb-4">Safety Tips</h2>
          <ul className="space-y-2 text-sm text-muted-foreground font-light">
            <li>• Always have emergency numbers saved in your phone</li>
            <li>• Stay calm and provide clear information to emergency responders</li>
            <li>• Know your location and provide it to dispatch when calling</li>
            <li>• Follow instructions from emergency responders</li>
            <li>• Keep a list of emergency contacts with family members</li>
            <li>• Take a first aid course to help others in emergencies</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
