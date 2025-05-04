import { browser } from '$app/environment';
import { writable } from 'svelte/store';

interface IPageSettings {
	fontSize: number;
	lineHeight: number;
	theme: TTheme;
}

interface IColorTheme {
	textColor: string;
	backgroundColor: string;
}

type TTheme = 'default' | 'light' | 'dark' | 'sepia';

export const colorThemes: Record<TTheme, IColorTheme> = {
	default: {
		textColor: '#d4d4d4',
		backgroundColor: '#1e1e1e'
	},
	light: {
		textColor: '#333333',
		backgroundColor: '#f8f9fa'
	},
	dark: {
		textColor: '#e0e0e0',
		backgroundColor: '#121212'
	},
	sepia: {
		textColor: '#5f4b32',
		backgroundColor: '#fbf0d9'
	}
} as const;

export const defaultPageSettings: IPageSettings = {
	fontSize: 16,
	lineHeight: 1.5,
	theme: 'default'
};

const getStoredSettings = (): IPageSettings => {
	if (browser) {
		const storedSettings = localStorage.getItem('pageSettings');
		if (storedSettings) {
			return JSON.parse(storedSettings);
		}
	}
	return defaultPageSettings;
};

const storedSettings = getStoredSettings();

export const pageSettingsStore = writable(storedSettings || defaultPageSettings);

if (storedSettings) {
	pageSettingsStore.set(storedSettings);
}

pageSettingsStore.subscribe((value) => {
	if (browser) {
		localStorage.setItem('pageSettings', JSON.stringify(value));
	}
});
