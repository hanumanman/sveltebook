import { browser } from '$app/environment'

type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading'

export class MobileAudioPlayer {
    private static instance: MobileAudioPlayer | null
    private audio: HTMLAudioElement | null = null
    private state: PlayerState = $state('stopped')
    private queue: string[] = []
    private currentText: string = ''
    private onEnded: (() => void) | null = null
    private abortController: AbortController | null = null

    private constructor() {
        if (browser) {
            this.audio = new Audio()
            this.audio.onended = () => {
                if (this.queue.length > 0) {
                    this.playNextChunk()
                } else {
                    this.state = 'stopped'
                    this.onEnded?.()
                }
            }
            this.audio.onplay = () => (this.state = 'playing')
            this.audio.onpause = () => {
                if (this.state !== 'stopped') this.state = 'paused'
            }
            this.audio.onerror = (e) => {
                console.error('Audio playback error:', e)
                this.state = 'stopped'
            }
        }
    }

    static getInstance(): MobileAudioPlayer {
        if (!MobileAudioPlayer.instance) {
            MobileAudioPlayer.instance = new MobileAudioPlayer()
        }
        return MobileAudioPlayer.instance
    }

    get getState(): PlayerState {
        return this.state
    }

    private async playNextChunk() {
        if (this.queue.length === 0) return

        const text = this.queue.shift()
        if (!text) return

        try {
            this.state = 'loading'

            // Cancel any previous fetch
            if (this.abortController) {
                this.abortController.abort()
            }
            this.abortController = new AbortController()

            // Get selected voice from localStorage
            const voice = localStorage.getItem('selectedVoice') || 'vi-VN-NamMinhNeural'

            const response = await fetch('/api/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice }),
                signal: this.abortController.signal
            })

            if (!response.ok) {
                throw new Error('TTS request failed')
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            if (this.audio) {
                this.audio.src = url
                this.audio.play()
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return

            console.warn('Edge TTS failed, falling back to browser TTS:', error)

            // Fallback to browser's built-in TTS
            this.useBrowserTTS(text)
        }
    }

    private useBrowserTTS(text: string) {
        try {
            const synth = window.speechSynthesis
            const voices = synth.getVoices()
            const vnVoice = voices.find((v) => v.lang === 'vi-VN')

            const utterance = new SpeechSynthesisUtterance(text)
            if (vnVoice) {
                utterance.voice = vnVoice
            }

            utterance.onend = () => {
                if (this.queue.length > 0) {
                    this.playNextChunk()
                } else {
                    this.state = 'stopped'
                    this.onEnded?.()
                }
            }

            utterance.onerror = () => {
                this.state = 'stopped'
                console.error('Browser TTS also failed')
            }

            synth.speak(utterance)
            this.state = 'playing'
        } catch (err) {
            console.error('Browser TTS fallback failed:', err)
            this.state = 'stopped'
        }
    }

    play = (text: string, onendedCallback?: () => void) => {
        this.stop()
        this.currentText = text
        this.onEnded = onendedCallback || null

        // Send entire text in one request for seamless playback
        this.queue = [text]

        this.playNextChunk()
    }

    resume = () => {
        if (this.audio && this.state === 'paused') {
            this.audio.play()
        }
    }

    pause = () => {
        if (this.audio && this.state === 'playing') {
            this.audio.pause()
        }
    }

    stop = () => {
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
        if (this.audio) {
            this.audio.pause()
            this.audio.currentTime = 0
            this.audio.src = ''
        }
        this.queue = []
        this.state = 'stopped'
    }
}

export default MobileAudioPlayer
