// Free, keyless AI text generation via Pollinations (OpenAI-compatible).
// Pollinations limits anonymous requests to 1 concurrent per IP, returning
// HTTP 429 ("Queue full") when busy, so we retry with backoff.

const POLLINATIONS_URL = "https://text.pollinations.ai/openai"

interface GenerateOptions {
  prompt: string
  system?: string
  temperature?: number
  maxTokens?: number
  model?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateFreeText({
  prompt,
  system,
  temperature = 0.7,
  maxTokens = 2000,
  model = "openai",
}: GenerateOptions): Promise<string> {
  const messages: { role: string; content: string }[] = []
  if (system) messages.push({ role: "system", content: system })
  messages.push({ role: "user", content: prompt })

  const body = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    private: true,
  })

  const maxAttempts = 6
  let lastError = "Unknown error"

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 45000)

      const res = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.status === 429) {
        // Queue full — wait with exponential backoff and retry.
        lastError = "Free AI service is busy (rate limited)"
        await sleep(1500 * (attempt + 1))
        continue
      }

      if (!res.ok) {
        lastError = `Free AI service returned ${res.status}`
        await sleep(1000 * (attempt + 1))
        continue
      }

      const data = await res.json()
      const text: string | undefined = data?.choices?.[0]?.message?.content
      if (text && text.trim().length > 0) {
        return text.trim()
      }
      lastError = "Free AI service returned an empty response"
      await sleep(1000 * (attempt + 1))
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Request failed"
      await sleep(1000 * (attempt + 1))
    }
  }

  throw new Error(lastError)
}
