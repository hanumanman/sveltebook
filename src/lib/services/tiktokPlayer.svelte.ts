import { browser } from '$app/environment'
import { plainContentToSentences } from '$lib/utils'
import { getLocalStorageItem, setLocalStorageItem } from '$lib/utils/localStorage'

import { TIKTOK_PLAYER_CONSTANTS } from './tiktokPlayer.constants'

type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading'

interface QueueItem {
  text: string
  audioPromise: Promise<Blob> | null
}

export class TikTokPlayer {
  private static instance: TikTokPlayer | null
  private audio: HTMLAudioElement | null = null
  private state: PlayerState = $state('stopped')

  private queue: QueueItem[] = []
  private currentBlobUrl: string | null = null
  private onEnded: (() => void) | null = null
  private abortController: AbortController | null = null

  private prefetchAbortController: AbortController | null = null
  private currentChunkIndex: number = 0
  private progress: number = 0
  private currentVoice: 'male' | 'female' = 'female'

  private constructor() {
    if (browser) {
      this.audio = new Audio()

      const savedRate = getLocalStorageItem('tiktokPlaybackRate', 1, parseFloat)
      if (savedRate) {
        this.audio.playbackRate = savedRate
      }

      this.audio.onended = () => {
        this.cleanupBlobUrl()
        if (this.queue.length > 0) {
          this.currentChunkIndex++
          this.updateProgress()
          this.playNextChunk()
        } else {
          this.state = 'stopped'
          this.progress = 0
          this.onEnded?.()
        }
      }

      this.audio.onplay = () => {
        this.state = 'playing'
      }

      this.audio.onpause = () => {
        if (this.state !== 'stopped') {
          this.state = 'paused'
        }
      }

      this.audio.onerror = (_e) => {
        const errorDetails = this.audio?.error
        const errorMessages = {
          1: 'MEDIA_ERR_ABORTED - The fetching process was aborted by the user',
          2: 'MEDIA_ERR_NETWORK - A network error occurred while fetching the audio',
          3: 'MEDIA_ERR_DECODE - An error occurred while decoding the audio',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The audio format is not supported'
        }

        const errorCode = errorDetails?.code
        const errorMessage = errorCode
          ? errorMessages[errorCode as keyof typeof errorMessages]
          : 'Unknown error'

        console.error('TikTok Player audio playback error:', errorMessage, errorDetails)
        console.error('Current blob URL:', this.currentBlobUrl)

        this.cleanupBlobUrl()
        this.state = 'stopped'
      }
    }
  }

  private cleanupBlobUrl() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }

  static getInstance(): TikTokPlayer {
    if (!TikTokPlayer.instance) {
      TikTokPlayer.instance = new TikTokPlayer()
    }
    return TikTokPlayer.instance
  }

  get playbackState(): PlayerState {
    return this.state
  }

  get getProgress(): number {
    return this.progress
  }

  private updateProgress() {
    const totalChunks = this.currentChunkIndex + this.queue.length
    if (totalChunks > 0) {
      this.progress = (this.currentChunkIndex / totalChunks) * 100
    } else {
      this.progress = 0
    }
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

  private prefetchNextChunks() {
    if (this.queue.length === 0) return

    const itemsToPrefetch = this.queue.slice(0, TIKTOK_PLAYER_CONSTANTS.PREFETCH_CHUNK_COUNT)

    if (!this.prefetchAbortController) {
      this.prefetchAbortController = new AbortController()
    }

    itemsToPrefetch.forEach((item, index) => {
      if (!item.audioPromise) {
        console.log(
          `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetch] Prefetching chunk +${index + 1}:`,
          item.text.substring(0, 30) + '...'
        )
        item.audioPromise = this.fetchAudio(
          item.text,
          this.currentVoice,
          this.prefetchAbortController!.signal
        ).catch((err) => {
          console.warn(
            `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetch] Failed to prefetch chunk +${index + 1}:`,
            err.message || err
          )
          item.audioPromise = null
          return Promise.reject(err)
        })
      }
    })
  }

  private async getAudioBlob(item: QueueItem): Promise<Blob> {
    if (item.audioPromise) {
      try {
        console.log(
          `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Using prefetched promise`
        )
        return await item.audioPromise
      } catch (prefetchError: unknown) {
        const errorMessage =
          prefetchError instanceof Error ? prefetchError.message : String(prefetchError)
        console.log(
          `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Prefetch failed, fetching on-demand:`,
          errorMessage
        )
        return this.fetchAudioOnDemand(item.text)
      }
    }

    this.state = 'loading'
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] State set to loading (no prefetch)`
    )
    return this.fetchAudioOnDemand(item.text)
  }

  private fetchAudioOnDemand(text: string): Promise<Blob> {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()

    console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Fetching audio...`)
    return this.fetchAudio(text, this.currentVoice, this.abortController.signal)
  }

  private playAudioFromBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    this.currentBlobUrl = url
    console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Created blob URL:`, url)

    if (!this.audio) {
      console.error(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Audio element is null!`
      )
      return
    }

    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Setting audio.src to blob URL`
    )
    this.audio.src = url

    const savedRate = getLocalStorageItem('tiktokPlaybackRate', 1, parseFloat)
    if (savedRate) {
      this.audio.playbackRate = savedRate
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Reapplied playback rate:`,
        savedRate
      )
    }

    console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Calling audio.play()`)
    this.audio.play()
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Audio playback started successfully`
    )
  }

  private async playNextChunk() {
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Starting, queue length:`,
      this.queue.length
    )

    if (this.queue.length === 0) {
      console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Queue empty, returning`)
      return
    }

    const item = this.queue.shift()
    if (!item) {
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] No item in queue, returning`
      )
      return
    }

    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Processing paragraph:`,
      item.text.substring(0, 50) + '...'
    )

    try {
      const blob = await this.getAudioBlob(item)
      this.cleanupBlobUrl()
      this.playAudioFromBlob(blob)
      this.prefetchNextChunks()
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (err.name === 'AbortError') {
        console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Fetch aborted`)
        return
      }

      console.error(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextChunk] Error occurred:`, err)
      this.state = 'stopped'
    }
  }

  play = (text: string, voice: 'male' | 'female' = 'female', onendedCallback?: () => void) => {
    this.stop()
    this.onEnded = onendedCallback || null
    this.currentVoice = voice

    const paragraphs = plainContentToSentences(text)
    this.queue = paragraphs.map((p) => ({
      text: p,
      audioPromise: null
    }))

    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} play] Text split into ${this.queue.length} paragraphs`
    )

    this.currentChunkIndex = 0
    this.progress = 0
    this.playNextChunk()
  }

  resume = () => {
    if (this.audio && this.state === 'paused') {
      this.audio.play()
    }
  }

  pause = () => {
    if (this.audio && this.state === 'playing') {
      this.audio.pause()
    }
  }

  setPlaybackRate = (rate: number) => {
    if (this.audio) {
      this.audio.playbackRate = rate
      setLocalStorageItem('tiktokPlaybackRate', rate, String)
    }
  }

  stop = () => {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    if (this.prefetchAbortController) {
      this.prefetchAbortController.abort()
      this.prefetchAbortController = null
    }

    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    this.cleanupBlobUrl()
    this.queue = []
    this.state = 'stopped'
    this.progress = 0
  }
}

export default TikTokPlayer
