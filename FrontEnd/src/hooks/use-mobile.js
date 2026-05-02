import * as React from "react"
import { BREAKPOINTS, getCurrentBreakpoint } from "@/lib/breakpoints"

/**
 * Hook melhorado para detectar mobile baseado na metodologia Cal.com
 * Usa Visual Viewport API quando disponível para melhor detecção de zoom
 * 
 * @param {number} breakpoint - Breakpoint customizado (padrão: md = 768px)
 * @returns {boolean} true se estiver em mobile
 */
export function useIsMobile(breakpoint = BREAKPOINTS.md) {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  React.useEffect(() => {
    const updateIsMobile = () => {
      // Usar Visual Viewport API se disponível (melhor para zoom e mobile)
      const width = window.visualViewport?.width || window.innerWidth
      setIsMobile(width < breakpoint)
    }

    // Atualizar imediatamente
    updateIsMobile()

    // Media Query Listener (mais eficiente que resize direto)
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handleMediaChange = (e) => {
      setIsMobile(e.matches)
    }
    mql.addEventListener("change", handleMediaChange)

    // Resize listener com debounce
    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateIsMobile, 150)
    }
    window.addEventListener("resize", handleResize)

    // Visual Viewport API (melhor para mobile e zoom)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
      window.visualViewport.addEventListener("scroll", handleResize)
    }

    // Orientation change
    window.addEventListener("orientationchange", updateIsMobile)

    return () => {
      mql.removeEventListener("change", handleMediaChange)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", updateIsMobile)
      clearTimeout(resizeTimer)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
        window.visualViewport.removeEventListener("scroll", handleResize)
      }
    }
  }, [breakpoint])

  return isMobile
}

/**
 * Hook para obter o breakpoint atual
 * @returns {string} Breakpoint atual ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState(() => {
    if (typeof window === 'undefined') return 'md'
    return getCurrentBreakpoint(window.innerWidth)
  })

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.visualViewport?.width || window.innerWidth
      setBreakpoint(getCurrentBreakpoint(width))
    }

    updateBreakpoint()

    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateBreakpoint, 150)
    }
    window.addEventListener("resize", handleResize)

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
      window.visualViewport.addEventListener("scroll", handleResize)
    }

    window.addEventListener("orientationchange", updateBreakpoint)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", updateBreakpoint)
      clearTimeout(resizeTimer)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
        window.visualViewport.removeEventListener("scroll", handleResize)
      }
    }
  }, [])

  return breakpoint
}

/**
 * Hook para verificar se está em um breakpoint específico ou maior
 * @param {string} minBreakpoint - Breakpoint mínimo ('sm' | 'md' | 'lg' | 'xl' | '2xl')
 * @returns {boolean}
 */
export function useBreakpointAtLeast(minBreakpoint) {
  const currentBreakpoint = useBreakpoint()
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpoints.indexOf(currentBreakpoint)
  const minIndex = breakpoints.indexOf(minBreakpoint)
  return currentIndex >= minIndex
}
