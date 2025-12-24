import { plainContentToParagraphs } from '$lib/utils'
import { error } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

enum TTVoice {
  MALE = 'BV075_streaming',
  FEMALE = 'BV074_streaming'
}

const BASE_URL = 'https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke'
const TIKTOK_SESSION_ID = 'afaca2a860137b3991edf331eabc014e'
const headers = {
  'User-Agent':
    'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)',
  Cookie: `sessionid=${TIKTOK_SESSION_ID}`,
  'Accept-Encoding': 'gzip,deflate,compress'
}
const SPEAKER_MAP_TYPE = 0
const AID = 1233

function prepareText(text: string) {
  text = text.replace('+', 'cộng')
  text = text.replace(/\s/g, '+')
  text = text.replace('&', 'và')
  return text
}

function handleStatusError(status_code: number) {
  switch (status_code) {
    case 1:
      return error(
        400,
        `Your TikTok session id might be invalid or expired. Try getting a new one. status_code: ${status_code}`
      )
    case 2:
      return error(400, `The provided text is too long. status_code: ${status_code}`)
    case 4:
      return error(
        400,
        `Invalid speaker, please check the list of valid speaker values. status_code: ${status_code}`
      )
    case 5:
      return error(500, `No session id found. status_code: ${status_code}`)
    default:
      throw error(500, `Unexpected status code: ${status_code}`)
  }
}

function decodeBase64Audio(audioData: string): BlobPart {
  const binaryString = atob(audioData)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const text = body?.text
  const voice = body?.voice === 'male' ? TTVoice.MALE : TTVoice.FEMALE
  if (!text)
    return new Response(JSON.stringify({ error: 'Missing required text to convert' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        Connection: 'close'
      }
    })
  if (typeof text !== 'string') return error(400, { message: 'Text has to be string' })

  const paragraphs = plainContentToParagraphs(text)
  const req_text = prepareText(paragraphs[1])
  const URL = `${BASE_URL}/?text_speaker=${voice}&req_text=${req_text}&speaker_map_type=${SPEAKER_MAP_TYPE}&aid=${AID}`

  try {
    const result = await fetch(URL, { method: 'POST', headers: headers }).then((res) => res.json())
    const status_code = result?.status_code
    if (status_code !== 0) return handleStatusError(status_code)
    const encoded_voice = result?.data?.v_str
    const bytes = decodeBase64Audio(encoded_voice)
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' })

    return new Response(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString()
      }
    })
  } catch (err) {
    return error(500, `tiktok-tts ${err}`)
  }
}
