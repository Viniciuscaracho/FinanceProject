import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Componente responsivo que usa Sheet em mobile e Dialog em desktop
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
  className,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Dialog>
  )
}

/**
 * Content responsivo - SheetContent em mobile, DialogContent em desktop
 */
export function ResponsiveDialogContent({
  className,
  children,
  side = "bottom",
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetContent
        side={side}
        className={cn("max-h-[90vh] overflow-y-auto", className)}
        {...props}
      >
        {children}
      </SheetContent>
    )
  }

  return (
    <DialogContent
      className={cn("max-h-[90vh] overflow-y-auto", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

/**
 * Header responsivo
 */
export function ResponsiveDialogHeader({
  className,
  children,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetHeader className={className} {...props}>
        {children}
      </SheetHeader>
    )
  }

  return (
    <DialogHeader className={className} {...props}>
      {children}
    </DialogHeader>
  )
}

/**
 * Title responsivo
 */
export function ResponsiveDialogTitle({
  className,
  children,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetTitle className={className} {...props}>
        {children}
      </SheetTitle>
    )
  }

  return (
    <DialogTitle className={className} {...props}>
      {children}
    </DialogTitle>
  )
}

/**
 * Description responsivo
 */
export function ResponsiveDialogDescription({
  className,
  children,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetDescription className={className} {...props}>
        {children}
      </SheetDescription>
    )
  }

  return (
    <DialogDescription className={className} {...props}>
      {children}
    </DialogDescription>
  )
}

/**
 * Footer responsivo
 */
export function ResponsiveDialogFooter({
  className,
  children,
  ...props
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <SheetFooter className={className} {...props}>
        {children}
      </SheetFooter>
    )
  }

  return (
    <DialogFooter className={className} {...props}>
      {children}
    </DialogFooter>
  )
}

