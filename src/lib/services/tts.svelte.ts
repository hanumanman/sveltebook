import type { google } from '@google-cloud/text-to-speech/build/protos/protos'

export type TTSData = google.cloud.texttospeech.v1.ISynthesizeSpeechResponse
type TTSState = 'idle' | 'speaking' | 'paused' | 'stopped' | 'loading'

export class TTSAudioPlayer {
  private audio: HTMLAudioElement | null = null
  state: TTSState = $state('idle')

  constructor(ttsData: Blob) {
    this.init(ttsData)
  }

  init = (ttsData: Blob) => {
    this.audio = convertTTSDataToAudio(ttsData)
  }

  speak = async () => {
    this.state = 'speaking'
    this.audio?.play()
  }

  pause = (): void => {
    this.state = 'paused'
    this.audio?.pause()
  }

  resume = (): void => {
    if (this.state === 'paused') {
      this.audio?.play()
      this.state = 'speaking'
    }
  }

  isSupported = (): boolean => {
    if (typeof window !== 'undefined') {
      return 'speechSynthesis' in window
    }
    return false
  }
}

// interface AudioContent {
//   type: 'Buffer'
//   data: number[]
// }
function convertTTSDataToAudio(data: Blob): HTMLAudioElement {
  // const audioContent = data.audioContent as unknown as AudioContent
  // if (!audioContent) {
  //   throw new Error('No audio content in TTS response data')
  // }
  // const bytes = new Uint8Array(audioContent.data)
  // const audioBlob = new Blob([bytes], { type: 'audio/mp3' })
  const audioUrl = URL.createObjectURL(data)
  return new Audio(audioUrl)
}
