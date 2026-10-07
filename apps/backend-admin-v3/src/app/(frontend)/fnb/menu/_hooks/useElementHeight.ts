'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Tracks an element's rendered height via ResizeObserver - used to keep a second sticky
 * element's `top` offset aligned to a first sticky element's actual height (which varies
 * with font size, logo presence, translated text length, etc.) instead of a hardcoded
 * pixel value. Callback-ref + useState-node, mirroring this codebase's established
 * node-tracking idiom (see useInfiniteScroll.ts's own `node`/`setNode` pattern) so the
 * effect below correctly re-subscribes if the underlying DOM node is ever replaced.
 */
export const useElementHeight = () => {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [height, setHeight] = useState(0)

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (!node) return

    setHeight(node.getBoundingClientRect().height)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setHeight(entry.contentRect.height)
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [node])

  return { ref, height }
}

export default useElementHeight
