import type { AudioBackend, PlaybackState } from './types'

let currentBackend = $state<AudioBackend>('tiktok')
const volume = $state<number>(50)
const voice = $state<string>('')
const state = $state<PlaybackState>('stopped')

export const audioState = {
  setBackend: (backend: AudioBackend): void => {
    currentBackend = backend
  },
  getCurrentBackend: () => currentBackend,
  getVolume: () => volume,
  getVoice: () => voice,
  getState: () => state
}
