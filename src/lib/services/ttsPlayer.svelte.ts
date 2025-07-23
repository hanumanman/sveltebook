type TTSState = 'loading' | 'playing' | 'paused' | 'stopped'

class AudioManager {
  private static instance: AudioManager
  private ctx: AudioContext
  private currentPlayer: TTSPlayer | null = null

  private constructor() {
    this.ctx = new AudioContext()
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  getContext(): AudioContext {
    return this.ctx
  }

  setCurrentPlayer(player: TTSPlayer | null) {
    if (this.currentPlayer && this.currentPlayer !== player) {
      this.currentPlayer.stop()
    }
    this.currentPlayer = player
  }

  getCurrentPlayer(): TTSPlayer | null {
    return this.currentPlayer
  }
}

export class TTSPlayer {
  private audioManager: AudioManager
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private pausedAt: number = 0
  private startedAt: number = 0
  private currentBuffer: AudioBuffer | null = null

  queue = $state<AudioBuffer[]>([])
  state: TTSState = $state('stopped')

  constructor() {
    this.audioManager = AudioManager.getInstance()
  }

  reset() {
    this.queue = []
    this.state = 'stopped'
    this.pausedAt = 0
    this.startedAt = 0
    this.currentBuffer = null
  }

  async stream(text: string) {
    this.audioManager.setCurrentPlayer(this)

    this.state = 'loading'
    const res = await fetch('/api/stream', {
      method: 'POST',
      body: JSON.stringify({ text })
    })

    this.reader = res.body?.getReader() || null
    if (!this.reader) {
      throw new Error('No reader in stream response')
    }

    this.reset()
    await this.pump()
  }

  private async playNext() {
    // If we're resuming from pause, use the current buffer
    let buffer: AudioBuffer
    if (this.state === 'paused' && this.currentBuffer) {
      buffer = this.currentBuffer
    } else {
      // Get next buffer from queue
      if (this.queue.length === 0) {
        this.state = 'stopped'
        this.currentBuffer = null
        this.audioManager.setCurrentPlayer(null)
        return
      }
      buffer = this.queue.shift()!
      this.currentBuffer = buffer
    }

    // Check if we're still the current player
    if (this.audioManager.getCurrentPlayer() !== this) {
      this.state = 'stopped'
      return
    }

    this.state = 'playing'
    const ctx = this.audioManager.getContext()

    this.currentSource = ctx.createBufferSource()
    this.currentSource.buffer = buffer
    this.currentSource.connect(ctx.destination)

    // Handle resume from pause
    const offset = this.pausedAt
    this.startedAt = ctx.currentTime - offset

    this.currentSource.start(0, offset)

    // Reset pause position since we're now playing
    this.pausedAt = 0

    this.currentSource.onended = () => {
      if (this.state === 'playing') {
        this.currentSource = null
        this.currentBuffer = null // Clear current buffer when done
        this.playNext() // keep going
      }
    }
  }

  private async pump() {
    if (!this.reader) return

    while (true) {
      const { done, value } = await this.reader.read()
      if (done || !value) break

      const arrayBuffer = value.buffer.slice(
        value.byteOffset,
        value.byteOffset + value.byteLength
      ) as ArrayBuffer

      const ctx = this.audioManager.getContext()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      // add to queue
      this.queue = [...this.queue, audioBuffer]

      // if nothing is playing and we're still the current player, start
      if (
        this.state !== 'playing' &&
        this.state !== 'paused' &&
        this.audioManager.getCurrentPlayer() === this
      ) {
        this.playNext()
      }
    }
  }

  stop() {
    this.state = 'stopped'
    this.queue = []
    this.pausedAt = 0
    this.startedAt = 0
    this.currentBuffer = null

    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }

    if (this.reader) {
      this.reader.cancel()
      this.reader = null
    }

    // Clear current player if it's us
    if (this.audioManager.getCurrentPlayer() === this) {
      this.audioManager.setCurrentPlayer(null)
    }
  }

  pause() {
    if (this.state !== 'playing') return

    this.state = 'paused'
    const ctx = this.audioManager.getContext()

    // Calculate how much time has elapsed since we started playing
    this.pausedAt = ctx.currentTime - this.startedAt

    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }
  }

  resume() {
    if (this.state !== 'paused') return

    // Set as current player and resume playback
    this.audioManager.setCurrentPlayer(this)

    // Resume with the current buffer
    this.playNext()
  }
}
