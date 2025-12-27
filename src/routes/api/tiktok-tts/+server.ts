import {
  TIKTOK_CONFIG,
  TIKTOK_ERROR_CODES,
  TIKTOK_ERROR_MESSAGES,
  TTVoice
} from '$lib/server/config/tiktok'
import { error } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

const headers = {
  'User-Agent': TIKTOK_CONFIG.USER_AGENT,
  Cookie: `sessionid=${TIKTOK_CONFIG.SESSION_ID}`,
  ...TIKTOK_CONFIG.HEADERS
}

function prepareText(text: string) {
  text = text.replace('+', 'cộng')
  text = text.replace(/\s/g, '+')
  text = text.replace('&', 'và')
  return text
}

function handleStatusError(statusCode: number) {
  switch (statusCode) {
    case TIKTOK_ERROR_CODES.INVALID_SESSION:
      return error(400, `${TIKTOK_ERROR_MESSAGES.INVALID_SESSION} status_code: ${statusCode}`)
    case TIKTOK_ERROR_CODES.TEXT_TOO_LONG:
      return error(400, `${TIKTOK_ERROR_MESSAGES.TEXT_TOO_LONG} status_code: ${statusCode}`)
    case TIKTOK_ERROR_CODES.INVALID_SPEAKER:
      return error(400, `${TIKTOK_ERROR_MESSAGES.INVALID_SPEAKER} status_code: ${statusCode}`)
    case TIKTOK_ERROR_CODES.NO_SESSION:
      return error(500, `${TIKTOK_ERROR_MESSAGES.NO_SESSION} status_code: ${statusCode}`)
    default:
      throw error(500, `Unexpected status code: ${statusCode}`)
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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  timeoutMs = 30000
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return response
      }

      const text = await response.text()
      console.error(`[TikTok TTS] Attempt ${attempt}/${maxRetries} failed:`, {
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 500)
      })

      if (attempt === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries} attempts. Status: ${response.status} ${response.statusText}. Response: ${text.substring(0, 200)}`
        )
      }

      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }

      console.error(`[TikTok TTS] Attempt ${attempt}/${maxRetries} error:`, error)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw new Error('Failed after retries')
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

  const req_text = prepareText(text)

  const url = `${TIKTOK_CONFIG.BASE_URL}/?text_speaker=${voice}&req_text=${req_text}&speaker_map_type=${TIKTOK_CONFIG.SPEAKER_MAP_TYPE}&aid=${TIKTOK_CONFIG.AID}`

  try {
    const response = await fetchWithRetry(url, { method: 'POST', headers: headers })

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.error('[TikTok TTS] Non-JSON response:', text.substring(0, 500))
      throw new Error(
        `TikTok API returned non-JSON response (Content-Type: ${contentType}). Response: ${text.substring(0, 200)}`
      )
    }

    const result = await response.json()
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
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[TikTok TTS] Error:', errorMessage)
    return error(500, `tiktok-tts ${errorMessage}`)
  }
}
