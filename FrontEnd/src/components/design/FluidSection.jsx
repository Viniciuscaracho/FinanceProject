import { cn } from '@/lib/utils'

export function FluidSection({
  children,
  className,
  title,
  subtitle,
  icon: Icon,
  ...props
}) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-colors duration-100"
      )}>
        {(title || Icon) && (
          <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {Icon && (
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">
                  {title}
                </p>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="p-3">
          {children}
        </div>
      </div>
    </div>
  )
}

