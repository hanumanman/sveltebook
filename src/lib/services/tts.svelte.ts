export type TTSState = 'idle' | 'speaking' | 'paused' | 'stopped'

export class TTSService {
  state: TTSState = $state('idle')

  speak = (text: string): void => {
    this.state = 'speaking'
    console.log('Reading text: ' + text)
  }

  pause = (): void => {
    this.state = 'paused'
  }

  resume = (): void => {
    if (this.state === 'paused') {
      this.state = 'speaking'
    }
  }

  stop = (): void => {
    this.state = 'stopped'
  }

  isSupported = (): boolean => {
    if (typeof window !== 'undefined') {
      return 'speechSynthesis' in window
    }
    return false
  }
}
