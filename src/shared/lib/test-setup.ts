import "@testing-library/jest-dom/vitest";

// ResizeObserver polyfill for jsdom (used by shadcn ScrollArea)
if (typeof ResizeObserver === "undefined") {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
