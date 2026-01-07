import { browser } from '$app/environment'
import { plainContentToSentences } from '$lib/utils'
import { setLocalStorageItem } from '$lib/utils/localStorage'

const TIKTOK_PLAYER_CONSTANTS = {
  AUDIO_FETCH_TIMEOUT_MS: 45000,
  PREFETCH_CHUNK_COUNT: 5,
  CIRCLE_RADIUS: 18,
  CONSOLE_PREFIX: '[TikTokPlayer]'
} as const

type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading'

interface QueueItem {
  text: string
  audioPromise: Promise<Blob> | null
}

export class TikTokPlayer {
  private static instance: TikTokPlayer | null
  private audio: HTMLAudioElement | null = null
  private state: PlayerState = $state('stopped')

  private audioContext: AudioContext | null = null
  private audioSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null

  private queue: QueueItem[] = []
  private currentBlobUrl: string | null = null
  private onEnded: (() => void) | null = null
  private abortController: AbortController | null = null

  private currentChunkIndex: number = 0
  private currentVoice: 'male' | 'female' = 'female'

  private readonly batchSize: number = 6
  private bufferQueue: AudioBuffer[] = []
  private isPrefetching: boolean = false

  private constructor() {
    if (browser) {
      this.audio = new Audio()
    }
  }

  private cleanupBlobUrl() {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }

  private cleanupAudioSource() {
    if (this.audioSource) {
      try {
        this.audioSource.stop()
      } catch (_e) {
        console.error(
          `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} cleanupAudioSource] Error cleaning up audio source`
        )
      }
      this.audioSource.disconnect()
      this.audioSource = null
    }
  }

  private async initializeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  private async decodeAllBlobs(blobs: Blob[]): Promise<AudioBuffer[]> {
    await this.initializeAudioContext()
    if (!this.audioContext) throw new Error('AudioContext not initialized')

    const decodePromises = blobs.map(async (blob) => {
      const arrayBuffer = await blob.arrayBuffer()
      return await this.audioContext!.decodeAudioData(arrayBuffer)
    })

    return Promise.all(decodePromises)
  }

  private mergeAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
    if (buffers.length === 0) {
      throw new Error('No audio buffers to merge')
    }
    if (buffers.length === 1) {
      return buffers[0]
    }

