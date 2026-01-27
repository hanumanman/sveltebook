import type { AudioPlayer } from './types'

const TIKTOK_PLAYER_CONSTANTS = {
  AUDIO_FETCH_TIMEOUT_MS: 45000,
  PREFETCH_CHUNK_COUNT: 5,
  CIRCLE_RADIUS: 18,
  CONSOLE_PREFIX: '[TikTokPlayer]'
} as const

export class TikTokBackend implements AudioPlayer {
  private audio: HTMLAudioElement | null = null
  private audioContext: AudioContext | null = null

  async play(text: string): Promise<void> {
    const audioBlob = await this.fetchAudio(text, 'female', new AbortController().signal)
    await this.playAudioBlob(audioBlob)
  }

  stop(): void {
    console.log('Stopping audio')
  }

  pause(): void {
    console.log('Pausing audio')
  }

  resume(): void {
    console.log('Resuming audio')
  }

  private async playAudioBlob(audioBlob: Blob): Promise<void> {
    const audioContext = new AudioContext()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.start()
  }

  private async fetchAudio(
    text: string,
    voice: 'male' | 'female',
    signal: AbortSignal
  ): Promise<Blob> {
    const timeoutSignal = AbortSignal.timeout(TIKTOK_PLAYER_CONSTANTS.AUDIO_FETCH_TIMEOUT_MS)
    const combinedSignal = AbortSignal.any([signal, timeoutSignal])

    const response = await fetch('/api/tiktok-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal: combinedSignal
    })

    if (!response.ok) {
      throw new Error(`TikTok TTS request failed with status ${response.status}`)
    }

    const blob = await response.blob()

    if (blob.size === 0) {
      throw new Error('Received empty audio blob')
    }

    if (!blob.type.startsWith('audio/')) {
      console.warn('Unexpected blob type:', blob.type)
    }

    return blob
  }
}
