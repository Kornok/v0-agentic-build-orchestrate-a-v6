# NEXUS AI - Setup Instructions

## Step 1: Supabase Integration Setup

Your Supabase integration has been added to the project. The necessary environment variables will be automatically configured.

**Files Added:**
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client
- `lib/supabase/proxy.ts` - Session management proxy
- `middleware.ts` - Authentication middleware

## Step 2: Create Database Tables

1. Go to your Supabase project dashboard (https://supabase.com)
2. Navigate to the **SQL Editor**
3. Click **"New Query"**
4. Copy the contents of `database-schema.sql` from this project
5. Paste it into the SQL Editor
6. Click **"Run"** to execute

This will create all 6 tables needed for:
- Document Summaries
- Translations
- Schedules
- Reports
- Emergency Information
- Local Services

## Step 3: Verify Your Environment Variables

Check that these env vars are set in your project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase public/anon key

(These should be auto-configured by the Supabase integration)

## Step 4: Continue with Feature Implementation

Once the database is ready, the following features will be built in order:

1. **Dashboard Layout** - Navigation sidebar to access all features
2. **Document Summarizer** - Extract key points from text
3. **Language Translator** - Translate text between languages
4. **Schedule Manager** - Create and manage tasks/events
5. **Reports Generator** - Generate formatted reports
6. **Voice Assistant** - Speak commands using Web Speech API
7. **Emergency Information** - Quick access to emergency contacts
8. **Local Service Finder** - Find nearby services

## File Structure

```
app/
  page.tsx (home page - UNCHANGED)
  layout.tsx
  dashboard/
    layout.tsx (sidebar navigation)
    page.tsx (dashboard home)
    summarizer/page.tsx
    translator/page.tsx
    scheduler/page.tsx
    reports/page.tsx
    voice-assistant/page.tsx
    emergency/page.tsx
    services/page.tsx
  api/
    summarize/route.ts
    translate/route.ts
    schedule/route.ts
    report/route.ts
    services/route.ts

lib/
  supabase/
    client.ts
    server.ts
    proxy.ts
```

## Important Notes

- All pages will use the **same design theme** as your home page
- **No UI modifications** to the existing landing page
- Anonymous access (no authentication required)
- Web Speech API for voice (free, browser-built-in)
