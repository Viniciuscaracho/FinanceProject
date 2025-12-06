import { cn } from '@/lib/utils'

export function FluidSection({ 
  children, 
  className,
  title,
  subtitle,
  icon: Icon,
  gradient = 'from-[#5B7A9E] to-[#6B8FA3]',
  ...props 
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className={cn(
        "relative bg-surface-elevated rounded-[var(--radius-sm)]",
        "border border-border",
        "p-8 transition-colors duration-100"
      )}>
        {(title || Icon) && (
          <div className="flex items-start justify-between mb-8">
            {title && (
              <div>
                <h3 className="text-2xl font-semibold text-text-primary mb-2 leading-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-text-secondary leading-relaxed">{subtitle}</p>
                )}
              </div>
            )}
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center",
                "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
              )}>
                <Icon className="w-5 h-5" />
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

