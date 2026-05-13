import { cn } from '@/lib/utils'

export function ModernCard({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({ title, value, icon: Icon, subtitle, trend, ...props }) {
  return (
    <ModernCard {...props}>
      <div className="px-4 py-4">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
            {value}
          </p>
          {trend != null && (
            <span className={cn(
              "text-[11px] font-semibold",
              trend > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-500 dark:text-rose-400"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">{subtitle}</p>
        )}
      </div>
    </ModernCard>
  )
}
