import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage: Storage = sessionStorage;

  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  useLocalStorage(): void {
    this.storage = localStorage;
  }

  useSessionStorage(): void {
    this.storage = sessionStorage;
  }

  setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      this.storage.setItem(key, value);
    }
  }

  getItem(key: string): string | null {
    if (!this.isBrowser()) return null;
    return (
      this.storage.getItem(key) ||
      localStorage.getItem(key) ||
      sessionStorage.getItem(key)
    );
  }

  removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }

  clear(preservedLocalStorageKeys: string[] = []): void {
    if (this.isBrowser()) {
      const preservedItems = preservedLocalStorageKeys
        .map((key) => ({ key, value: localStorage.getItem(key) }))
        .filter((item): item is { key: string; value: string } => item.value !== null);

      localStorage.clear();
      sessionStorage.clear();

      preservedItems.forEach(({ key, value }) => {
        localStorage.setItem(key, value);
      });
    }
  }
}
