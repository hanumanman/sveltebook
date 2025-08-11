import { getContext, setContext } from 'svelte'

type PlaybackState = 'playing' | 'stopped'

const AUDIO_PLAYER_KEY = Symbol('audioPlayer')

class AudioPlayer {
  private static instance: AudioPlayer | null = null

  private state = $state<PlaybackState>('stopped')
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null

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

  async play(): Promise<void> {
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

      this.oscillator = this.audioContext.createOscillator()
      this.gainNode = this.audioContext.createGain()

      this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime)
      this.oscillator.type = 'sine'

      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1)
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2)

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      this.oscillator.addEventListener('ended', () => {
        this.cleanup()
      })

      this.oscillator.start(this.audioContext.currentTime)
      this.oscillator.stop(this.audioContext.currentTime + 2)

      this.state = 'playing'
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
      if (this.oscillator) {
        this.oscillator.stop()
      }
    } catch (error) {
      console.warn('Error stopping oscillator:', error)
    }

    this.cleanup()
  }

  private cleanup(): void {
    if (this.oscillator) {
      try {
        this.oscillator.disconnect()
      } catch (_error) {
        // Already disconnected
      }
      this.oscillator = null
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect()
      } catch (_error) {
        // Already disconnected
      }
      this.gainNode = null
    }

    this.state = 'stopped'
  }

  static getInstance(): AudioPlayer {
    if (!AudioPlayer.instance) {
      AudioPlayer.instance = new AudioPlayer()
    }
    return AudioPlayer.instance
  }

  destroy(): void {
    this.stop()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    AudioPlayer.instance = null
  }
}

function setAudioPlayerContext(): AudioPlayer {
  const audioPlayer = AudioPlayer.getInstance()
  setContext<AudioPlayer>(AUDIO_PLAYER_KEY, audioPlayer)
  return audioPlayer
}

function getAudioPlayerContext(): AudioPlayer {
  const audioPlayer = getContext<AudioPlayer>(AUDIO_PLAYER_KEY)
  if (!audioPlayer) {
    throw new Error(
      'AudioPlayer context not found. Make sure to call setAudioPlayerContext() in a parent component.'
    )
  }
  return audioPlayer
}

export { AudioPlayer, getAudioPlayerContext, setAudioPlayerContext }
export type { PlaybackState }
