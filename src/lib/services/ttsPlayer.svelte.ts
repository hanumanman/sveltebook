type TTSState = 'loading' | 'playing' | 'paused' | 'stopped'

export class TTSPlayer {
  private ctx: AudioContext
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  queue = $state<AudioBuffer[]>([])
  state: TTSState = $state('stopped')

  constructor() {
    this.ctx = new AudioContext()
  }

  async stream(text: string) {
    this.state = 'loading'
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

    await this.pump()
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.state = 'stopped'
      return
    }

    this.state = 'playing'
    const buffer = this.queue.shift()!
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)
    source.start()
    source.onended = () => {
      this.playNext() // keep going
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

      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)

      // add to queue
      this.queue = [...this.queue, audioBuffer]

      // if nothing is playing, start
      if (!(this.state === 'playing')) {
        this.playNext()
      }
    }
  }

  // Optional: method to stop/cleanup
  stop() {
    this.state = 'stopped'
    this.queue = []
    if (this.reader) {
      this.reader.cancel()
      this.reader = null
    }
  }

  // Optional: method to pause/resume
  pause() {
    // Note: This is a simplified pause - you might want more sophisticated pause/resume logic
    this.state = 'paused'
  }
}
