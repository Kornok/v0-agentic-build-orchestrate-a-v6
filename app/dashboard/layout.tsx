'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Languages, BarChart3, Mic, AlertCircle, MapPin, Home, BookOpen, PenTool } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  const features = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Studying', href: '/dashboard/studying', icon: BookOpen },
    { name: 'Document Writer', href: '/dashboard/writer', icon: PenTool },
    { name: 'Translator', href: '/dashboard/translator', icon: Languages },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Voice Assistant', href: '/dashboard/voice-assistant', icon: Mic },
    { name: 'Emergency Info', href: '/dashboard/emergency', icon: AlertCircle },
    { name: 'Local Services', href: '/dashboard/services', icon: MapPin },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card overflow-y-auto">
        <div className="p-6 border-b border-border">
          <Link href="/" className="text-xl font-light tracking-tight text-foreground">
            Nexus AI
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Dashboard</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {features.map((feature) => {
            const Icon = feature.icon
            const isActive = pathname === feature.href || (feature.href === '/dashboard' && pathname === '/dashboard')
            
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-light transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary text-opacity-75 hover:text-opacity-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {feature.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-8 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
