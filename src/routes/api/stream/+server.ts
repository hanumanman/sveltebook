import { GOOGLE_CLOUD_TTS_API_KEY } from '$env/static/private'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { type RequestHandler, error } from '@sveltejs/kit'

const ttsClient = new TextToSpeechClient({
  apiKey: GOOGLE_CLOUD_TTS_API_KEY
})

export const POST: RequestHandler = async ({ request }) => {
  const { text } = await request.json()

  if (!text || text.trim().length === 0) {
    return error(400, 'Text is required')
  }

  const sentences = text.split('.')

  const stream = new ReadableStream({
    async start(controller) {
      for (const sentence of sentences) {
        const [response] = await ttsClient.synthesizeSpeech({
          input: { text: sentence },
          voice: {
            languageCode: 'vi-VN',
            name: 'vi-VN-Chirp3-HD-Laomedeia'
          },
          audioConfig: {
            audioEncoding: 'MP3'
          }
        })
        controller.enqueue(response.audioContent)
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'audio/mp3',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked'
    }
  })
}