    const firstBuffer = buffers[0]
    const numberOfChannels = firstBuffer.numberOfChannels
    const sampleRate = firstBuffer.sampleRate

    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0)

    const mergedBuffer = this.audioContext!.createBuffer(numberOfChannels, totalLength, sampleRate)

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const mergedChannel = mergedBuffer.getChannelData(channel)
      let offset = 0

      for (const buffer of buffers) {
        const sourceChannel = buffer.getChannelData(channel)
        mergedChannel.set(sourceChannel, offset)
        offset += buffer.length
      }
    }

    return mergedBuffer
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

  get getCurrentChunkNumber(): number {
    return this.currentChunkIndex + 1
  }

  get getTotalChunks(): number {
    return this.queue.length
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

  play = async (
    text: string,
    voice: 'male' | 'female' = 'female',
    onendedCallback?: () => void
  ) => {
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
    this.bufferQueue = []
    this.state = 'loading'

    try {
      await this.fetchAndPlayFirstBatch()
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} play] Error:`, err)
      this.state = 'stopped'
    }
  }

  private async fetchBatch(startIndex: number): Promise<Blob[]> {
    const endIndex = Math.min(startIndex + this.batchSize, this.queue.length)
    const items = this.queue.slice(startIndex, endIndex)

    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchBatch] Fetching chunks ${startIndex + 1}-${endIndex}/${this.queue.length}`
    )

    if (!this.abortController) {
      this.abortController = new AbortController()
    }

    const promises = items.map((item) =>
      this.fetchAudio(item.text, this.currentVoice, this.abortController!.signal)
    )
    return Promise.all(promises)
  }

  private async fetchAndPlayFirstBatch(): Promise<void> {
    const blobs = await this.fetchBatch(0)
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayFirstBatch] Fetched ${blobs.length} chunks, decoding...`
    )

    const audioBuffers = await this.decodeAllBlobs(blobs)
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayFirstBatch] Decoded, merging...`
    )

    const mergedBuffer = this.mergeAudioBuffers(audioBuffers)
    console.log(
      `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayFirstBatch] Merged, batch duration: ${mergedBuffer.duration.toFixed(2)}s`
    )

    this.playBatch(mergedBuffer, 0)
  }

  private playBatch(buffer: AudioBuffer, batchIndex: number): void {
    this.cleanupAudioSource()
    if (!this.audioContext) {
      console.error(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playBatch] AudioContext not initialized`
      )
      return
    }

    this.audioSource = this.audioContext.createBufferSource()
    this.audioSource.buffer = buffer

    this.gainNode = this.audioContext.createGain()
    this.audioSource.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)

    this.audioSource.onended = () => {
      if (this.state === 'playing') {
        this.currentChunkIndex += this.batchSize
        console.log(
          `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playBatch] Batch ${batchIndex} ended, current chunk: ${this.currentChunkIndex}/${this.queue.length}`
        )

        if (this.currentChunkIndex < this.queue.length) {
          this.playNextBatch()
        } else {
          console.log(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playBatch] All batches finished`)
          this.state = 'stopped'
          this.onEnded?.()
        }
      }
    }

    this.audioSource.start(0)
    this.state = 'playing'

    this.prefetchNextBatch()
  }

  private playNextBatch(): void {
    if (this.bufferQueue.length > 0) {
      const nextBuffer = this.bufferQueue.shift()
      const nextBatchIndex = this.currentChunkIndex / this.batchSize
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextBatch] Playing prefetched batch ${nextBatchIndex}`
      )
      this.playBatch(nextBuffer!, nextBatchIndex)
    } else {
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} playNextBatch] No prefetched buffer, fetching...`
      )
      this.fetchAndPlayNextBatch()
    }
  }

  private async fetchAndPlayNextBatch(): Promise<void> {
    this.state = 'loading'
    try {
      const blobs = await this.fetchBatch(this.currentChunkIndex)
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayNextBatch] Fetched ${blobs.length} chunks, decoding...`
      )

      const buffers = await this.decodeAllBlobs(blobs)
      const mergedBuffer = this.mergeAudioBuffers(buffers)

      const nextBatchIndex = this.currentChunkIndex / this.batchSize
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayNextBatch] Playing batch ${nextBatchIndex}, duration: ${mergedBuffer.duration.toFixed(2)}s`
      )

      this.playBatch(mergedBuffer, nextBatchIndex)
    } catch (error) {
      console.error(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} fetchAndPlayNextBatch] Error:`,
        error
      )
      this.state = 'stopped'
      this.onEnded?.()
    }
  }

  private async prefetchNextBatch(): Promise<void> {
    if (this.isPrefetching) {
      return
    }

    const nextBatchIndex = this.currentChunkIndex + this.batchSize
    if (nextBatchIndex >= this.queue.length) {
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetchNextBatch] No more batches to prefetch`
      )
      return
    }

    this.isPrefetching = true
    try {
      const blobs = await this.fetchBatch(nextBatchIndex)
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetchNextBatch] Prefetched ${blobs.length} chunks, decoding...`
      )

      const buffers = await this.decodeAllBlobs(blobs)
      const mergedBuffer = this.mergeAudioBuffers(buffers)

      this.bufferQueue.push(mergedBuffer)
      console.log(
        `${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetchNextBatch] Prefetched batch starting at chunk ${nextBatchIndex}, duration: ${mergedBuffer.duration.toFixed(2)}s`
      )
    } catch (error) {
      console.error(`${TIKTOK_PLAYER_CONSTANTS.CONSOLE_PREFIX} prefetchNextBatch] Error:`, error)
      this.bufferQueue = []
    } finally {
      this.isPrefetching = false
    }
  }

  resume = async () => {
    if (this.state === 'paused' && this.audioContext) {
      await this.audioContext.resume()
      this.state = 'playing'
    } else if (this.audio) {
      this.audio.play()
    }
  }

  pause = () => {
    if (this.state === 'playing' && this.audioContext) {
      this.audioContext.suspend()
      this.state = 'paused'
    } else if (this.audio && this.state === 'playing') {
      this.audio.pause()
    }
  }

  setPlaybackRate = (rate: number) => {
    setLocalStorageItem('tiktokPlaybackRate', rate, String)
    if (this.audio) {
      this.audio.playbackRate = rate
    }
  }

  stop = () => {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.cleanupAudioSource()
    this.cleanupBlobUrl()
    this.queue = []
    this.bufferQueue = []
    this.isPrefetching = false
    this.state = 'stopped'
    this.currentChunkIndex = 0
  }
}

export default TikTokPlayer
