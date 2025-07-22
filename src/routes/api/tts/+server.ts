import { GOOGLE_CLOUD_TTS_API_KEY } from '$env/static/private'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { type RequestHandler, error, json } from '@sveltejs/kit'

const ttsClient = new TextToSpeechClient({
  apiKey: GOOGLE_CLOUD_TTS_API_KEY
})

export const POST: RequestHandler = async ({ request }) => {
  const { text }: { text: string } = await request.json()

  if (!text || text.trim().length === 0) {
    return error(400, 'Text is required')
  }

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'vi-VN',
      name: 'vi-VN-Chirp3-HD-Laomedeia'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  })

  return json(response)
}
