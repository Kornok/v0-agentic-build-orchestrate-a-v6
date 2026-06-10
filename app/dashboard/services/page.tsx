'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Phone, Globe, Star, Loader, Copy } from 'lucide-react'

interface Service {
  id: string
  serviceType: string
  name: string
  address: string
  phone: string
  website: string
  rating: number
  description: string
}

const SAMPLE_SERVICES: Service[] = [
  {
    id: '1',
    serviceType: 'Hospital',
    name: 'Central Medical Hospital',
    address: '123 Health St, City, State',
    phone: '555-0100',
    website: 'https://example.com/hospital',
    rating: 4.8,
    description: 'Full-service medical hospital with emergency room',
  },
  {
    id: '2',
    serviceType: 'Restaurant',
    name: 'Downtown Cafe',
    address: '456 Main St, City, State',
    phone: '555-0101',
    website: 'https://example.com/cafe',
    rating: 4.5,
    description: 'Family-friendly restaurant with diverse menu',
  },
  {
    id: '3',
    serviceType: 'Gas Station',
    name: 'QuickFuel Station',
    address: '789 Oak Ave, City, State',
    phone: '555-0102',
    website: 'https://example.com/fuel',
    rating: 4.2,
    description: '24-hour gas station with convenience store',
  },
  {
    id: '4',
    serviceType: 'Pharmacy',
    name: 'MediCare Pharmacy',
    address: '321 Park Rd, City, State',
    phone: '555-0103',
    website: 'https://example.com/pharmacy',
    rating: 4.7,
    description: 'Full-service pharmacy with consultation services',
  },
  {
    id: '5',
    serviceType: 'Bank',
    name: 'First National Bank',
    address: '654 Financial Plaza, City, State',
    phone: '555-0104',
    website: 'https://example.com/bank',
    rating: 4.3,
    description: 'Full-service banking with ATM and loan services',
  },
  {
    id: '6',
    serviceType: 'Hotel',
    name: 'Downtown Inn',
    address: '987 Rest St, City, State',
    phone: '555-0105',
    website: 'https://example.com/hotel',
    rating: 4.6,
    description: 'Comfortable lodging with all amenities',
  },
]

const SERVICE_TYPES = ['All', 'Hospital', 'Restaurant', 'Gas Station', 'Pharmacy', 'Bank', 'Hotel']

export default function ServicesPage() {
  const [selectedType, setSelectedType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [services, setServices] = useState<Service[]>(SAMPLE_SERVICES)
  const [copied, setCopied] = useState<string | null>(null)

  const filteredServices = services.filter((service) => {
    const typeMatch = selectedType === 'All' || service.serviceType === selectedType
    const searchMatch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       service.address.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && searchMatch
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const callService = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating})</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <MapPin className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Local Service Finder</h1>
              <p className="text-sm text-muted-foreground mt-1">Find and connect with nearby services</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Search by name or location
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Downtown Cafe, Main St..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Service Type Filter */}
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Service Type
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                      selectedType === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-border'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-lg font-light text-foreground mb-4">
            {filteredServices.length} Services Found
          </h2>

          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors">
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-light text-foreground">{service.name}</h3>
                        <p className="text-xs text-primary font-light">{service.serviceType}</p>
                      </div>
                    </div>
                    {renderStars(service.rating)}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Address */}
                  <div className="flex gap-2 mb-3 p-3 bg-background rounded-lg">
                    <MapPin className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">{service.address}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {/* Phone */}
                    {service.phone && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-foreground" />
                          <span className="text-xs font-light text-foreground">{service.phone}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => callService(service.phone)}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => copyToClipboard(service.phone, `phone-${service.id}`)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <Copy className={`w-3 h-3 ${copied === `phone-${service.id}` ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Website */}
                    {service.website && (
                      <a
                        href={service.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-background rounded-lg hover:border hover:border-primary transition-colors"
                      >
                        <Globe className="w-4 h-4 text-foreground" />
                        <span className="text-xs font-light text-foreground hover:text-primary truncate">
                          Visit Website
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-light">No services found. Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
