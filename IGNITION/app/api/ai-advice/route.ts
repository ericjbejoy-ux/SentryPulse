import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        advice: "⚠️ API Key Missing: GROQ_API_KEY is not defined in process.env. Please restart your dev server."
      })
    }

    const groq = new Groq({ apiKey })
    const body = await request.json()
    const { startName, endName, carName, batteryKwh, rangeKm, distanceKm, stationsCount, messagesHistory } = body

    const systemPrompt = {
      role: 'system',
      content: `You are an elite EV Trip Specialist & Navigation Engine.
Route Details:
- Departure: ${startName}
- Arrival: ${endName}
- Vehicle: ${carName} (${batteryKwh} kWh, Real Range: ${rangeKm} km)
- Estimated Distance: ${distanceKm} km
- Fast Chargers Found along route: ${stationsCount}

IMPORTANT FORMATTING RULES:
1. Do NOT use Markdown tables. Present data using clean bullet points and bold section headings.
2. Keep responses concise, structured, legible, and directly under 180 words.`
    }

    const formattedMessages = [systemPrompt, ...(messagesHistory || [])]

    const candidateModels = [
      'openai/gpt-oss-120b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-20b'
    ]

    let completion = null
    let lastError = null

    for (const modelId of candidateModels) {
      try {
        completion = await groq.chat.completions.create({
          messages: formattedMessages as any,
          model: modelId,
          temperature: 0.3,
        })
        if (completion) break
      } catch (err: any) {
        lastError = err
      }
    }

    if (!completion) {
      throw lastError
    }

    return NextResponse.json({ advice: completion.choices[0]?.message?.content || 'Unable to compute AI response.' })
  } catch (error: any) {
    console.error("GROQ EXECUTION ERROR:", error)
    return NextResponse.json({ advice: `AI Engine Error: ${error?.message || 'Failed to communicate with Groq.'}` }, { status: 200 })
  }
}
