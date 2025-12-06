import { cn } from '@/lib/utils'

export function ModernCard({ 
  children, 
  className, 
  gradient = 'from-[#5B7A9E] to-[#6B8FA3]',
  glow = false, // Desabilitado para design Stripe minimalista
  ...props 
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className={cn(
        "relative bg-surface-elevated rounded-[var(--radius-sm)]",
        "border border-border",
        "p-6 transition-colors duration-100"
      )}>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient = 'from-[#5B7A9E] to-[#6B8FA3]',
  subtitle,
  trend,
  ...props 
}) {
  return (
    <ModernCard {...props}>
      <div className="flex items-start justify-between mb-6">
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center",
            "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        {trend && (
          <div className={cn(
            "text-xs font-medium px-2 py-1 rounded-[var(--radius-sm)]",
            trend > 0 
              ? "text-[var(--success)] bg-[var(--success)]/10"
              : "text-[var(--danger)] bg-[var(--danger)]/10"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-3xl font-semibold text-text-primary leading-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-2">{subtitle}</p>
        )}
      </div>
    </ModernCard>
  )
}

