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
          "border-transparent bg-surface-elevated text-text-primary [a&]:hover:brightness-[1.02]",
        destructive:
          "border-transparent bg-danger text-white [a&]:hover:brightness-110",
        outline:
          "border-border bg-transparent text-text-primary [a&]:hover:bg-surface-elevated",
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
