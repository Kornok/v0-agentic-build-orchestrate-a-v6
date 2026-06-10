import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { title, description, startTime, endTime, category, priority } = await request.json()

    if (!title || !startTime || !endTime) {
      return Response.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
    }

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

    if (error) {
      console.error('Database error:', error)
      return Response.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }

    return Response.json({
      id: data[0].id,
      ...data[0],
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true })

    if (error) {
      return Response.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    return Response.json({ schedules: data })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { id, completed } = await request.json()

    if (!id) {
      return Response.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('schedules')
      .update({ completed })
      .eq('id', id)
      .select()

    if (error) {
      return Response.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    return Response.json({ schedule: data[0] })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return Response.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
