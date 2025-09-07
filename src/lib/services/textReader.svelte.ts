type ReaderState = 'playing' | 'paused' | 'stopped'

class TextReader {
  private static instance: TextReader | null
  private state: ReaderState = $state('stopped')

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

  play = () => {
    const synth = window.speechSynthesis
    synth.onvoiceschanged = () => {
      const voices = synth.getVoices()
      const vnvoice = voices.find((v) => v.name.includes('Linh'))
      console.log(voices)
      console.log(vnvoice)
    }
    this.state = 'playing'
  }

  pause = () => {
    this.state = 'paused'
  }

  stop = () => {
    this.state = 'stopped'
  }
}

export default TextReader
