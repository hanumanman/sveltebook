export interface AudioPlayer {
  play: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  get volume(): number
  set volume(volume: number)
  get voice(): string
  set voice(voice: string)
}
