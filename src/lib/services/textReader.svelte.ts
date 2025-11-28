import { browser } from '$app/environment'
import MobileAudioPlayer from './mobileAudioPlayer.svelte'

type ReaderState = 'playing' | 'paused' | 'stopped' | 'loading'

class TextReader {
  private static instance: TextReader | null
  private synth: SpeechSynthesis | null = $state(null)
  private state: ReaderState = $state('stopped')
  private voice: SpeechSynthesisVoice | null = $state(null)
  private isMobile: boolean = false
  private mobilePlayer: MobileAudioPlayer | null = null

  private constructor() {
    if (browser) {
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (this.isMobile) {
        this.mobilePlayer = MobileAudioPlayer.getInstance()
      }
    }
  }

  static getInstance(): TextReader {
    if (!TextReader.instance) {
      TextReader.instance = new TextReader()
    }
    return TextReader.instance
  }

  get getState(): ReaderState {
    if (this.isMobile && this.mobilePlayer) {
      return this.mobilePlayer.getState
    }
    return this.state
  }

  play = (text: string, onendedCallback?: () => void) => {
    if (this.isMobile && this.mobilePlayer) {
      this.mobilePlayer.play(text, onendedCallback)
      return
    }

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
    if (this.isMobile && this.mobilePlayer) {
      this.mobilePlayer.resume()
      return
    }
    this.synth?.resume()
    this.state = 'playing'
  }

  pause = () => {
    if (this.isMobile && this.mobilePlayer) {
      this.mobilePlayer.pause()
      return
    }
    this.synth?.pause()
    this.state = 'paused'
  }

  stop = () => {
    if (this.isMobile && this.mobilePlayer) {
      this.mobilePlayer.stop()
      return
    }
    this.synth?.cancel()
    this.state = 'stopped'
  }
}

export default TextReader
