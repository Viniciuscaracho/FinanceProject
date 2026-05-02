import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500 selection:bg-blue-200 dark:selection:bg-blue-800 selection:text-gray-900 dark:selection:text-white",
        "flex h-11 w-full min-w-0 rounded-md border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-0",
        "text-base text-gray-900 dark:text-white transition-all duration-140 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "hover:border-gray-500 dark:hover:border-gray-500",
        "focus-visible:border-blue-500 dark:focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 focus-visible:ring-offset-0",
        "aria-invalid:border-red-500 dark:aria-invalid:border-red-400 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-400/20",
        className
      )}
      {...props} />
  );
}

export { Input }
