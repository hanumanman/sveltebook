import { browser } from '$app/environment';
import { writable } from 'svelte/store';

interface IPageSettings {
  fontSize: number;
  lineHeight: number;
}

const defaultSettings: IPageSettings = {
  fontSize: 16,
  lineHeight: 1.5
};

const getStoredSettings = (): IPageSettings => {
  if (browser) {
    const storedSettings = localStorage.getItem('pageSettings');
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  }
  return defaultSettings;
};

const storedSettings = getStoredSettings();

export const pageSettingsStore = writable(storedSettings || defaultSettings);

if (storedSettings) {
  pageSettingsStore.set(storedSettings);
}

pageSettingsStore.subscribe((value) => {
  if (browser) {
    localStorage.setItem('pageSettings', JSON.stringify(value));
  }
});
