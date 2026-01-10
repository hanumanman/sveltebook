import { browser } from '$app/environment'

export interface PageSettings {
  fontSize: number
  lineHeight: number
  theme: TTheme
  infiniteReading: boolean
}

export type TTheme = keyof typeof themes

export const themes = {
  default: {
    background: '#050c24',
    color: '#d1d5dc'
  },
  dark: {
    background: '#121212',
    color: '#e0e0e0'
  },
  night: {
    background: '#192734',
    color: '#e1e8ed'
  },
  amber: {
    background: '#22272e',
    color: '#e3d9c6'
  },
  twilight: {
    background: '#1a1b26',
    color: '#c8d3f5'
  },
  sepia: {
    background: '#f8f2e3',
    color: '#5b4636'
  },
  mint: {
    background: '#f0f8f0',
    color: '#2e5d4b'
  },
  lavender: {
    background: '#f5f0ff',
    color: '#4a3a6a'
  },
  sand: {
    background: '#f7f3eb',
    color: '#524a3a'
  },
  eink: {
    background: '#f9f9f9',
    color: '#444444'
  }
} as const

const defaultSettings: PageSettings = {
  fontSize: 16,
  lineHeight: 1.5,
  theme: 'default',
  infiniteReading: false
}

function getStoredSettings(): PageSettings {
  if (!browser) {
    return defaultSettings
  }

  const stored = localStorage.getItem('pageSettings')
  if (!stored) {
    return defaultSettings
  }

  try {
    return JSON.parse(stored) as PageSettings
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: PageSettings): void {
  if (browser) {
    localStorage.setItem('pageSettings', JSON.stringify(settings))
  }
}

function createPageSettings() {
  let settings = $state<PageSettings>(getStoredSettings())

  return {
    get value() {
      return settings
    },
    set value(newSettings: PageSettings) {
      settings = newSettings
      saveSettings(settings)
    },
    get fontSize() {
      return settings.fontSize
    },
    set fontSize(value: number) {
      settings.fontSize = value
      saveSettings(settings)
    },
    get lineHeight() {
      return settings.lineHeight
    },
    set lineHeight(value: number) {
      settings.lineHeight = value
      saveSettings(settings)
    },
    get theme() {
      return settings.theme
    },
    set theme(value: TTheme) {
      settings.theme = value
      saveSettings(settings)
    },
    get infiniteReading() {
      return settings.infiniteReading
    },
    set infiniteReading(value: boolean) {
      settings.infiniteReading = value
      saveSettings(settings)
    },
    reset() {
      settings = { ...defaultSettings }
      saveSettings(settings)
    }
  }
}

export const pageSettings = createPageSettings()
