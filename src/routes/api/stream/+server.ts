import { GOOGLE_CLOUD_TTS_API_KEY } from '$env/static/private'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { type RequestHandler } from '@sveltejs/kit'

const ttsClient = new TextToSpeechClient({
  apiKey: GOOGLE_CLOUD_TTS_API_KEY
})

async function synthesizeSpeech(text: string): Promise<Buffer<ArrayBufferLike>> {
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'vi-VN',
      name: 'vi-VN-Standard-A'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  })

  if (!response.audioContent) {
    throw new Error('No audio content in TTS response data')
  }
  return response.audioContent as Buffer
}

export const POST: RequestHandler = async ({ request }) => {
  const { text }: { text: string } = await request.json()

  if (!text || text.trim().length === 0) {
    return new Response('Text is required', { status: 400 })
  }

  const sentences = text
    .replaceAll('...', ' ')
    .replaceAll('"', '')
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean)

  const stream = new ReadableStream({
    async start(controller) {
      for (const sentence of sentences) {
        const audioBuffer = await synthesizeSpeech(sentence)
        controller.enqueue(new Uint8Array(audioBuffer))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'audio/mp3',
      'Transfer-Encoding': 'chunked',
      Connection: 'keep-alive'
    }
  })
}
