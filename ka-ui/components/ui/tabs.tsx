"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // width-stable, wraps to new row when needed
      "h-10 w-full flex flex-wrap items-center justify-start gap-1",
      "rounded-xl border border-border bg-background/60 p-1",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap",
      "rounded-lg px-3 py-1.5 text-sm transition",
      "text-text/70 hover:text-text",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
      "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
      className
    )}
    {...props}
  >
    {/* label */}
    <span className="relative z-10">{children}</span>

    {/* animated underline */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-2 -bottom-[6px] h-px origin-center scale-x-0 bg-primary/60 transition-transform duration-200 data-[state=active]:scale-x-100"
    />
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName
