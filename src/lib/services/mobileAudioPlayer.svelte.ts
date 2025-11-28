import { browser } from '$app/environment'

type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading'

export class MobileAudioPlayer {
    private static instance: MobileAudioPlayer | null
    private audio: HTMLAudioElement | null = null
    private state: PlayerState = $state('stopped')
    private queue: string[] = []
    private currentText: string = ''
    private currentBlobUrl: string | null = null
    private onEnded: (() => void) | null = null
    private abortController: AbortController | null = null

    private constructor() {
        if (browser) {
            this.audio = new Audio()

            // Load and apply saved playback rate
            const savedRate = localStorage.getItem('playbackRate')
            if (savedRate) {
                this.audio.playbackRate = parseFloat(savedRate)
            }

            this.audio.onended = () => {
                this.cleanupBlobUrl()
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
                // Get more detailed error information
                const errorDetails = this.audio?.error
                const errorMessages = {
                    1: 'MEDIA_ERR_ABORTED - The fetching process was aborted by the user',
                    2: 'MEDIA_ERR_NETWORK - A network error occurred while fetching the audio',
                    3: 'MEDIA_ERR_DECODE - An error occurred while decoding the audio',
                    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The audio format is not supported'
                }

                const errorCode = errorDetails?.code
                const errorMessage = errorCode ? errorMessages[errorCode as keyof typeof errorMessages] : 'Unknown error'

                console.error('Audio playback error:', errorMessage, errorDetails)
                console.error('Audio src:', this.audio?.src)
                console.error('Current blob URL:', this.currentBlobUrl)

                this.cleanupBlobUrl()
                this.state = 'stopped'

                // Try fallback to browser TTS for the current chunk
                if (this.currentText) {
                    console.warn('Attempting fallback to browser TTS due to audio error')
                    this.useBrowserTTS(this.currentText)
                }
            }
        }
    }

    private cleanupBlobUrl() {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl)
            this.currentBlobUrl = null
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
        console.log('[playNextChunk] Starting, queue length:', this.queue.length)

        if (this.queue.length === 0) {
            console.log('[playNextChunk] Queue empty, returning')
            return
        }

        const text = this.queue.shift()
        if (!text) {
            console.log('[playNextChunk] No text in queue, returning')
            return
        }

        console.log('[playNextChunk] Processing text chunk:', text.substring(0, 50) + '...')

        // Track current text for error fallback
        this.currentText = text

        try {
            this.state = 'loading'
            console.log('[playNextChunk] State set to loading')

            // Cancel any previous fetch
            if (this.abortController) {
                this.abortController.abort()
            }
            this.abortController = new AbortController()

            // Get selected voice from localStorage
            const voice = localStorage.getItem('selectedVoice') || 'vi-VN-NamMinhNeural'
            console.log('[playNextChunk] Using voice:', voice)

            console.log('[playNextChunk] Fetching audio from /api/stream...')
            const response = await fetch('/api/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice }),
                signal: this.abortController.signal
            })

            console.log('[playNextChunk] Response status:', response.status)

            if (!response.ok) {
                throw new Error(`TTS request failed with status ${response.status}`)
            }

            console.log('[playNextChunk] Converting response to blob...')
            const blob = await response.blob()

            // Validate blob
            if (blob.size === 0) {
                throw new Error('Received empty audio blob')
            }

            // Check if it's a valid audio type
            if (!blob.type.startsWith('audio/')) {
                console.warn('[playNextChunk] Unexpected blob type:', blob.type)
            }

            console.log('[playNextChunk] Audio blob received:', {
                size: blob.size,
                type: blob.type
            })

            // Cleanup previous blob URL
            this.cleanupBlobUrl()

            const url = URL.createObjectURL(blob)
            this.currentBlobUrl = url
            console.log('[playNextChunk] Created blob URL:', url)

            if (this.audio) {
                console.log('[playNextChunk] Setting audio.src to blob URL')
                this.audio.src = url
                console.log('[playNextChunk] Calling audio.play()')
                await this.audio.play()
                console.log('[playNextChunk] Audio playback started successfully')
            } else {
                console.error('[playNextChunk] Audio element is null!')
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('[playNextChunk] Fetch aborted')
                return
            }

            console.error('[playNextChunk] Error occurred:', error)
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

    setPlaybackRate = (rate: number) => {
        if (this.audio) {
            this.audio.playbackRate = rate
            if (browser) {
                localStorage.setItem('playbackRate', rate.toString())
            }
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
            // Do not set src to empty string as it causes the browser to try loading the current page
        }
        this.cleanupBlobUrl()
        this.queue = []
        this.state = 'stopped'
    }
}

export default MobileAudioPlayer
