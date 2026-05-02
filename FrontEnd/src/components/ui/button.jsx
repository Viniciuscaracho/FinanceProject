import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-100 cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 max-w-full touch-manipulation rounded-md shadow-sm",
  {
    variants: {
      variant: {
        // Default: archieve .btn — bg-white border border-gray-300 text-gray-700
        default:
          "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:shadow hover:bg-gray-50 dark:hover:bg-gray-600",
        // Primary: archieve .btn--primary — indigo-500
        primary:
          "bg-indigo-500 text-white border border-transparent hover:bg-indigo-600 active:bg-indigo-700",
        // Destructive: archieve .btn--danger — rose-500
        destructive:
          "bg-rose-500 text-white border border-transparent hover:bg-rose-600 active:bg-rose-700",
        secondary:
          "bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600",
        ghost:
          "border-transparent shadow-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
        outline:
          "border border-gray-300 dark:border-gray-500 bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
        link: "border-transparent shadow-none text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // archieve: h-10 sm:h-8 px-3
        default: "h-10 sm:h-8 px-3 py-1 text-sm sm:text-xs",
        sm: "h-8 sm:h-6 px-3 py-1 text-xs",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 sm:h-8 sm:w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
