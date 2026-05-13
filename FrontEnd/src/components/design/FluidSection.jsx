import { cn } from '@/lib/utils'

export function FluidSection({ children, className, title, subtitle, icon: Icon, ...props }) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "transition-colors duration-100"
      )}>
        {(title || Icon) && (
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              {title}
            </p>
            {subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
