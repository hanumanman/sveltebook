type PlaybackState = AudioContextState | 'loading'

/**
 * @class AudioPlayer
 * @description A singleton class to manage a single AudioContext for the entire application.
 * This pattern is crucial because some browsers limit the number of AudioContexts
 * that can be created. A singleton ensures we use only one.
 * @example
 * // You can create a function to handle user interaction, like a click.
 * // Browsers require a user gesture to start the AudioContext.
 * async function playMySound() {
 *   const player = AudioPlayer.getInstance()
 *   // It's a good practice to resume the context on a user gesture.
 *   await player.resumeContext()
 *   // Read aloud. Replace with your text
 *   await player.playAudio('Hello con cho 🐶')
 * }
 */
export class AudioPlayer {
  private static instance: AudioPlayer | null = null
  private audioContext: AudioContext
  private queue: AudioBuffer[] = $state([])

  /**
   * @private
   * The constructor is private to prevent creating new instances with `new AudioPlayer()`.
   * It initializes the AudioContext.
   */
  private constructor() {
    this.audioContext = new AudioContext()
  }

  /**
   * @public
   * @static
   * @returns {AudioPlayer} The single instance of the AudioPlayer class.
   * This method controls access to the singleton instance.
   */
  public static getInstance = (): AudioPlayer => {
    if (this.instance === null) {
      this.instance = new AudioPlayer()
    }
    return this.instance
  }

