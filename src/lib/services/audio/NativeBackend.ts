import type { AudioPlayer } from './types'

export class NativeBackend implements AudioPlayer {
  play(text: string): void {
    if (speechSynthesis.getVoices().length === 0) {
      alert('Browser does not support speech synthesis')
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    speechSynthesis.speak(utterance)
  }

  stop(): void {
    console.log('Stopping audio')
  }

  pause(): void {
    console.log('Pausing audio')
  }

  resume(): void {
    console.log('Resuming audio')
  }
}
