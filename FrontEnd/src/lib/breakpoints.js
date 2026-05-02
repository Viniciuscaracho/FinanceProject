/**
 * Sistema de Breakpoints baseado no Tailwind CSS (padrão Cal.com)
 * Breakpoints seguem a abordagem mobile-first
 */

export const BREAKPOINTS = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536, // 2X Extra large devices (larger desktops)
}

/**
 * Obtém o valor de um breakpoint
 */
export function getBreakpoint(name) {
  return BREAKPOINTS[name] || 0
}

/**
 * Verifica se a largura atual é maior ou igual ao breakpoint
 */
export function isBreakpoint(width, breakpoint) {
  const breakpointValue = typeof breakpoint === 'string' 
    ? getBreakpoint(breakpoint) 
    : breakpoint
  return width >= breakpointValue
}

/**
 * Obtém o breakpoint atual baseado na largura
 */
export function getCurrentBreakpoint(width) {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs' // Extra small (menor que sm)
}

/**
 * Media query string para uso em CSS
 */
export function mediaQuery(breakpoint, direction = 'min') {
  const value = typeof breakpoint === 'string' 
    ? getBreakpoint(breakpoint) 
    : breakpoint
  
  if (direction === 'min') {
    return `(min-width: ${value}px)`
  }
  return `(max-width: ${value - 1}px)`
}
