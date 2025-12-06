import { cn } from '@/lib/utils'

export function TableContainer({ children, className, ...props }) {
  return (
    <div 
      className={cn(
        "w-full overflow-x-auto",
        "rounded-lg border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        className
      )}
      {...props}
    >
      <div className="min-w-full inline-block">
        {children}
      </div>
    </div>
  )
}

