type PlaybackState = 'playing' | 'stopped' | 'loading'

class AudioPlayer {
  private static instance: AudioPlayer | null = null

  private state = $state<PlaybackState>('stopped')
  private audioContext: AudioContext | null = null

  private source: AudioBufferSourceNode | null = null
  private queue: AudioBuffer[] = []

  private constructor() {
    this.initializeAudioContext()
  }

  private initializeAudioContext(): void {
    try {
      this.audioContext = new AudioContext()
    } catch (error) {
      console.error('Web Audio API is not supported in this browser:', error)
    }
  }

  get playbackState(): PlaybackState {
    return this.state
  }

  static getInstance(): AudioPlayer {
    if (!AudioPlayer.instance) {
      AudioPlayer.instance = new AudioPlayer()
    }
    return AudioPlayer.instance
  }

  resumeContext = () => {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  destroy = () => {
    this.stop()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    AudioPlayer.instance = null
  }

  static async getAudioData(text: string) {
    this.getInstance().state = 'loading'
    const res = await fetch('/api/stream', {
      method: 'POST',
      body: JSON.stringify({ text })
    })

    const reader = res.body?.getReader() || null
    if (!reader) throw new Error('No reader in stream response')

    while (true) {
      const { done, value } = await reader.read()
      if (done || !value) {
        break
      }

      const arrayBuffer = value.buffer.slice(
        value.byteOffset,
        value.byteOffset + value.byteLength
      ) as ArrayBuffer

      const ctx = this.getInstance().audioContext
      if (!ctx) throw new Error('AudioContext not available')
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      // add to queue
      this.getInstance().queue.push(audioBuffer)
    }
  }

  async play(text: string): Promise<void> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.initializeAudioContext()
    }

    if (!this.audioContext) {
      console.error('AudioContext not available')
      return
    }

    if (this.state === 'playing') {
      console.warn('Audio is already playing')
      return
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Need to call getAudioData() before playing
      await AudioPlayer.getAudioData(text)

      this.state = 'playing'

      const ctx = this.audioContext
      this.source = ctx.createBufferSource()
      if (this.queue.length === 0) {
        this.stop()
        return
      }

      this.source.buffer = this.queue.shift()!
      this.source.connect(ctx.destination)

      this.source.start(0)
      this.source.onended = () => {
        this.stop()
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      this.cleanup()
    }
  }

  stop(): void {
    if (this.state === 'stopped') {
      return
    }

    try {
      if (this.source) {
        this.source.stop()
      }
    } catch (error) {
      console.warn('Error stopping oscillator:', error)
    }

    this.cleanup()
  }

  private cleanup(): void {
    if (this.source) {
      try {
        this.source.disconnect()
      } catch (_error) {
        // Already disconnected
      }
      this.source = null
    }

    this.state = 'stopped'
  }
}

export { AudioPlayer }
export type { PlaybackState }
