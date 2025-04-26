import "@testing-library/jest-dom/vitest";
import { vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatyczne czyszczenie po każdym teście
beforeEach(() => {
  // Reset wszystkich mocków
  vi.resetAllMocks();
});

afterEach(() => {
  // Czyszczenie po testach React Testing Library
  cleanup();
});

// Mockowanie metody fetch
global.fetch = vi.fn();

// Mockowanie localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      store[key] = undefined as unknown as string;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mockowanie intersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
