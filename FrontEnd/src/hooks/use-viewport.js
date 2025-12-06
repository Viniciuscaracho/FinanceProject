import { useState, useEffect } from 'react'

/**
 * Hook para detectar tamanho da viewport e nível de zoom
 * Útil para responsividade em desktop com zoom do navegador
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    zoom: 1,
    breakpoint: 'mobile'
  })

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Detectar zoom comparando innerWidth com outerWidth
      // Nota: Esta é uma aproximação, pois nem todos os browsers expõem zoom diretamente
      const zoom = window.outerWidth ? window.innerWidth / window.outerWidth : 1
      
      // Breakpoints para desktop
      let breakpoint = 'mobile'
      if (width >= 1920) {
        breakpoint = 'xl' // Extra large (4K, ultrawide)
      } else if (width >= 1440) {
        breakpoint = 'large' // Large desktop
      } else if (width >= 1024) {
        breakpoint = 'medium' // Medium desktop
      } else if (width >= 768) {
        breakpoint = 'small' // Small desktop / tablet
      }
      
      setViewport({
        width,
        height,
        zoom: Math.round(zoom * 100) / 100, // Arredondar para 2 casas decimais
        breakpoint
      })
    }

    // Atualizar imediatamente
    updateViewport()

    // Listener para mudanças de tamanho
    window.addEventListener('resize', updateViewport)
    
    // Listener para mudanças de zoom (alguns browsers)
    window.addEventListener('orientationchange', updateViewport)
    
    // Visual Viewport API para melhor suporte a zoom
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport)
      window.visualViewport.addEventListener('scroll', updateViewport)
    }

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport)
        window.visualViewport.removeEventListener('scroll', updateViewport)
      }
    }
  }, [])

  return viewport
}

/**
 * Hook simplificado para verificar se está em desktop
 */
export function useIsDesktop() {
  const { breakpoint } = useViewport()
  return !['mobile'].includes(breakpoint)
}

/**
 * Hook para verificar breakpoint específico
 */
export function useBreakpoint(minBreakpoint) {
  const { breakpoint } = useViewport()
  
  const breakpoints = ['mobile', 'small', 'medium', 'large', 'xl']
  const currentIndex = breakpoints.indexOf(breakpoint)
  const minIndex = breakpoints.indexOf(minBreakpoint)
  
  return currentIndex >= minIndex
}

