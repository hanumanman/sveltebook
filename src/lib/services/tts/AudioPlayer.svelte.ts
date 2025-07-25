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
  public static getInstance(): AudioPlayer {
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
  public async resumeContext(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
      }
    }
  }

  /**
   * @public
   * Play audio
   * @param {string} text - The text to be read aloud
   * @returns {Promise<void>}
   */
  public async playAudio(text: string): Promise<void> {
    // Ensure the context is running, especially after a user gesture.
    await this.resumeContext()

    try {
      //TODO: implement
      this.playAudio(text)
    } catch (error) {
      console.error(`Error playing audio`, error)
    }
  }

  /**
   * @public
   * @returns {AudioContextState} The current state of the AudioContext. This can be 'loading', 'running', 'suspended', or 'closed'.
   */
  public getState(): PlaybackState {
    return this.audioContext.state
  }
}
