'use client'

import React, { useState, useEffect } from 'react'
import { Loader, Trash2, Check, Calendar } from 'lucide-react'

interface Schedule {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  category: string
  priority: string
  completed: boolean
  created_at: string
}

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-blue-500/20 text-blue-700' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-500/20 text-red-700' },
}

const CATEGORIES = ['Work', 'Personal', 'Health', 'Shopping', 'Travel', 'General']

export default function SchedulerPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('medium')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch schedules on load
  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedule')
      const data = await res.json()
      setSchedules(data.schedules || [])
    } catch (err) {
      console.error('Error fetching schedules:', err)
    }
  }

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title || !startTime || !endTime) {
      setError('Please fill in all required fields')
      return
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          category,
          priority,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create schedule')
        setLoading(false)
        return
      }

      setSchedules([...schedules, data])
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setCategory('General')
      setPriority('medium')
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed }),
      })

      if (response.ok) {
        setSchedules(
          schedules.map((s) => (s.id === id ? { ...s, completed: !completed } : s))
        )
      }
    } catch (err) {
      console.error('Error updating schedule:', err)
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setSchedules(schedules.filter((s) => s.id !== id))
      }
    } catch (err) {
      console.error('Error deleting schedule:', err)
    }
  }

  const upcomingSchedules = schedules.filter((s) => !s.completed && new Date(s.start_time) > new Date())
  const completedSchedules = schedules.filter((s) => s.completed)
  const overdueSchedules = schedules.filter((s) => !s.completed && new Date(s.start_time) <= new Date())

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <Calendar className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Schedule Manager</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your tasks and events</p>
            </div>
          </div>
        </div>

        {/* Add Schedule Form */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-light text-foreground mb-4">Add New Schedule</h2>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                className="w-full h-20 p-4 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-light text-foreground mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
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
              {loading ? 'Adding...' : 'Add Schedule'}
            </button>
          </form>
        </div>

        {/* Schedules Display */}
        {overdueSchedules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-light text-red-600 mb-4">Overdue Tasks ({overdueSchedules.length})</h2>
            <div className="space-y-3">
              {overdueSchedules.map((schedule) => (
                <div key={schedule.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-light text-foreground">{schedule.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${PRIORITIES[schedule.priority as keyof typeof PRIORITIES].color}`}>
                          {PRIORITIES[schedule.priority as keyof typeof PRIORITIES].label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(schedule.start_time).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleComplete(schedule.id, schedule.completed)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingSchedules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-light text-foreground mb-4">Upcoming ({upcomingSchedules.length})</h2>
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-light text-foreground">{schedule.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${PRIORITIES[schedule.priority as keyof typeof PRIORITIES].color}`}>
                          {PRIORITIES[schedule.priority as keyof typeof PRIORITIES].label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(schedule.start_time).toLocaleString()} - {new Date(schedule.end_time).toLocaleTimeString()}
                      </p>
                      {schedule.description && (
                        <p className="text-xs text-foreground leading-relaxed">{schedule.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleComplete(schedule.id, schedule.completed)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
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

        {completedSchedules.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-light text-muted-foreground mb-4">Completed ({completedSchedules.length})</h2>
            <div className="space-y-3 opacity-60">
              {completedSchedules.slice(0, 5).map((schedule) => (
                <div key={schedule.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-light text-foreground line-through">{schedule.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(schedule.start_time).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {schedules.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-light">No schedules yet. Create one above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
