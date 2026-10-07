import React, { act } from 'react'
import { createRoot } from 'react-dom/client'

// @ts-expect-error React 19 test environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  useSidebarPersistence,
  SIDEBAR_PERSISTENCE_KEY,
} from '@/utilities/use-sidebar-persistence'

let mockNavOpen = true
const mockSetNavOpen = vi.fn((val: boolean) => {
  mockNavOpen = val
})
let mockHydrated = false
const mockSetPreference = vi.fn(() => Promise.resolve())

vi.mock('@payloadcms/ui', () => ({
  useNav: () => ({
    navOpen: mockNavOpen,
    setNavOpen: mockSetNavOpen,
    hydrated: mockHydrated,
  }),
  usePreferences: () => ({
    setPreference: mockSetPreference,
    getPreference: vi.fn(),
  }),
}))

const TestComponent: React.FC = () => {
  useSidebarPersistence()
  return null
}

describe('useSidebarPersistence', () => {
  let container: HTMLDivElement | null = null
  let root: ReturnType<typeof createRoot> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavOpen = true
    mockHydrated = false
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount()
      })
    }
    if (container) {
      container.remove()
    }
    localStorage.clear()
  })

  it('restores collapsed state (false) from localStorage on desktop once hydrated', async () => {
    localStorage.setItem(SIDEBAR_PERSISTENCE_KEY, 'false')
    mockNavOpen = true
    mockHydrated = false

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })
    expect(mockSetNavOpen).not.toHaveBeenCalled()

    mockHydrated = true
    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    expect(mockSetNavOpen).toHaveBeenCalledWith(false)
  })

  it('restores expanded state (true) from localStorage on desktop once hydrated', async () => {
    localStorage.setItem(SIDEBAR_PERSISTENCE_KEY, 'true')
    mockNavOpen = false
    mockHydrated = false

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })
    expect(mockSetNavOpen).not.toHaveBeenCalled()

    mockHydrated = true
    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    expect(mockSetNavOpen).toHaveBeenCalledWith(true)
  })

  it('defaults to expanded on desktop if no preference is stored in localStorage', async () => {
    mockNavOpen = false
    mockHydrated = false

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })
    mockHydrated = true
    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    expect(mockSetNavOpen).toHaveBeenCalledWith(true)
  })

  it('persists user toggle to localStorage on desktop', async () => {
    mockNavOpen = true
    mockHydrated = true

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    // Matches the desired (no-stored-value -> open) state immediately, so the hook
    // starts its settle window rather than correcting anything — advance past it
    // (see the hook's own comment on why the window exists) before toggling, so
    // this toggle is treated as a real user action instead of startup drift.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350))
    })

    await act(async () => {
      mockNavOpen = false
      root?.render(React.createElement(TestComponent))
    })

    expect(localStorage.getItem(SIDEBAR_PERSISTENCE_KEY)).toBe('false')
    expect(mockSetPreference).toHaveBeenCalledWith('nav', { open: false }, true)
  })

  it('does not persist toggle to localStorage on mobile viewports (<=768px)', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    mockNavOpen = false
    mockHydrated = true

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    await act(async () => {
      mockNavOpen = true
      root?.render(React.createElement(TestComponent))
    })

    expect(localStorage.getItem(SIDEBAR_PERSISTENCE_KEY)).toBeNull()
  })

  it('degrades gracefully when localStorage throws an error', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: Access denied')
    })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    mockNavOpen = false
    mockHydrated = true

    await expect(async () => {
      await act(async () => {
        root?.render(React.createElement(TestComponent))
      })
      await act(async () => {
        mockNavOpen = true
        root?.render(React.createElement(TestComponent))
      })
    }).not.toThrow()

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })

  it('responds to storage events from other browser tabs', async () => {
    mockNavOpen = true
    mockHydrated = true

    await act(async () => {
      root?.render(React.createElement(TestComponent))
    })

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SIDEBAR_PERSISTENCE_KEY,
          newValue: 'false',
        }),
      )
    })

    expect(mockSetNavOpen).toHaveBeenCalledWith(false)
  })
})
