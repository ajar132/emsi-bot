import { useRef } from 'react'

export function useAutoResize({ minHeight, maxHeight }: { minHeight: number; maxHeight: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = (reset = false) => {
    const el = textareaRef.current
    if (!el) return
    if (reset) {
      el.style.height = `${minHeight}px`
      return
    }
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
  }

  return { textareaRef, adjustHeight }
}
