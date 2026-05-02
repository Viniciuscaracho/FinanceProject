import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-140 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-white [a&]:hover:brightness-110",
        secondary:
          "border-transparent bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold [a&]:hover:bg-gray-300 dark:[a&]:hover:bg-gray-600",
        destructive:
          "border-transparent bg-red-600 dark:bg-red-500 text-white font-semibold [a&]:hover:bg-red-700 dark:[a&]:hover:bg-red-600",
        outline:
          "border-gray-500 dark:border-gray-500 bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 font-semibold shadow-sm [a&]:hover:bg-gray-200 dark:[a&]:hover:bg-gray-700 [a&]:hover:border-gray-600 dark:[a&]:hover:border-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
