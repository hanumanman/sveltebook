export const TIKTOK_CONFIG = {
  BASE_URL: 'https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke',
  SESSION_ID: 'afaca2a860137b3991edf331eabc014e',
  SPEAKER_MAP_TYPE: 0,
  AID: 1233,
  USER_AGENT:
    'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)',
  HEADERS: {
    'Accept-Encoding': 'gzip,deflate,compress'
  }
} as const

export enum TTVoice {
  MALE = 'BV075_streaming',
  FEMALE = 'BV074_streaming'
}

export const TIKTOK_ERROR_MESSAGES = {
  INVALID_SESSION: 'Your TikTok session id might be invalid or expired. Try getting a new one.',
  TEXT_TOO_LONG: 'The provided text is too long.',
  INVALID_SPEAKER: 'Invalid speaker, please check the list of valid speaker values.',
  NO_SESSION: 'No session id found.'
} as const

export const TIKTOK_ERROR_CODES = {
  INVALID_SESSION: 1,
  TEXT_TOO_LONG: 2,
  INVALID_SPEAKER: 4,
  NO_SESSION: 5
} as const
