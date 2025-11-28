import { browser } from '$app/environment'

type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading'

interface QueueItem {
    text: string
    audioPromise: Promise<Blob> | null
}

export class MobileAudioPlayer {
    private static instance: MobileAudioPlayer | null
    private audio: HTMLAudioElement | null = null
    private state: PlayerState = $state('stopped')

    private queue: QueueItem[] = []
    private currentText: string = ''
    private currentBlobUrl: string | null = null
    private onEnded: (() => void) | null = null
    private abortController: AbortController | null = null

    private prefetchAbortController: AbortController | null = null
    private currentChunkIndex: number = 0
    private fullText: string = ''
    private progress: number = 0
    private metadata: { title: string; artist: string } | null = null

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
                    this.updateProgress()
                    this.playNextChunk()
                } else {
                    this.state = 'stopped'
                    this.progress = 0
                    this.onEnded?.()
                }
            }
            this.audio.onplay = () => {
                this.state = 'playing'
                this.updateMediaSessionState()
            }
            this.audio.onpause = () => {
                if (this.state !== 'stopped') {
                    this.state = 'paused'
                    this.updateMediaSessionState()
                }
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

            // Setup Media Session handlers
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', () => this.resume())
                navigator.mediaSession.setActionHandler('pause', () => this.pause())
                navigator.mediaSession.setActionHandler('previoustrack', () => {
                    // Restart current chapter or go to previous chunk?
                    // For now, let's just restart the chapter
                    if (this.fullText) {
                        this.play(this.fullText, this.onEnded || undefined, this.metadata || undefined)
                    }
                })
                navigator.mediaSession.setActionHandler('nexttrack', () => {
                    // Skip to next chunk
                    if (this.queue.length > 0) {
                        this.audio?.pause()
                        this.currentChunkIndex++
                        this.updateProgress()
                        this.playNextChunk()
                    }
                })
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

    get getProgress(): number {
        return this.progress
    }

    private updateProgress() {
        const totalChunks = this.currentChunkIndex + this.queue.length
        if (totalChunks > 0) {
            this.progress = (this.currentChunkIndex / totalChunks) * 100
        } else {
            this.progress = 0
        }
    }

    private updateMediaSessionState() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = this.state === 'playing' ? 'playing' : 'paused'
        }
    }

    private setupMediaSession(title: string, artist: string) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: 'SvelteBook',
                artwork: [
                    { src: '/favicon.png', sizes: '192x192', type: 'image/png' }
                ]
            })
        }
    }

    private splitTextIntoChunks(text: string): string[] {
        // Improved regex to handle quotes, brackets, and various punctuation
        // Matches sentence endings followed by optional quotes/brackets, then whitespace or end of string
        const sentenceRegex = /[^.!?;\n]+[.!?;\n]+["')\]]*(\s+|$)|[^.!?;\n]+$/g
        const sentences = text.match(sentenceRegex) || [text]

        const chunks: string[] = []
        let currentChunk = ''
        let isFirstChunk = true

        // First chunk is smaller for faster initial playback
        const FIRST_CHUNK_LENGTH = 1000
        // Calculate target chunk length to ensure max 5 chunks (approx)
        const MIN_CHUNK_LENGTH = 1000
        const MAX_CHUNKS = 6
        const calculatedChunkLength = Math.ceil(text.length / MAX_CHUNKS)
        const TARGET_CHUNK_LENGTH = Math.max(MIN_CHUNK_LENGTH, calculatedChunkLength)

        console.log(`[splitTextIntoChunks] Text length: ${text.length}, First chunk: ${FIRST_CHUNK_LENGTH}, Other chunks: ${TARGET_CHUNK_LENGTH}`)

        for (const sentence of sentences) {
            const currentTargetLength = isFirstChunk ? FIRST_CHUNK_LENGTH : TARGET_CHUNK_LENGTH

            if (currentChunk.length + sentence.length > currentTargetLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim())
                currentChunk = sentence
                isFirstChunk = false
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
        const timeoutSignal = AbortSignal.timeout(45000) // 45s timeout (increased for slower connections)
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

    private prefetchNextChunks() {
        if (this.queue.length === 0) return

        // Prefetch up to 2 next chunks
        const itemsToPrefetch = this.queue.slice(0, 2)

        if (!this.prefetchAbortController) {
            this.prefetchAbortController = new AbortController()
        }

        itemsToPrefetch.forEach((item, index) => {
            if (!item.audioPromise) {
                console.log(`[prefetch] Prefetching chunk +${index + 1}:`, item.text.substring(0, 30) + '...')
                item.audioPromise = this.fetchAudio(item.text, this.prefetchAbortController!.signal)
                    .catch(err => {
                        console.warn(`[prefetch] Failed to prefetch chunk +${index + 1}:`, err.message || err)
                        // Reset promise on error so it can be fetched on-demand when needed
                        item.audioPromise = null
                        // Return a rejected promise to maintain type signature
                        return Promise.reject(err)
                    })
            }
        })
    }

    private async playNextChunk() {
        console.log('[playNextChunk] Starting, queue length:', this.queue.length)

        if (this.queue.length === 0) {
            console.log('[playNextChunk] Queue empty, returning')
            return
        }

        const item = this.queue.shift()
        if (!item) {
            console.log('[playNextChunk] No item in queue, returning')
            return
        }

        console.log('[playNextChunk] Processing text chunk:', item.text.substring(0, 50) + '...')
        this.currentText = item.text

        try {
            let blob: Blob

            // Try to use prefetched promise if available
            if (item.audioPromise) {
                try {
                    console.log('[playNextChunk] Using prefetched promise')
                    blob = await item.audioPromise
                } catch (prefetchError: any) {
                    // Prefetch failed, fetch on-demand
                    console.log('[playNextChunk] Prefetch failed, fetching on-demand:', prefetchError.message || prefetchError)
                    this.state = 'loading'

                    if (this.abortController) {
                        this.abortController.abort()
                    }
                    this.abortController = new AbortController()

                    blob = await this.fetchAudio(item.text, this.abortController.signal)
                }
            } else {
                // No prefetch, fetch on-demand
                this.state = 'loading'
                console.log('[playNextChunk] State set to loading (no prefetch)')

                // Cancel any previous fetch
                if (this.abortController) {
                    this.abortController.abort()
                }
                this.abortController = new AbortController()

                console.log('[playNextChunk] Fetching audio...')
                blob = await this.fetchAudio(item.text, this.abortController.signal)
            }

            // Cleanup previous blob URL
            this.cleanupBlobUrl()

            const url = URL.createObjectURL(blob)
            this.currentBlobUrl = url
            console.log('[playNextChunk] Created blob URL:', url)

            if (this.audio) {
                console.log('[playNextChunk] Setting audio.src to blob URL')
                this.audio.src = url
                
                // Reapply playback rate (browser may reset it when changing src)
                const savedRate = localStorage.getItem('playbackRate')
                if (savedRate) {
                    this.audio.playbackRate = parseFloat(savedRate)
                    console.log('[playNextChunk] Reapplied playback rate:', savedRate)
                }
                
                console.log('[playNextChunk] Calling audio.play()')
                await this.audio.play()
                console.log('[playNextChunk] Audio playback started successfully')

                // Start prefetching the next chunks
                this.prefetchNextChunks()
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
            this.useBrowserTTS(item.text)
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

    play = (text: string, onendedCallback?: () => void, metadata?: { title: string; artist: string }) => {
        this.stop()
        this.onEnded = onendedCallback || null
        this.fullText = text
        this.metadata = metadata || null

        if (metadata) {
            this.setupMediaSession(metadata.title, metadata.artist)
        }

        // Split text into chunks
        const chunks = this.splitTextIntoChunks(text)
        this.queue = chunks.map(t => ({
            text: t,
            audioPromise: null
        }))

        console.log(`[play] Text split into ${this.queue.length} chunks`)

        this.currentChunkIndex = 0
        this.progress = 0
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

        if (this.audio) {
            this.audio.pause()
            this.audio.currentTime = 0
            // Do not set src to empty string as it causes the browser to try loading the current page
        }
        this.cleanupBlobUrl()
        this.queue = []
        this.state = 'stopped'
        this.progress = 0

        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none'
        }
    }
}

export default MobileAudioPlayer
