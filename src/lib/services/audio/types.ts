export type AudioBackend = 'tiktok' | 'synthesis'

export type PlaybackState = 'playing' | 'paused' | 'stopped'

export interface AudioPlayer {
  play: (text: string) => void
  stop: () => void
  pause: () => void
  resume: () => void
}
