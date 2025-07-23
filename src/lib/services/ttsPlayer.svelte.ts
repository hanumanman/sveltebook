type TTSState = 'loading' | 'playing' | 'paused' | 'stopped'

// Shared AudioContext manager
class AudioManager {
  private static instance: AudioManager
  private ctx: AudioContext
  private currentPlayer: TTSPlayer | null = null
  private globalState: TTSState = 'stopped'

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
    // Stop current player if switching to a new one
    if (this.currentPlayer && this.currentPlayer !== player) {
      const oldPlayer = this.currentPlayer
      this.currentPlayer = null // Clear first to prevent circular calls
      oldPlayer.stop()
    }
    this.currentPlayer = player
    this.globalState = player?.state || 'stopped'
  }

  getCurrentPlayer(): TTSPlayer | null {
    return this.currentPlayer
  }

  updateGlobalState(state: TTSState) {
    this.globalState = state
  }

  getGlobalState(): TTSState {
    return this.globalState
  }

  // Clean up when a player is destroyed (e.g., on route change)
  cleanupPlayer(player: TTSPlayer) {
    if (this.currentPlayer === player) {
      this.currentPlayer = null
      this.globalState = 'stopped'
    }
  }

  // Direct setter for internal use (to avoid circular calls)
  clearCurrentPlayer() {
    this.currentPlayer = null
    this.globalState = 'stopped'
  }
}

export class TTSPlayer {
  private audioManager: AudioManager
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private pausedAt: number = 0
  private startedAt: number = 0
  private currentBuffer: AudioBuffer | null = null
  private destroyed: boolean = false

  queue = $state<AudioBuffer[]>([])
  state: TTSState = $state('stopped')

  constructor() {
    this.audioManager = AudioManager.getInstance()

    // Check if there's audio currently playing and sync state
    const globalState = this.audioManager.getGlobalState()
    const currentPlayer = this.audioManager.getCurrentPlayer()

    if (currentPlayer && globalState !== 'stopped') {
      // There's another player active, so this one should start as stopped
      this.state = 'stopped'
    } else if (globalState !== 'stopped') {
      // Take over from the previous player's state
      this.state = globalState
      this.audioManager.setCurrentPlayer(this)
    }
  }

  // Call this when the component/player is destroyed (e.g., onDestroy in Svelte)
  destroy() {
    this.destroyed = true
    this.stop()
    this.audioManager.cleanupPlayer(this)
  }

  async stream(text: string) {
    if (this.destroyed) return

    // Set this as the current player (stops others)
    this.audioManager.setCurrentPlayer(this)

    this.state = 'loading'
    this.audioManager.updateGlobalState('loading')

    const res = await fetch('/api/stream', {
      method: 'POST',
      body: JSON.stringify({ text })
    })

    this.reader = res.body?.getReader() || null
    if (!this.reader) {
      throw new Error('No reader in stream response')
    }

    // Reset state
    this.queue = []
    this.state = 'stopped'
    this.audioManager.updateGlobalState('stopped')
    this.pausedAt = 0
    this.startedAt = 0
    this.currentBuffer = null

    await this.pump()
  }

  private async playNext() {
    if (this.destroyed) return

    // If we're resuming from pause, use the current buffer
    let buffer: AudioBuffer
    if (this.state === 'paused' && this.currentBuffer) {
      buffer = this.currentBuffer
    } else {
      // Get next buffer from queue
      if (this.queue.length === 0) {
        this.state = 'stopped'
        this.audioManager.updateGlobalState('stopped')
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
      this.audioManager.updateGlobalState('stopped')
      return
    }

    this.state = 'playing'
    this.audioManager.updateGlobalState('playing')
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
      if (this.state === 'playing' && !this.destroyed) {
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
        this.audioManager.getCurrentPlayer() === this &&
        !this.destroyed
      ) {
        this.playNext()
      }
    }
  }

  stop() {
    this.state = 'stopped'
    this.audioManager.updateGlobalState('stopped')
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

    // Clear current player if it's us (but avoid circular calls)
    if (this.audioManager.getCurrentPlayer() === this) {
      this.audioManager.clearCurrentPlayer()
    }
  }

  pause() {
    if (this.state !== 'playing' || this.destroyed) return

    this.state = 'paused'
    this.audioManager.updateGlobalState('paused')
    const ctx = this.audioManager.getContext()

    // Calculate how much time has elapsed since we started playing
    this.pausedAt = ctx.currentTime - this.startedAt

    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }
  }

  resume() {
    if (this.state !== 'paused' || this.destroyed) return

    // Set as current player and resume playback
    this.audioManager.setCurrentPlayer(this)

    // Resume with the current buffer
    this.playNext()
  }
}
