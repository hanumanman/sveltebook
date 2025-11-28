import { EdgeSpeechTTS } from '@lobehub/tts'
import { type RequestHandler, error, json } from '@sveltejs/kit'
import { WebSocket } from 'ws'

// Polyfill WebSocket for Edge TTS
if (!global.WebSocket) {
  global.WebSocket = WebSocket as any
}

export const POST: RequestHandler = async ({ request }) => {
  const { text, voice = 'vi-VN-NamMinhNeural' }: { text: string; voice?: string } = await request.json()

  if (!text || text.trim().length === 0) {
    return error(400, 'Text is required')
  }

  try {
    const tts = new EdgeSpeechTTS({ locale: 'vi-VN' })

    const response = await tts.create({
      input: text,
      options: {
        voice
      }
    })

    // Convert response to buffer
    let buffer: Buffer
    if (response instanceof ReadableStream) {
      const chunks: Uint8Array[] = []
      const reader = response.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      buffer = Buffer.concat(chunks)
    } else {
      const blob = response as Blob
      const arrayBuffer = await blob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    return json({
      audioContent: buffer.toString('base64')
    })
  } catch (err) {
    console.error('Edge TTS error:', err)
    return error(500, 'Failed to synthesize speech')
  }
}
