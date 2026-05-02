import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        "hover:shadow cursor-pointer transition-shadow duration-150",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {Icon && (
            <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
          )}
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">{title}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-150" />
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}

