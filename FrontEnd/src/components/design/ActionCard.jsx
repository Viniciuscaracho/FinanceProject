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
      className={cn("group relative cursor-pointer", className)} 
      onClick={onClick}
      {...props}
    >
      <div className="relative bg-surface-elevated rounded-[var(--radius-sm)] p-6 border border-border hover:border-accent/50 transition-colors duration-100">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-[var(--radius-sm)] flex items-center justify-center bg-accent transition-colors duration-100">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-text-primary mb-1">{title}</h3>
            <p className="text-sm text-text-secondary">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors duration-100" />
        </div>
      </div>
    </div>
  )
}

