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
        "flex field-sizing-content min-h-[88px] w-full rounded-[var(--radius-md)] border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800",
        "px-4 py-3 text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
        "transition-all duration-140 outline-none",
        "hover:border-gray-500 dark:hover:border-gray-500",
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
