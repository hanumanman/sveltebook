import { EdgeSpeechTTS } from '@lobehub/tts'
import { type RequestHandler } from '@sveltejs/kit'
import { WebSocket } from 'ws'

// Polyfill WebSocket for Edge TTS
if (!global.WebSocket) {
  global.WebSocket = WebSocket as any
}

export const POST: RequestHandler = async ({ request }) => {
  const { text, voice = 'vi-VN-NamMinhNeural' }: { text: string; voice?: string } = await request.json()

  if (!text || text.trim().length === 0) {
    return new Response('Text is required', { status: 400 })
  }

  try {
    const tts = new EdgeSpeechTTS({ locale: 'vi-VN' })

    const response = await tts.create({
      input: text,
      options: {
        voice
      }
    })

    const stream = new ReadableStream({
      async start(controller) {
        if (response instanceof ReadableStream) {
          // If it's already a ReadableStream, pipe it through
          const reader = response.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(value)
            }
            controller.close()
          } catch (error) {
            console.error('Edge TTS stream error:', error)
            controller.error(error)
          }
        } else {
          // If it's a buffer/blob, just enqueue it
          const blob = response as Blob
          const buffer = await blob.arrayBuffer()
          controller.enqueue(new Uint8Array(buffer))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Edge TTS error:', error)
    return new Response('TTS synthesis failed', { status: 500 })
  }
}
