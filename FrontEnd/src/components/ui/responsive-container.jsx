import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/use-responsive'

/**
 * Container responsivo baseado na metodologia Cal.com
 * Adapta-se automaticamente ao breakpoint atual
 */
export function ResponsiveContainer({ 
  children, 
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  ...props 
}) {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  return (
    <div
      className={cn(
        'w-full max-w-full',
        // Classes base
        className,
        // Classes por breakpoint
        isMobile && mobileClassName,
        isTablet && tabletClassName,
        isDesktop && desktopClassName
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Wrapper que mostra/esconde conteúdo baseado no breakpoint
 */
export function ResponsiveShow({ 
  children, 
  above = null, // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  below = null, // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  only = null,  // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  const { breakpoint, isAtLeast, isAtMost } = useResponsive()

  if (only && breakpoint !== only) {
    return null
  }

  if (above && !isAtLeast(above)) {
    return null
  }

  if (below && !isAtMost(below)) {
    return null
  }

  return <>{children}</>
}

/**
 * Wrapper que mostra/esconde conteúdo baseado no breakpoint (inverso do ResponsiveShow)
 */
export function ResponsiveHide({ 
  children, 
  above = null,
  below = null,
  only = null,
}) {
  const { breakpoint, isAtLeast, isAtMost } = useResponsive()

  if (only && breakpoint === only) {
    return null
  }

  if (above && isAtLeast(above)) {
    return null
  }

  if (below && isAtMost(below)) {
    return null
  }

  return <>{children}</>
}
