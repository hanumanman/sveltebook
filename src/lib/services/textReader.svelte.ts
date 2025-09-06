type ReaderState = 'playing' | 'paused' | 'stopped'

class TextReader {
  private static instance: TextReader
  state: ReaderState = $state('stopped')
  private synthesis: SpeechSynthesis

  private currentUtterance: SpeechSynthesisUtterance | null = null
}

export default TextReader
