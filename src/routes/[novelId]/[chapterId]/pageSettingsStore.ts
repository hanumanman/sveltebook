import { browser } from '$app/environment'
import { writable } from 'svelte/store'

interface IPageSettings {
  fontSize: number
  lineHeight: number
  theme: TTheme
  infiniteReading: boolean
  rollingBlindFeatureEnabled: boolean // Controls button visibility
  rollingBlindActive: boolean // Controls the view
  rollingBlindSpeed: number
}

export type TTheme = keyof typeof themes

export const themes = {
  default: {
    background: '#050c24',
    color: '#d1d5dc' // Slightly softer than pure black
  },
  dark: {
    background: '#121212', // Softer than pure black
    color: '#e0e0e0' // Softer than pure white
  },
  night: {
    background: '#192734', // Dark blue
    color: '#e1e8ed' // Light blue-gray
  },
  amber: {
    background: '#22272e', // Dark slate
    color: '#e3d9c6' // Warm amber text - reduced blue light
  },
  twilight: {
    background: '#1a1b26', // Dark blue-gray
    color: '#c8d3f5' // Soft blue-tinted white - gentle contrast
  },
  sepia: {
    background: '#f8f2e3', // Warmer sepia
    color: '#5b4636' // Brown instead of black
  },
  mint: {
    background: '#f0f8f0', // Very light mint
    color: '#2e5d4b' // Dark green
  },
  lavender: {
    background: '#f5f0ff', // Light lavender
    color: '#4a3a6a' // Dark purple
  },
  sand: {
    background: '#f7f3eb', // Sand color
    color: '#524a3a' // Dark sand
  },
  eink: {
    background: '#f9f9f9', // Light gray like e-readers
    color: '#444444' // Dark gray
  }
} as const

const defaultSettings: IPageSettings = {
  fontSize: 16,
  lineHeight: 1.5,
  theme: 'default',
  infiniteReading: false,
  rollingBlindFeatureEnabled: false,
  rollingBlindActive: false,
  rollingBlindSpeed: 10
}

const getStoredSettings = (): IPageSettings => {
  if (browser) {
    const storedSettings = localStorage.getItem('pageSettings')
    if (storedSettings) {
      return JSON.parse(storedSettings)
    }
  }
  return defaultSettings
}

const storedSettings = getStoredSettings()

export const pageSettingsStore = writable(storedSettings || defaultSettings)

if (storedSettings) {
  pageSettingsStore.set(storedSettings)
}

pageSettingsStore.subscribe((value) => {
  if (browser) {
    localStorage.setItem('pageSettings', JSON.stringify(value))
  }
})
