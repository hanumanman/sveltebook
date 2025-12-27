import { browser } from '$app/environment'

export function getLocalStorageItem<T>(
  key: string,
  defaultValue: T,
  parser?: (value: string) => T
): T {
  if (!browser) return defaultValue

  const storedValue = localStorage.getItem(key)
  if (storedValue === null) return defaultValue

  return parser ? parser(storedValue) : (storedValue as T)
}

export function setLocalStorageItem<T>(
  key: string,
  value: T,
  serializer?: (value: T) => string
): void {
  if (!browser) return

  const serializedValue = serializer ? serializer(value) : String(value)
  localStorage.setItem(key, serializedValue)
}

export function removeLocalStorageItem(key: string): void {
  if (!browser) return

  localStorage.removeItem(key)
}
