"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  ...props
}) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto -mx-2 sm:mx-0">
      <div className="inline-block min-w-full align-middle px-2 sm:px-0">
        <table
          data-slot="table"
          className={cn(
            "w-full caption-bottom text-sm border-collapse",
            className
          )}
          {...props} />
      </div>
    </div>
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:border-border",
        className
      )}
      {...props} />
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        className
      )}
      {...props} />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-gray-50 dark:bg-gray-800/50",
        "border-t border-gray-200 dark:border-gray-700",
        "font-medium",
        "[&>tr]:last:border-b-0",
        className
      )}
      {...props} />
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "h-[52px] border-b border-border",
        "hover:bg-gray-50 dark:hover:bg-gray-800/60",
        "data-[state=selected]:bg-surface-elevated",
        "data-[clickable=true]:cursor-pointer",
        "transition-colors duration-140",
        className
      )}
      {...props} />
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-[52px] px-3 sm:px-4 md:px-6 py-0 text-left align-middle",
        "text-xs sm:text-[13px] md:text-[14px] font-medium uppercase tracking-wider",
        "text-text-secondary",
        "bg-surface-elevated",
        "whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 sm:px-4 md:px-6 py-2 sm:py-0 align-middle",
        "text-sm sm:text-base text-text-primary",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
