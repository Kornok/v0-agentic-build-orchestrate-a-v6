import { createClient } from '@/lib/supabase/server'

// In-memory fallback so the scheduler works even without a database configured.
// Note: this resets on server restart and is per-instance; configure Supabase
// for durable, multi-user persistence.
interface ScheduleRow {
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

const memoryStore: ScheduleRow[] = []

async function getSupabase() {
  try {
    return await createClient()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, startTime, endTime, category, priority } = await request.json()

    if (!title || !startTime || !endTime) {
      return Response.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          title,
          description: description || '',
          start_time: startTime,
          end_time: endTime,
          category: category || 'General',
          priority: priority || 'medium',
          completed: false,
        })
        .select()

      if (!error && data && data.length > 0) {
        return Response.json(data[0])
      }
    }

    // Fallback to in-memory store
    const row: ScheduleRow = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      start_time: startTime,
      end_time: endTime,
      category: category || 'General',
      priority: priority || 'medium',
      completed: false,
      created_at: new Date().toISOString(),
    }
    memoryStore.push(row)
    return Response.json(row)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('start_time', { ascending: true })

      if (!error) return Response.json({ schedules: data })
    }

    const sorted = [...memoryStore].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
    return Response.json({ schedules: sorted })
  } catch {
    return Response.json({ schedules: [] })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, completed } = await request.json()

    if (!id) {
      return Response.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('schedules')
        .update({ completed })
        .eq('id', id)
        .select()

      if (!error && data && data.length > 0) {
        return Response.json({ schedule: data[0] })
      }
    }

    const row = memoryStore.find((s) => s.id === id)
    if (row) row.completed = completed
    return Response.json({ schedule: row ?? null })
  } catch {
    return Response.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return Response.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const supabase = await getSupabase()
    if (supabase) {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (!error) return Response.json({ success: true })
    }

    const idx = memoryStore.findIndex((s) => s.id === id)
    if (idx !== -1) memoryStore.splice(idx, 1)
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
