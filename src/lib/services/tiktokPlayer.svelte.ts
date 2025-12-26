import { browser } from '$app/environment'
import { plainContentToSentences } from '$lib/utils'

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

      const savedRate = localStorage.getItem('tiktokPlaybackRate')
      if (savedRate) {
        this.audio.playbackRate = parseFloat(savedRate)
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

  get getState(): PlayerState {
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
    const timeoutSignal = AbortSignal.timeout(45000)
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

    const itemsToPrefetch = this.queue.slice(0, 2)

    if (!this.prefetchAbortController) {
      this.prefetchAbortController = new AbortController()
    }

    itemsToPrefetch.forEach((item, index) => {
      if (!item.audioPromise) {
        console.log(
          `[TikTokPlayer prefetch] Prefetching chunk +${index + 1}:`,
          item.text.substring(0, 30) + '...'
        )
        item.audioPromise = this.fetchAudio(
          item.text,
          this.currentVoice,
          this.prefetchAbortController!.signal
        ).catch((err) => {
          console.warn(
            `[TikTokPlayer prefetch] Failed to prefetch chunk +${index + 1}:`,
            err.message || err
          )
          item.audioPromise = null
          return Promise.reject(err)
        })
      }
    })
  }

  private async playNextChunk() {
    console.log('[TikTokPlayer playNextChunk] Starting, queue length:', this.queue.length)

    if (this.queue.length === 0) {
      console.log('[TikTokPlayer playNextChunk] Queue empty, returning')
      return
    }

    const item = this.queue.shift()
    if (!item) {
      console.log('[TikTokPlayer playNextChunk] No item in queue, returning')
      return
    }

    console.log(
      '[TikTokPlayer playNextChunk] Processing paragraph:',
      item.text.substring(0, 50) + '...'
    )

    try {
      let blob: Blob

      if (item.audioPromise) {
        try {
          console.log('[TikTokPlayer playNextChunk] Using prefetched promise')
          blob = await item.audioPromise
        } catch (prefetchError: unknown) {
          const errorMessage =
            prefetchError instanceof Error ? prefetchError.message : String(prefetchError)
          console.log(
            '[TikTokPlayer playNextChunk] Prefetch failed, fetching on-demand:',
            errorMessage
          )
          this.state = 'loading'

          if (this.abortController) {
            this.abortController.abort()
          }
          this.abortController = new AbortController()

          blob = await this.fetchAudio(item.text, this.currentVoice, this.abortController.signal)
        }
      } else {
        this.state = 'loading'
        console.log('[TikTokPlayer playNextChunk] State set to loading (no prefetch)')

        if (this.abortController) {
          this.abortController.abort()
        }
        this.abortController = new AbortController()

        console.log('[TikTokPlayer playNextChunk] Fetching audio...')
        blob = await this.fetchAudio(item.text, this.currentVoice, this.abortController.signal)
      }

      this.cleanupBlobUrl()

      const url = URL.createObjectURL(blob)
      this.currentBlobUrl = url
      console.log('[TikTokPlayer playNextChunk] Created blob URL:', url)

      if (this.audio) {
        console.log('[TikTokPlayer playNextChunk] Setting audio.src to blob URL')
        this.audio.src = url

        const savedRate = localStorage.getItem('tiktokPlaybackRate')
        if (savedRate) {
          this.audio.playbackRate = parseFloat(savedRate)
          console.log('[TikTokPlayer playNextChunk] Reapplied playback rate:', savedRate)
        }

        console.log('[TikTokPlayer playNextChunk] Calling audio.play()')
        await this.audio.play()
        console.log('[TikTokPlayer playNextChunk] Audio playback started successfully')

        this.prefetchNextChunks()
      } else {
        console.error('[TikTokPlayer playNextChunk] Audio element is null!')
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (err.name === 'AbortError') {
        console.log('[TikTokPlayer playNextChunk] Fetch aborted')
        return
      }

      console.error('[TikTokPlayer playNextChunk] Error occurred:', err)
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

    console.log(`[TikTokPlayer play] Text split into ${this.queue.length} paragraphs`)

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
      if (browser) {
        localStorage.setItem('tiktokPlaybackRate', rate.toString())
      }
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
