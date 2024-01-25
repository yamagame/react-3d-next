import { useRef, useCallback } from 'react'

export type TimerHook = {
  clear: () => void
  set: (callback: () => void, delay: number) => void
}

export function useTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>()
  const clear = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])
  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear()
      if (callback) {
        timeoutRef.current = setTimeout(callback, delay)
      }
    },
    [clear]
  )
  return { clear, set }
}
