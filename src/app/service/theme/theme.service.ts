import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { AppTheme } from '../../interface/theme.interface';
const STORAGE_KEY = 'app-theme';
@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(@Inject(DOCUMENT) private document: Document) {}

  setTheme(theme: AppTheme) {
    const root = this.document.documentElement;
    if (theme.primary) root.style.setProperty('--primary', theme.primary);
    if (theme.accent) root.style.setProperty('--accent', theme.accent);
    if (theme.warn) root.style.setProperty('--warn', theme.warn);
    if (theme.background) root.style.setProperty('--background', theme.background);
    if (theme.onPrimary) root.style.setProperty('--on-primary', theme.onPrimary);

    // también mantener variables MDC para Material
    if (theme.primary) root.style.setProperty('--mdc-theme-primary', theme.primary);
    if (theme.accent)  root.style.setProperty('--mdc-theme-secondary', theme.accent);
    if (theme.background) root.style.setProperty('--mdc-theme-surface', theme.background);
    if (theme.onPrimary) root.style.setProperty('--mdc-theme-on-primary', theme.onPrimary);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }

  loadTheme(): AppTheme | null {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return null;
    const theme: AppTheme = JSON.parse(v);
    this.setTheme(theme);
    return theme;
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.setTheme({
      primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1976d2',
      secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#1976d2',
      onFocus: getComputedStyle(document.documentElement).getPropertyValue('--on-focus').trim() || '#1976d2',
      accent:  getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff4081',
      warn:    getComputedStyle(document.documentElement).getPropertyValue('--warn').trim() || '#f44336',
      background: getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#ffffff',
      onPrimary: getComputedStyle(document.documentElement).getPropertyValue('--on-primary').trim() || '#ffffff'
    });
  }

}
