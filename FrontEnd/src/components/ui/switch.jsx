"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent cursor-pointer",
        "data-[state=checked]:bg-accent dark:data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600",
        "transition-all duration-200 outline-none",
        "hover:opacity-90",
        "focus-visible:ring-2 focus-visible:ring-accent/20 dark:focus-visible:ring-blue-400/20 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full ring-0 transition-transform duration-200",
          "bg-white dark:bg-gray-100 shadow-sm",
          "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]"
        )} />
    </SwitchPrimitive.Root>
  );
}

export { Switch }
