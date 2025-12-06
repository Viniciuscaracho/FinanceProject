import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[88px] w-full rounded-[var(--radius-md)] border border-border bg-surface",
        "px-4 py-3 text-base placeholder:text-text-secondary/60",
        "transition-all duration-140 outline-none",
        "hover:border-border/80",
        "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-0",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "whitespace-pre-wrap break-words",
        className
      )}
      {...props}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        ...props.style
      }}
    />
  );
}

export { Textarea }
