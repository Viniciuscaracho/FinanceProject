import { cn } from '@/lib/utils'

export function ModernCard({
  children,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  ...props
}) {
  return (
    <ModernCard {...props}>
      {/* Card header row */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {Icon && (
            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          )}
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">{title}</p>
        </div>
        {trend != null && (
          <div className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            trend > 0
              ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20"
              : "text-rose-500 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      {/* Card body */}
      <div className="p-3">
        <p className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </ModernCard>
  )
}

