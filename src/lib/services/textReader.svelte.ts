type ReaderState = 'playing' | 'paused' | 'stopped'

class TextReader {
  private static instance: TextReader | null
  private synth: SpeechSynthesis | null = $state(null)
  private state: ReaderState = $state('stopped')
  private voice: SpeechSynthesisVoice | null = $state(null)

  private constructor() {}

  static getInstance(): TextReader {
    if (!TextReader.instance) {
      TextReader.instance = new TextReader()
    }
    return TextReader.instance
  }

  get getState(): ReaderState {
    return this.state
  }

  play = (text: string, onendedCallback?: () => void) => {
    this.synth = window.speechSynthesis
    this.synth.onvoiceschanged = () => {
      const voices = this.synth?.getVoices()
      const vnvoice = voices && voices.find((v) => v.lang === 'vi-VN')
      if (!vnvoice) {
        alert(
          'There is no voice for Vietnamese language. Install vietnamese language on your machine'
        )
        return
      }

      this.voice = vnvoice

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.voice
      if (onendedCallback) {
        utterance.onend = onendedCallback
      }
      this.synth?.speak(utterance)
    }

    if (this.voice) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = this.voice
      if (onendedCallback) {
        utterance.onend = onendedCallback
      }
      this.synth?.speak(utterance)
    }
    this.state = 'playing'
  }

  resume = () => {
    this.synth?.resume()
    this.state = 'playing'
  }

  pause = () => {
    this.synth?.pause()
    this.state = 'paused'
  }

  stop = () => {
    this.synth?.cancel()
    this.state = 'stopped'
  }
}

export default TextReader
