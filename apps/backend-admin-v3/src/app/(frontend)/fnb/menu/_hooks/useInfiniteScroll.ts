'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  onLoadMore: () => void | Promise<void>
  rootMargin?: string
  threshold?: number
  // The nearest scrollable ancestor to observe against, instead of the default
  // (browser viewport) - needed once the trigger sits inside its own overflow-y-auto
  // container (task-12C-7's sticky-header/filter shell) rather than the whole page
  // scrolling. Undefined/null keeps the original viewport-based behavior.
  root?: Element | null
}

export const useInfiniteScroll = ({
  hasMore,
  onLoadMore,
  rootMargin = '0px',
  threshold = 0,
  root = null,
}: UseInfiniteScrollOptions) => {
  // The trigger node is tracked via useState (callback ref) rather than useRef, so the
  // effect below re-subscribes whenever the underlying DOM node is replaced. A plain ref
  // isn't a valid effect dependency - React can't tell when its `.current` changes, so an
  // effect keyed only on `hasMore` would observe the node that existed the one time
  // `hasMore` flipped true and never notice if that node gets swapped out afterwards.
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  const triggerRef = useCallback((el: HTMLDivElement | null) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (!hasMore || !node) return

    let cancelled = false

    // A single "page" here can be shorter than the viewport (e.g. a category with only
    // 1-2 items), in which case the trigger is already fully visible and IntersectionObserver
    // won't fire again on its own - it only reports threshold *crossings*, not "still
    // visible". So once a crossing brings the trigger into view, keep loading (waiting a
    // frame between calls for the new items to paint) for as long as it's still visible,
    // stopping as soon as it isn't or the component unmounts/hasMore goes false.
    const isVisible = () => {
      const rect = node.getBoundingClientRect()
      // Bound against root's own clipped viewport when given - without this, a trigger
      // scrolled out of view *within its container* (but whose raw coordinates still
      // happen to fall inside the browser viewport) would incorrectly read as visible.
      const rootRect = root ? root.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
      return rect.top < rootRect.bottom && rect.bottom > rootRect.top
    }

    const runChain = async () => {
      while (!cancelled && isVisible()) {
        await onLoadMoreRef.current()
        if (cancelled) return
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) runChain()
      },
      { root, rootMargin, threshold },
    )

    observer.observe(node)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [hasMore, node, root, rootMargin, threshold])

  return { triggerRef }
}
