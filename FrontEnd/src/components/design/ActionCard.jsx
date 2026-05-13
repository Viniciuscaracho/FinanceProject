import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ActionCard({ title, description, icon: Icon, onClick, className, ...props }) {
  return (
    <div
      className={cn(
        "group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        "px-4 py-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-150",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-150" />
      </div>
      {description && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 ml-6">{description}</p>
      )}
    </div>
  )
}