  /**
   * @public
   * Resumes the AudioContext if it's in a suspended state.
   * User interaction is often required to start or resume an AudioContext.
   * @returns {Promise<void>}
   */
  public resumeContext = async (): Promise<void> => {
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (_error) {
        throw new Error('Failed to resume AudioContext:')
      }
    }
  }

  /**
   * @private
   * Creates a promise that reads from the stream reader with a timeout
   * @param reader - The ReadableStreamDefaultReader
   * @param timeoutMs - Timeout in milliseconds (default: 10 seconds)
   * @returns Promise that resolves with the read result or rejects on timeout
   */
  private readWithTimeout = (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    timeoutMs: number = 10000
  ): Promise<ReadableStreamReadResult<Uint8Array>> => {
    return Promise.race([
      reader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Stream read timeout')), timeoutMs)
      )
    ])
  }

  public async getAudioData(text: string) {
    alert('start fetching')

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    try {
      const res = await fetch('/api/stream', {
        method: 'POST',
        body: JSON.stringify({ text: text.split('.')[0] })
      })
      alert('res fetched')

      reader = res.body?.getReader() || null
      alert('reader created')

      if (!reader) {
        throw new Error('No reader in stream response')
      }

      let chunkCount = 0

      // Read the stream with timeout protection
      while (true) {
        try {
          const { done, value } = await this.readWithTimeout(reader, 10000) // 10 second timeout
          chunkCount++
          alert(`reader readed (chunk #${chunkCount})`)

          if (done || !value) {
            alert(`reader done ${done}, value ${value}`)
            break
          }

          if (!value?.buffer) {
            alert('No buffer in stream chunk')
            continue // Skip this chunk instead of throwing
          }

          try {
            const audioBuffer = await this.audioContext.decodeAudioData(value.buffer as ArrayBuffer)
            alert('audio buffer decoded')
            this.queue.push(audioBuffer)
            alert('audio buffer pushed')
          } catch (decodeError) {
            alert(`Error decoding audio buffer: ${(decodeError as Error).message}`)
            // Continue with other chunks instead of failing completely
            continue
          }
        } catch (_timeoutError) {
          alert(`Stream read timeout after chunk #${chunkCount}`)
          // If we have some audio data, we can still proceed
          if (this.queue.length > 0) {
            alert('Proceeding with partial audio data')
            break
          } else {
            throw new Error('Stream timeout with no audio data received')
          }
        }
      }

      alert(`Stream processing completed with ${this.queue.length} audio chunks`)
    } catch (error) {
      alert(`Error in getAudioData: ${(error as Error).message}`)
      throw error
    } finally {
      // Always release the reader
      if (reader) {
        try {
          reader.releaseLock()
          alert('reader lock released')
        } catch (_releaseError) {
          alert('Error releasing reader lock')
        }
      }
    }
  }

  public playAudio = async (text: string) => {
    try {
      // Clear the queue if it's not empty (for now)
      this.queue = []

      // Ensure the context is running, especially after a user gesture.
      alert('start')

      // Resume context FIRST - this is critical for mobile
      await this.resumeContext()
      alert('context resumed early')
      alert(`context state after early resume: ${this.audioContext.state}`)

      await this.getAudioData(text)
      alert('audio data getted')

      // Check if we have any audio data to play
      if (this.queue.length === 0) {
        alert('No audio data to play')
        throw new Error('No audio data received from stream')
      }

      const buffer = this.queue[0]
      alert(
        `About to play buffer with duration: ${buffer.duration} seconds, channels: ${buffer.numberOfChannels}, sampleRate: ${buffer.sampleRate}`
      )

      // Create source and set up event listeners for debugging
      const source = this.audioContext.createBufferSource()
      alert('source created')

      source.buffer = buffer
      alert('buffer assigned to source')

      // Create a gain node to control volume and ensure audio routing
      const gainNode = this.audioContext.createGain()
      gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime) // Full volume
      alert('gain node created')

      // Connect: source -> gain -> destination
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      alert('source connected through gain node')

      // Check if the buffer actually has audio data
      const channelData = buffer.getChannelData(0)
      const hasAudioData = channelData.some((sample) => Math.abs(sample) > 0.001)
      alert(
        `Buffer has audio data: ${hasAudioData}, max sample: ${Math.max(...Array.from(channelData).map(Math.abs))}`
      )

      // Double-check context state before playing
      await this.resumeContext()
      alert('context resumed again')
      alert(`final context state: ${this.audioContext.state}`)

      // Add a small delay to ensure everything is ready
      await new Promise((resolve) => setTimeout(resolve, 100))
      alert('starting playback now')

      // Set up event listener before starting
      const playbackPromise = new Promise<void>((resolve) => {
        source.onended = () => {
          alert('audio playback ended')
          resolve()
        }

        // Timeout after expected duration + 1 second
        setTimeout(
          () => {
            alert('audio playback timeout - never ended')
            resolve()
          },
          buffer.duration * 1000 + 1000
        )
      })

      source.start(0)
      alert('source.start() called')

      // Check if it's actually playing
      await new Promise((resolve) => setTimeout(resolve, 200))
      alert(`context time after start: ${this.audioContext.currentTime}`)

      alert('pants shitted')

      // Wait for playback to complete
      await playbackPromise
      alert('playback promise resolved')
    } catch (error) {
      alert(`Error in playAudio: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * @public
   * Alternative method that might work better on mobile
   * Call this method directly from a user interaction event
   */
  public playAudioImmediate = async (text: string): Promise<void> => {
    try {
      alert('immediate play start')

      // Must resume context in the same user interaction
      await this.resumeContext()
      alert(`immediate context state: ${this.audioContext.state}`)

      // Create a simple test tone first to verify audio works
      const testSource = this.audioContext.createOscillator()
      const testGain = this.audioContext.createGain()

      testSource.connect(testGain)
      testGain.connect(this.audioContext.destination)

      testSource.frequency.setValueAtTime(440, this.audioContext.currentTime) // A4 note
      testGain.gain.setValueAtTime(0.1, this.audioContext.currentTime) // Low volume

      testSource.start()
      testSource.stop(this.audioContext.currentTime + 0.2) // 200ms beep

      alert('test tone played - did you hear a beep?')

      // Small delay then proceed with TTS
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Now try the regular TTS
      await this.playAudio(text)
    } catch (error) {
      alert(`Error in playAudioImmediate: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * @public
   * @returns {AudioContextState} The current state of the AudioContext. This can be 'loading', 'running', 'suspended', or 'closed'.
   */
  getState = (): PlaybackState => {
    return this.audioContext.state
  }
}
