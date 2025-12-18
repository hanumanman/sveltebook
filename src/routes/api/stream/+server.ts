import { EdgeSpeechTTS } from '@lobehub/tts'
import { type RequestHandler } from '@sveltejs/kit'
import { WebSocket } from 'ws'

// Polyfill WebSocket for Edge TTS
if (!global.WebSocket) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).WebSocket = WebSocket
}

export const POST: RequestHandler = async ({ request }) => {
  const { text, voice = 'vi-VN-NamMinhNeural' }: { text: string; voice?: string } =
    await request.json()

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buffer = await (response as any).arrayBuffer()
        controller.enqueue(new Uint8Array(buffer))
        controller.close()
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
