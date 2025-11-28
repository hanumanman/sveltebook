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

    private nextAudioBlob: Blob | null = null
    private prefetchAbortController: AbortController | null = null
    private currentChapterId: string = ''
    private currentChunkIndex: number = 0
    private fullText: string = ''

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
                    this.currentChunkIndex++
                    this.saveProgress()
                    this.playNextChunk()
                } else {
                    this.state = 'stopped'
                    this.clearProgress()
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

    private splitTextIntoChunks(text: string): string[] {
        // Improved regex to handle quotes, brackets, and various punctuation
        // Matches sentence endings followed by optional quotes/brackets, then whitespace or end of string
        const sentenceRegex = /[^.!?;\n]+[.!?;\n]+["')\]]*(\s+|$)|[^.!?;\n]+$/g
        const sentences = text.match(sentenceRegex) || [text]

        const chunks: string[] = []
        let currentChunk = ''
        const TARGET_CHUNK_LENGTH = 1000 // Increased to reduce request frequency

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > TARGET_CHUNK_LENGTH && currentChunk.length > 0) {
                chunks.push(currentChunk.trim())
                currentChunk = sentence
            } else {
                currentChunk += sentence
            }
        }

        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim())
        }

        return chunks
    }

    private async fetchAudio(text: string, signal: AbortSignal): Promise<Blob> {
        const voice = localStorage.getItem('selectedVoice') || 'vi-VN-NamMinhNeural'

        // Add timeout to prevent infinite hanging
        const timeoutSignal = AbortSignal.timeout(30000) // 30s timeout
        const combinedSignal = AbortSignal.any([signal, timeoutSignal])

        const response = await fetch('/api/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice }),
            signal: combinedSignal
        })

        if (!response.ok) {
            throw new Error(`TTS request failed with status ${response.status}`)
        }

        const blob = await response.blob()

        if (blob.size === 0) {
            throw new Error('Received empty audio blob')
        }

        if (!blob.type.startsWith('audio/')) {
            console.warn('Unexpected blob type:', blob.type)
        }

        return blob
    }

    private async prefetchNextChunk() {
        if (this.queue.length === 0) return

        const nextText = this.queue[0]
        console.log('[prefetch] Prefetching next chunk:', nextText.substring(0, 30) + '...')

        try {
            if (this.prefetchAbortController) {
                this.prefetchAbortController.abort()
            }
            this.prefetchAbortController = new AbortController()

            this.nextAudioBlob = await this.fetchAudio(nextText, this.prefetchAbortController.signal)
            console.log('[prefetch] Prefetch successful')
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.warn('[prefetch] Prefetch failed:', error)
            }
        }
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
        this.currentText = text

        try {
            // Only show loading state if we don't have the blob ready
            if (!this.nextAudioBlob) {
                this.state = 'loading'
                console.log('[playNextChunk] State set to loading (no prefetch)')
            }

            let blob: Blob

            if (this.nextAudioBlob) {
                console.log('[playNextChunk] Using prefetched blob')
                blob = this.nextAudioBlob
                this.nextAudioBlob = null
            } else {
                // Cancel any previous fetch
                if (this.abortController) {
                    this.abortController.abort()
                }
                this.abortController = new AbortController()

                console.log('[playNextChunk] Fetching audio...')
                blob = await this.fetchAudio(text, this.abortController.signal)
            }

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

                // Start prefetching the next chunk
                this.prefetchNextChunk()
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
                    this.currentChunkIndex++
                    this.saveProgress()
                    this.playNextChunk()
                } else {
                    this.state = 'stopped'
                    this.clearProgress()
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

    private saveProgress() {
        if (browser && this.currentChapterId) {
            localStorage.setItem(`tts_progress_${this.currentChapterId}`, this.currentChunkIndex.toString())
        }
    }

    private loadProgress(): number {
        if (browser && this.currentChapterId) {
            const saved = localStorage.getItem(`tts_progress_${this.currentChapterId}`)
            return saved ? parseInt(saved, 10) : 0
        }
        return 0
    }

    private clearProgress() {
        if (browser && this.currentChapterId) {
            localStorage.removeItem(`tts_progress_${this.currentChapterId}`)
        }
    }

    play = (text: string, onendedCallback?: () => void, chapterId: string = '') => {
        this.stop()
        this.onEnded = onendedCallback || null
        this.currentChapterId = chapterId
        this.fullText = text

        // Split text into chunks
        const allChunks = this.splitTextIntoChunks(text)
        console.log(`[play] Text split into ${allChunks.length} chunks`)

        // Check for saved progress
        const savedIndex = this.loadProgress()
        if (savedIndex > 0 && savedIndex < allChunks.length) {
            console.log(`[play] Resuming from chunk index ${savedIndex}`)
            this.currentChunkIndex = savedIndex
            this.queue = allChunks.slice(savedIndex)
        } else {
            this.currentChunkIndex = 0
            this.queue = allChunks
        }

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
        if (this.prefetchAbortController) {
            this.prefetchAbortController.abort()
            this.prefetchAbortController = null
        }
        this.nextAudioBlob = null

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
