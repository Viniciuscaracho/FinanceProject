import { useState, useEffect, useMemo } from 'react'
import { useBreakpoint, useIsMobile } from './use-mobile'
import { BREAKPOINTS, getCurrentBreakpoint } from '@/lib/breakpoints'

/**
 * Hook para obter informações completas de responsividade
 * Baseado na metodologia Cal.com
 */
export function useResponsive() {
  const breakpoint = useBreakpoint()
  const isMobile = useIsMobile()
  
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 }
    }
    return {
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight,
    }
  })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.visualViewport?.width || window.innerWidth,
        height: window.visualViewport?.height || window.innerHeight,
      })
    }

    updateDimensions()

    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateDimensions, 150)
    }

    window.addEventListener('resize', handleResize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      }
    }
  }, [])

  return useMemo(() => ({
    breakpoint,
    isMobile,
    isTablet: breakpoint === 'md',
    isDesktop: !isMobile && breakpoint !== 'md',
    isLargeDesktop: breakpoint === 'xl' || breakpoint === '2xl',
    width: dimensions.width,
    height: dimensions.height,
    // Helpers para breakpoints específicos
    isAtLeast: (minBreakpoint) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
      return breakpoints.indexOf(breakpoint) >= breakpoints.indexOf(minBreakpoint)
    },
    isAtMost: (maxBreakpoint) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
      return breakpoints.indexOf(breakpoint) <= breakpoints.indexOf(maxBreakpoint)
    },
  }), [breakpoint, isMobile, dimensions])
}

/**
 * Hook para obter classes Tailwind responsivas baseadas no breakpoint
 * Útil para aplicar classes condicionalmente
 */
export function useResponsiveClasses(classesByBreakpoint) {
  const breakpoint = useBreakpoint()
  
  return useMemo(() => {
    const classes = []
    
    // Aplicar classes base
    if (classesByBreakpoint.base) {
      classes.push(classesByBreakpoint.base)
    }
    
    // Aplicar classes por breakpoint (mobile-first)
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpoints.indexOf(breakpoint)
    
    breakpoints.forEach((bp, index) => {
      if (index <= currentIndex && classesByBreakpoint[bp]) {
        classes.push(classesByBreakpoint[bp])
      }
    })
    
    return classes.join(' ')
  }, [breakpoint, classesByBreakpoint])
}

/**
 * Hook para detectar orientação do dispositivo
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => {
    if (typeof window === 'undefined') return 'portrait'
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  })

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.visualViewport?.width || window.innerWidth
      const height = window.visualViewport?.height || window.innerHeight
      setOrientation(height > width ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateOrientation)
    }

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateOrientation)
      }
    }
  }, [])

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  }
}
